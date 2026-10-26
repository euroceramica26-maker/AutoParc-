import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Vehicule, Reparation } from '../types/fleet';
import { formatDH } from './formatters';

export interface ActivityReportData {
  periodeLabel: string;
  periodeCode: string;
  dateEdition: string;
  totalDepenses: number;
  totalPieces: number;
  totalMO: number;
  otTermines: number;
  otEnCours: number;
  tauxDisponibilite: number;
  totalVehicules: number;
  coutsParVehicule: Array<{
    vehicule: Vehicule;
    nbInterventions: number;
    piecesCost: number;
    moCost: number;
    totalCost: number;
  }>;
  filteredRepairs: Reparation[];
  vehicules: Vehicule[];
  currentUserNom?: string;
}

/**
 * Génère et déclenche le téléchargement direct du rapport de synthèse mensuelle en fichier PDF natif
 */
export const downloadActivityReportPDF = (data: ActivityReportData): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // 1. En-tête officiel / Branding
  // Bandeau supérieur coloré
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Liseré ambre
  doc.setFillColor(245, 158, 11); // amber-500
  doc.rect(0, 27, pageWidth, 1.5, 'F');

  // Logo / Titre Entreprise
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('AUTOPARC', margin, 12);

  doc.setTextColor(245, 158, 11); // amber-500
  doc.text('PRO', margin + 35, 12);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Direction Matériel & Gestion de Flotte Automobile / Engins TP', margin, 18);
  doc.text('Division Maintenance Technique & Contrôle des Coûts d\'Exploitation', margin, 23);

  // Badge Période à droite dans le bandeau
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(245, 158, 11);
  doc.text(data.periodeLabel.toUpperCase(), pageWidth - margin, 13, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`Édité le : ${data.dateEdition}`, pageWidth - margin, 19, { align: 'right' });
  if (data.currentUserNom) {
    doc.text(`Par : ${data.currentUserNom}`, pageWidth - margin, 24, { align: 'right' });
  }

  // 2. Titre du Document
  let currentY = 36;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('SYNTHÈSE MENSUELLE DE MAINTENANCE & ANALYSE FINANCIÈRE', margin, currentY);

  currentY += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Bilan synthétique des interventions mécaniques, consommation de pièces et coûts de maintenance (${data.periodeLabel}).`,
    margin,
    currentY
  );

  // 3. Cadres Indicateurs Clés (KPI Cards en 4 colonnes)
  currentY += 6;
  const cardWidth = (pageWidth - margin * 2 - 9) / 4;
  const cardHeight = 18;

  const kpis = [
    {
      title: 'DÉPENSES TOTALES',
      value: formatDH(data.totalDepenses),
      sub: `${data.filteredRepairs.length} interventions`,
      bgColor: [254, 243, 199], // amber-100
      borderColor: [245, 158, 11], // amber-500
      textColor: [180, 83, 9] // amber-700
    },
    {
      title: 'FOURNITURES & PIÈCES',
      value: formatDH(data.totalPieces),
      sub: `${data.totalDepenses > 0 ? Math.round((data.totalPieces / data.totalDepenses) * 100) : 0}% du budget`,
      bgColor: [241, 245, 249],
      borderColor: [203, 213, 225],
      textColor: [30, 41, 59]
    },
    {
      title: 'MAIN D\'ŒUVRE ATELIER',
      value: formatDH(data.totalMO),
      sub: `${data.totalDepenses > 0 ? Math.round((data.totalMO / data.totalDepenses) * 100) : 0}% du budget`,
      bgColor: [241, 245, 249],
      borderColor: [203, 213, 225],
      textColor: [30, 41, 59]
    },
    {
      title: 'DISPONIBILITÉ FLOTTE',
      value: `${data.tauxDisponibilite}%`,
      sub: `${data.totalVehicules} engins / ${data.otTermines} OT clos`,
      bgColor: [236, 253, 245], // emerald-50
      borderColor: [16, 185, 129], // emerald-500
      textColor: [4, 120, 87] // emerald-700
    }
  ];

  kpis.forEach((kpi, idx) => {
    const x = margin + idx * (cardWidth + 3);

    // Fond
    doc.setFillColor(kpi.bgColor[0], kpi.bgColor[1], kpi.bgColor[2]);
    doc.setDrawColor(kpi.borderColor[0], kpi.borderColor[1], kpi.borderColor[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

    // Titre
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.title, x + 2.5, currentY + 4.5);

    // Valeur
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(kpi.textColor[0], kpi.textColor[1], kpi.textColor[2]);
    doc.text(kpi.value, x + 2.5, currentY + 10.5);

    // Sous-titre
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.sub, x + 2.5, currentY + 15);
  });

  currentY += cardHeight + 8;

  // 4. Tableau 1 : Ventilation des Dépenses par Véhicule / Équipement
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Ventilation des Dépenses par Engin & Véhicule (Classé par coût décroissant)', margin, currentY);

  const vehicleRows = data.coutsParVehicule.map(item => [
    item.vehicule.code,
    item.vehicule.immatriculation,
    `${item.vehicule.marque} ${item.vehicule.modele}`,
    item.vehicule.type,
    `${item.vehicule.compteurActuel.toLocaleString('fr-FR')} ${item.vehicule.compteurType}`,
    item.nbInterventions.toString(),
    formatDH(item.piecesCost),
    formatDH(item.moCost),
    formatDH(item.totalCost)
  ]);

  // Ligne de total
  const vehicleTotalRow = [
    'TOTAL GÉNÉRAL',
    '',
    `${data.vehicules.length} engins sous gestion`,
    '',
    '',
    data.filteredRepairs.length.toString(),
    formatDH(data.totalPieces),
    formatDH(data.totalMO),
    formatDH(data.totalDepenses)
  ];

  autoTable(doc, {
    startY: currentY + 3,
    head: [[
      'Code',
      'Immat',
      'Marque & Modèle',
      'Catégorie',
      'Compteur',
      'Nb OT',
      'Coût Pièces',
      'Coût MO',
      'Total Maintenance'
    ]],
    body: [...vehicleRows, vehicleTotalRow],
    theme: 'grid',
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [30, 41, 59],
      valign: 'middle',
      lineColor: [226, 232, 240],
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'left'
    },
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'left', cellWidth: 16 },
      1: { halign: 'left', cellWidth: 20 },
      2: { halign: 'left', cellWidth: 38 },
      3: { halign: 'left', cellWidth: 20 },
      4: { halign: 'right', cellWidth: 22 },
      5: { halign: 'center', cellWidth: 12 },
      6: { halign: 'right', cellWidth: 20 },
      7: { halign: 'right', cellWidth: 20 },
      8: { halign: 'right', fontStyle: 'bold', cellWidth: 24 }
    },
    didParseCell: (hookData) => {
      // Mettre en valeur la ligne de total général
      if (hookData.section === 'body' && hookData.row.index === vehicleRows.length) {
        hookData.cell.styles.fontStyle = 'bold';
        hookData.cell.styles.fillColor = [241, 245, 249];
        if (hookData.column.index === 8) {
          hookData.cell.styles.textColor = [180, 83, 9]; // amber-700
          hookData.cell.styles.fontSize = 8;
        }
      }
    }
  });

  // Récupérer la position après le premier tableau
  const lastAutoTable = (doc as any).lastAutoTable;
  currentY = (lastAutoTable ? lastAutoTable.finalY : currentY + 60) + 10;

  // Si on est trop bas sur la page, passer à la page suivante
  if (currentY > pageHeight - 65) {
    doc.addPage();
    currentY = 20;
  }

  // 5. Tableau 2 : Journal des Ordres de Travaux de la Période
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('2. Journal Détaillé des Ordres de Travaux (OT)', margin, currentY);

  const repairRows = data.filteredRepairs.map(rep => {
    const v = data.vehicules.find(item => item.id === rep.vehiculeId);
    return [
      rep.dateDeclaration,
      rep.numeroOT,
      v ? `${v.code} (${v.immatriculation})` : 'N/C',
      rep.titre,
      rep.technicien,
      rep.statut === 'TERMINEE' ? 'Terminée' : rep.statut === 'EN_COURS' ? 'En cours' : rep.statut,
      formatDH(rep.coutTotal)
    ];
  });

  autoTable(doc, {
    startY: currentY + 3,
    head: [[
      'Date',
      'N° OT',
      'Équipement / Immat',
      'Objet des Travaux',
      'Intervenant',
      'Statut',
      'Montant Total'
    ]],
    body: repairRows.length > 0 ? repairRows : [['-', '-', 'Aucun ordre de travail sur cette période', '-', '-', '-', '-']],
    theme: 'grid',
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [30, 41, 59],
      valign: 'middle',
      lineColor: [226, 232, 240],
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: [51, 65, 85], // slate-700
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 18 },
      1: { fontStyle: 'bold', halign: 'left', cellWidth: 22 },
      2: { halign: 'left', cellWidth: 32 },
      3: { halign: 'left', cellWidth: 50 },
      4: { halign: 'left', cellWidth: 26 },
      5: { halign: 'center', cellWidth: 18 },
      6: { halign: 'right', fontStyle: 'bold', cellWidth: 24 }
    }
  });

  // 6. Cadre Signatures & Visas
  const afterRepairsTable = (doc as any).lastAutoTable;
  let signY = (afterRepairsTable ? afterRepairsTable.finalY : currentY + 50) + 12;

  // Si pas assez de place pour les signatures, ajouter une page
  if (signY > pageHeight - 35) {
    doc.addPage();
    signY = 25;
  }

  const signWidth = (pageWidth - margin * 2 - 10) / 2;
  const signHeight = 24;

  // Box 1 : Responsable Matériel
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.rect(margin, signY, signWidth, signHeight);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Le Responsable Matériel & Logistique :', margin + 4, signY + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Visa & Signature pour validation technique :', margin + 4, signY + 9.5);

  // Box 2 : Direction d'Exploitation
  const signX2 = margin + signWidth + 10;
  doc.rect(signX2, signY, signWidth, signHeight);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('La Direction d\'Exploitation & Financière :', signX2 + 4, signY + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Visa & Bon pour approbation budgétaire :', signX2 + 4, signY + 9.5);

  // 7. Numérotation des pages & pied de page global
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);

    // Ligne de pied de page
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(margin, pageHeight - 8, pageWidth - margin, pageHeight - 8);

    doc.text(
      'AutoParc PRO - Système Intégré de Gestion de Parc Matériel & Maintenance',
      margin,
      pageHeight - 4.5
    );

    doc.text(
      `Page ${i} sur ${totalPages} · Document Officiel Confidentiel`,
      pageWidth - margin,
      pageHeight - 4.5,
      { align: 'right' }
    );
  }

  // 8. Téléchargement du fichier PDF
  const safePeriode = data.periodeCode.toLowerCase();
  const filename = `Synthese_Maintenance_Couts_${safePeriode}_2026.pdf`;
  doc.save(filename);
};
