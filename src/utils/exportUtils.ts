import * as XLSX from 'xlsx';

/**
 * Télécharge un Blob de manière fiable dans l'environnement web / iframe
 */
export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();

  // Différer la suppression et la révocation pour laisser le temps au navigateur de traiter l'événement
  setTimeout(() => {
    if (document.body.contains(anchor)) {
      document.body.removeChild(anchor);
    }
    window.URL.revokeObjectURL(url);
  }, 1000);
};

export interface SheetDefinition {
  name: string;
  data: Record<string, any>[];
  colWidths?: { wch: number }[];
}

/**
 * Exporte des données sous forme de classeur Excel (.xlsx) avec SheetJS
 */
export const exportToExcel = (
  sheets: SheetDefinition[],
  filename: string
): void => {
  const workbook = XLSX.utils.book_new();

  sheets.forEach(sheetDef => {
    const ws = XLSX.utils.json_to_sheet(sheetDef.data);
    if (sheetDef.colWidths && sheetDef.colWidths.length > 0) {
      ws['!cols'] = sheetDef.colWidths;
    }
    // Nettoyer le nom de la feuille (max 31 caractères, pas de caractères interdits)
    const safeSheetName = sheetDef.name.replace(/[:\\/?*\[\]]/g, '_').substring(0, 31);
    XLSX.utils.book_append_sheet(workbook, ws, safeSheetName);
  });

  // Générer le binaire sous forme d'ArrayBuffer pour un Blob standard
  const excelBuffer = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array'
  });

  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
  });

  const cleanFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  downloadBlob(blob, cleanFilename);
};

/**
 * Exporte des données au format CSV avec encodage UTF-8 BOM et séparateur point-virgule (standard Excel FR)
 */
export const exportToCSV = (
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][],
  filename: string
): void => {
  const escapeCell = (cell: any): string => {
    if (cell === null || cell === undefined) return '""';
    const str = String(cell);
    return `"${str.replace(/"/g, '""')}"`;
  };

  const formattedHeader = headers.map(escapeCell).join(';');
  const formattedRows = rows.map(row => row.map(escapeCell).join(';'));
  
  // UTF-8 BOM (\uFEFF) pour forcer Excel à lire les caractères accentués correctement
  const csvContent = '\uFEFF' + [formattedHeader, ...formattedRows].join('\r\n');

  const blob = new Blob([csvContent], {
    type: 'text/csv;charset=utf-8;'
  });

  const cleanFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  downloadBlob(blob, cleanFilename);
};
