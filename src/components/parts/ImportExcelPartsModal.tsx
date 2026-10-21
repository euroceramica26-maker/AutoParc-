import React, { useState, useRef } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  Check, 
  AlertCircle, 
  Boxes, 
  CheckCircle2,
  FileDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { PieceRechange, CategoriePiece } from '../../types/fleet';
import { useFleet } from '../../context/FleetContext';
import { formatDH } from '../../utils/formatters';

interface ImportExcelPartsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedRow {
  reference: string;
  designation: string;
  categorie: CategoriePiece;
  stockActuel: number;
  stockMin: number;
  prixUnitaire: number;
  emplacement: string;
  fournisseur: string;
  compatibilites: string[];
  isValid: boolean;
  error?: string;
}

const VALID_CATEGORIES: CategoriePiece[] = [
  'Filtration',
  'Freinage',
  'Moteur',
  'Hydraulique',
  'Électricité',
  'Pneumatique',
  'Lubrifiants & Fluides',
  'Transmission'
];

export const ImportExcelPartsModal: React.FC<ImportExcelPartsModalProps> = ({
  isOpen,
  onClose
}) => {
  const { importPiecesFromExcel } = useFleet();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  // Télécharger le modèle Excel modèle prêt à l'emploi
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        Reference: 'FLT-OIL-320',
        Designation: 'Filtre à huile moteur 15W40 Caterpillar',
        Categorie: 'Filtration',
        Stock_Actuel: 8,
        Stock_Min: 3,
        Prix_Unitaire_DH: 380.00,
        Emplacement: 'Magasin A - Rayon 1 - Bac 04',
        Fournisseur: 'Cat Parts Maroc',
        Compatibilites: 'Caterpillar 320 GC, Komatsu WA380'
      },
      {
        Reference: 'BRK-PAD-ACTROS',
        Designation: 'Jeu plaquettes de frein essieu avant Knorr',
        Categorie: 'Freinage',
        Stock_Actuel: 4,
        Stock_Min: 2,
        Prix_Unitaire_DH: 1450.00,
        Emplacement: 'Magasin B - Étagère 2',
        Fournisseur: 'AutoDistribution Maroc',
        Compatibilites: 'Mercedes Actros 2645, Volvo FH 500'
      },
      {
        Reference: 'HYD-FLEX-38',
        Designation: 'Flexible hydraulique haute pression 3/8"',
        Categorie: 'Hydraulique',
        Stock_Actuel: 6,
        Stock_Min: 2,
        Prix_Unitaire_DH: 780.00,
        Emplacement: 'Magasin A - Râtelier Flexible',
        Fournisseur: 'Hydro-Maroc Services',
        Compatibilites: 'Caterpillar, Komatsu, Manitou'
      },
      {
        Reference: 'LUB-15W40-20L',
        Designation: 'Huile Moteur TP 15W40 Bidon 20 Litres',
        Categorie: 'Lubrifiants & Fluides',
        Stock_Actuel: 15,
        Stock_Min: 5,
        Prix_Unitaire_DH: 850.00,
        Emplacement: 'Zone Lubrifiants Fût 3',
        Fournisseur: 'Afriquia / Total Lubrifiants',
        Compatibilites: 'Tous engins TP et camions'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pieces_Rechange');
    XLSX.writeFile(workbook, 'modele_import_pieces_autoparc.xlsx');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setParseError(null);
    setImportSuccessCount(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          setParseError('Le fichier est vide ou la feuille ne contient aucune ligne de données.');
          setIsProcessing(false);
          return;
        }

        const rows: ParsedRow[] = rawJson.map((row: any, index: number) => {
          // Normalize column keys
          const ref = String(
            row['Reference'] || row['reference'] || row['Ref'] || row['ref'] || row['Code'] || row['SKU'] || ''
          ).trim().toUpperCase();

          const desig = String(
            row['Designation'] || row['designation'] || row['Nom'] || row['nom'] || row['Description'] || ''
          ).trim();

          const catRaw = String(
            row['Categorie'] || row['categorie'] || row['Famille'] || row['famille'] || 'Filtration'
          ).trim();

          // Validate or fallback category
          const foundCat = VALID_CATEGORIES.find(c => c.toLowerCase() === catRaw.toLowerCase()) || 'Filtration';

          const stockAct = Number(
            row['Stock_Actuel'] ?? row['stock_actuel'] ?? row['Stock'] ?? row['stock'] ?? row['Quantite'] ?? 0
          );

          const stockM = Number(
            row['Stock_Min'] ?? row['stock_min'] ?? row['Min'] ?? row['min'] ?? row['Seuil_Min'] ?? 2
          );

          const pu = Number(
            row['Prix_Unitaire_DH'] ?? row['Prix_Unitaire'] ?? row['prix_unitaire'] ?? row['Prix'] ?? row['prix'] ?? row['PU'] ?? 0
          );

          const empl = String(
            row['Emplacement'] || row['emplacement'] || row['Rayon'] || 'Magasin Central'
          ).trim();

          const fourn = String(
            row['Fournisseur'] || row['fournisseur'] || 'Fournisseur Agréé'
          ).trim();

          const compatRaw = String(
            row['Compatibilites'] || row['compatibilites'] || row['Compatibilite'] || ''
          );
          const compatList = compatRaw.split(',').map(s => s.trim()).filter(Boolean);

          const isValid = !!ref && !!desig;

          return {
            reference: ref,
            designation: desig,
            categorie: foundCat,
            stockActuel: isNaN(stockAct) ? 0 : Math.max(0, stockAct),
            stockMin: isNaN(stockM) ? 2 : Math.max(0, stockM),
            prixUnitaire: isNaN(pu) ? 0 : Math.max(0, pu),
            emplacement: empl || 'Magasin Central',
            fournisseur: fourn || 'Fournisseur Agréé',
            compatibilites: compatList,
            isValid,
            error: !isValid ? 'Référence ou désignation manquante' : undefined
          };
        });

        setParsedRows(rows);
      } catch (err: any) {
        console.error('Erreur lecture fichier Excel', err);
        setParseError(`Erreur lors de la lecture du fichier : ${err.message || 'Format invalide'}`);
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) return;

    const count = importPiecesFromExcel(validRows.map(r => ({
      reference: r.reference,
      designation: r.designation,
      categorie: r.categorie,
      stockActuel: r.stockActuel,
      stockMin: r.stockMin,
      prixUnitaire: r.prixUnitaire,
      emplacement: r.emplacement,
      fournisseur: r.fournisseur,
      compatibilites: r.compatibilites
    })));

    setImportSuccessCount(count);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const validCount = parsedRows.filter(r => r.isValid).length;
  const invalidCount = parsedRows.filter(r => !r.isValid).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Importer des Pièces de Rechange (Excel / CSV)
              </h2>
              <p className="text-[11px] text-slate-400">
                Insertion et mise à jour en masse du catalogue de pièces depuis un fichier .xlsx, .xls ou .csv
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
          {importSuccessCount !== null ? (
            <div className="p-6 rounded-xl bg-emerald-950/40 border border-emerald-800 text-center space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="text-base font-bold text-white">Importation réussie !</h3>
              <p className="text-slate-300">
                <strong className="text-emerald-400 font-mono text-lg">{importSuccessCount}</strong> références de pièces de rechange ont été insérées dans le stock.
              </p>
            </div>
          ) : (
            <>
              {/* Template Download Banner */}
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="font-semibold text-white block">Vous n'avez pas encore préparé votre fichier ?</span>
                  <p className="text-[11px] text-slate-400">
                    Téléchargez notre modèle Excel (.xlsx) contenant les colonnes requises et des exemples de pièces.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-amber-400 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 border border-slate-600"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Télécharger le modèle Excel</span>
                </button>
              </div>

              {/* Upload Zone */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="p-6 border-2 border-dashed border-slate-700 hover:border-amber-500/80 rounded-xl bg-slate-800/30 text-center cursor-pointer transition-colors space-y-2"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Upload className="w-8 h-8 text-amber-400 mx-auto" />
                <div className="font-semibold text-white">
                  {fileName ? (
                    <span className="text-amber-400 font-mono">{fileName}</span>
                  ) : (
                    <span>Cliquez ici pour choisir votre fichier Excel (.xlsx, .xls ou .csv)</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Colonnes reconnues : Reference, Designation, Categorie, Stock_Actuel, Stock_Min, Prix_Unitaire_DH, Emplacement, Fournisseur
                </p>
              </div>

              {parseError && (
                <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}

              {/* Preview table */}
              {parsedRows.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">
                      Aperçu des données extraites ({parsedRows.length} lignes trouvées)
                    </span>
                    <div className="flex items-center gap-2 text-[11px] font-mono">
                      <span className="text-emerald-400 font-semibold">{validCount} prêtes</span>
                      {invalidCount > 0 && (
                        <span className="text-rose-400 font-semibold">· {invalidCount} invalide(s)</span>
                      )}
                    </div>
                  </div>

                  <div className="border border-slate-800 rounded-lg overflow-x-auto max-h-56">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-800/80 text-slate-400 sticky top-0">
                        <tr>
                          <th className="py-2 px-3">Statut</th>
                          <th className="py-2 px-3">Référence</th>
                          <th className="py-2 px-3">Désignation</th>
                          <th className="py-2 px-3">Catégorie</th>
                          <th className="py-2 px-3 text-center">Stock</th>
                          <th className="py-2 px-3 text-right">Prix Unit.</th>
                          <th className="py-2 px-3">Emplacement</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {parsedRows.slice(0, 10).map((row, idx) => (
                          <tr key={idx} className={row.isValid ? 'hover:bg-slate-800/40' : 'bg-rose-950/20'}>
                            <td className="py-1.5 px-3">
                              {row.isValid ? (
                                <span className="text-emerald-400 font-semibold">Valide</span>
                              ) : (
                                <span className="text-rose-400 font-semibold">{row.error}</span>
                              )}
                            </td>
                            <td className="py-1.5 px-3 font-mono text-amber-400 font-bold">{row.reference}</td>
                            <td className="py-1.5 px-3 text-slate-200 truncate max-w-xs">{row.designation}</td>
                            <td className="py-1.5 px-3 text-slate-300">{row.categorie}</td>
                            <td className="py-1.5 px-3 text-center font-mono font-bold text-white">{row.stockActuel}</td>
                            <td className="py-1.5 px-3 text-right font-mono text-slate-300">{formatDH(row.prixUnitaire)}</td>
                            <td className="py-1.5 px-3 text-slate-400 truncate max-w-[120px]">{row.emplacement}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parsedRows.length > 10 && (
                    <p className="text-[10px] text-slate-500 italic text-right">
                      Affichage des 10 premières lignes sur {parsedRows.length}...
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {/* Footer buttons */}
          {importSuccessCount === null && (
            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={validCount === 0 || isProcessing}
                className="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>Confirmer l'insertion ({validCount} pièces)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
