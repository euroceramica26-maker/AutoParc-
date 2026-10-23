import { Reparation, Vehicule } from '../types/fleet';
import { formatDH } from './formatters';
import { exportToExcel, exportToCSV, downloadBlob } from './exportUtils';

/**
 * Génère le contenu HTML complet et stylisé pour le Bon d'Ordre de Travail (format A4 officiel)
 */
export const generateWorkOrderHtml = (reparation: Reparation, vehicule?: Vehicule): string => {
  const pieces = reparation.piecesUtilisees || [];
  const piecesTotal = pieces.reduce((sum, p) => sum + (Number(p.prixUnitaire || 0) * Number(p.quantite || 0)), 0);
  const totalCost = Number(reparation.coutTotal || (piecesTotal + Number(reparation.coutMainOeuvre || 0)));
  const currentDate = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'TERMINEE': return { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0', label: 'TERMINÉE / CLÔTURÉE' };
      case 'EN_COURS': return { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe', label: 'EN COURS D\'EXÉCUTION' };
      case 'EN_ATTENTE_PIECES': return { bg: '#fffbeb', text: '#92400e', border: '#fde68a', label: 'EN ATTENTE PIÈCES' };
      case 'PLANIFIEE': return { bg: '#f1f5f9', text: '#334155', border: '#cbd5e1', label: 'PLANIFIÉE' };
      default: return { bg: '#f8fafc', text: '#475569', border: '#e2e8f0', label: statut };
    }
  };

  const getPrioriteColor = (priorite: string) => {
    switch (priorite) {
      case 'URGENTE': return { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5', label: 'URGENTE (IMMOBILISATION)' };
      case 'HAUTE': return { bg: '#fef3c7', text: '#92400e', border: '#fcd34d', label: 'HAUTE PRIORITÉ' };
      case 'NORMALE': return { bg: '#f1f5f9', text: '#334155', border: '#cbd5e1', label: 'NORMALE' };
      default: return { bg: '#f8fafc', text: '#475569', border: '#e2e8f0', label: priorite };
    }
  };

  const stBadge = getStatutColor(reparation.statut);
  const prBadge = getPrioriteColor(reparation.priorite);

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Ordre de Travail - ${reparation.numeroOT}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      background: #f8fafc;
      padding: 20px;
      font-size: 12px;
      line-height: 1.4;
    }
    .page-container {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      padding: 30px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .no-print-bar {
      max-width: 800px;
      margin: 0 auto 15px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #0f172a;
      color: #ffffff;
      padding: 10px 18px;
      border-radius: 6px;
    }
    .print-btn {
      background: #f59e0b;
      color: #0f172a;
      font-weight: 700;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }
    .print-btn:hover {
      background: #fbbf24;
    }
    .header-table {
      width: 100%;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .company-title {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
    }
    .company-sub {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }
    .doc-badge-container {
      text-align: right;
    }
    .doc-main-number {
      font-family: monospace;
      font-size: 20px;
      font-weight: 800;
      color: #b45309;
      background: #fef3c7;
      border: 1px solid #fde68a;
      padding: 4px 10px;
      border-radius: 4px;
      display: inline-block;
    }
    .badges-row {
      display: flex;
      gap: 8px;
      margin-top: 6px;
      justify-content: flex-end;
    }
    .badge {
      font-size: 10px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
      text-transform: uppercase;
      border-width: 1px;
      border-style: solid;
    }
    .section-title {
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
      background: #f1f5f9;
      padding: 5px 10px;
      border-left: 4px solid #f59e0b;
      margin-top: 14px;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 10px;
    }
    .info-card {
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 8px 10px;
      background: #fafafa;
    }
    .info-label {
      font-size: 10px;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 600;
      display: block;
      margin-bottom: 2px;
    }
    .info-val {
      font-size: 12px;
      font-weight: 600;
      color: #0f172a;
    }
    .info-val.mono {
      font-family: monospace;
    }
    .desc-box {
      border: 1px solid #e2e8f0;
      padding: 10px 12px;
      border-radius: 4px;
      background: #ffffff;
      margin-top: 4px;
      line-height: 1.5;
      color: #334155;
    }
    .desc-title {
      font-weight: 700;
      color: #0f172a;
      font-size: 13px;
      margin-bottom: 4px;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
      font-size: 11px;
    }
    table.data-table th {
      background: #f1f5f9;
      color: #475569;
      font-weight: 700;
      text-align: left;
      padding: 7px 10px;
      border: 1px solid #e2e8f0;
      text-transform: uppercase;
      font-size: 10px;
    }
    table.data-table td {
      padding: 6px 10px;
      border: 1px solid #e2e8f0;
    }
    table.data-table tbody tr:nth-child(even) {
      background: #fafafa;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .totals-wrapper {
      margin-top: 12px;
      display: flex;
      justify-content: flex-end;
    }
    .totals-table {
      width: 320px;
      border-collapse: collapse;
    }
    .totals-table td {
      padding: 5px 8px;
    }
    .totals-table tr.total-row {
      border-top: 2px solid #0f172a;
      background: #fef3c7;
      font-size: 13px;
      font-weight: 800;
      color: #78350f;
    }
    .signatures-block {
      margin-top: 24px;
      border-top: 1px dashed #cbd5e1;
      padding-top: 14px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
    }
    .signature-card {
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 10px 12px;
      background: #fafafa;
      height: 100px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .signature-title {
      font-weight: 700;
      color: #334155;
      font-size: 10px;
      text-transform: uppercase;
    }
    .footer-note {
      margin-top: 20px;
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
      text-align: center;
      font-size: 9px;
      color: #94a3b8;
    }
    @media print {
      body {
        padding: 0;
        background: #ffffff;
      }
      .page-container {
        border: none;
        box-shadow: none;
        padding: 0;
        max-width: 100%;
      }
      .no-print-bar {
        display: none !important;
      }
    }
  </style>
</head>
<body>

  <!-- Barre d'outils navigateur (masquée à l'impression) -->
  <div class="no-print-bar">
    <div>
      <strong>AutoParc PRO Entreprise</strong> · Bon d'Intervention Technique Officiel
    </div>
    <div>
      <button class="print-btn" onclick="window.print()">
        🖨️ Imprimer / Enregistrer en PDF
      </button>
    </div>
  </div>

  <div class="page-container">
    <!-- En-tête -->
    <table class="header-table">
      <tr>
        <td style="vertical-align: top;">
          <div class="company-title">AUTOPARC PRO SERVICES</div>
          <div class="company-sub">Direction Matériel & Gestion de Flotte Automobile / Engins TP</div>
          <div class="company-sub">Division Maintenance Technique & Suivi des Équipements</div>
          <div class="company-sub" style="margin-top: 4px;">Édité le : <strong>${currentDate}</strong></div>
        </td>
        <td class="doc-badge-container" style="vertical-align: top;">
          <div class="doc-main-number">${reparation.numeroOT}</div>
          <div class="badges-row">
            <span class="badge" style="background: ${stBadge.bg}; color: ${stBadge.text}; border-color: ${stBadge.border};">
              ${stBadge.label}
            </span>
            <span class="badge" style="background: ${prBadge.bg}; color: ${prBadge.text}; border-color: ${prBadge.border};">
              ${prBadge.label}
            </span>
          </div>
        </td>
      </tr>
    </table>

    <!-- 1. Identification Véhicule -->
    <div class="section-title">1. Identification de l'Équipement / Véhicule</div>
    <div class="grid-3">
      <div class="info-card">
        <span class="info-label">Code Matériel / Parc</span>
        <span class="info-val mono">${vehicule?.code || 'N/C'}</span>
      </div>
      <div class="info-card">
        <span class="info-label">Immatriculation / N° Série</span>
        <span class="info-val mono" style="color: #b45309;">${vehicule?.immatriculation || 'N/C'}</span>
      </div>
      <div class="info-card">
        <span class="info-label">Marque & Modèle</span>
        <span class="info-val">${vehicule ? `${vehicule.marque} ${vehicule.modele}` : 'Non assigné'}</span>
      </div>
      <div class="info-card">
        <span class="info-label">Relevé Compteur Intervention</span>
        <span class="info-val mono">${reparation.compteurReleve.toLocaleString()} ${vehicule?.compteurType || 'km'}</span>
      </div>
      <div class="info-card">
        <span class="info-label">Conducteur / Opérateur</span>
        <span class="info-val">${vehicule?.conducteur || 'Non assigné'}</span>
      </div>
      <div class="info-card">
        <span class="info-label">Site d'affectation</span>
        <span class="info-val">${vehicule?.siteAffectation || 'Atelier Central'}</span>
      </div>
    </div>

    <!-- 2. Diagnostic & Nature des travaux -->
    <div class="section-title">2. Diagnostic Technique & Travaux Demandés</div>
    <div class="desc-box">
      <div class="desc-title">${reparation.titre}</div>
      <p>${reparation.description}</p>
    </div>

    <!-- 3. Intervenant & Dates -->
    <div class="section-title">3. Intervenant & Calendrier d'Exécution</div>
    <div class="grid-3">
      <div class="info-card">
        <span class="info-label">Intervenant / Atelier</span>
        <span class="info-val">${reparation.technicien}</span>
      </div>
      <div class="info-card">
        <span class="info-label">Date Déclaration</span>
        <span class="info-val mono">${reparation.dateDeclaration}</span>
      </div>
      <div class="info-card">
        <span class="info-label">Date Réalisation / Clôture</span>
        <span class="info-val mono">${reparation.dateRealisation || reparation.datePrevue || 'En cours'}</span>
      </div>
    </div>

    <!-- 4. Pièces de Rechange -->
    <div class="section-title">4. Fournitures & Pièces de Rechange Consommées</div>
    ${pieces.length === 0 ? `
      <div style="border: 1px dashed #cbd5e1; padding: 10px; text-align: center; color: #64748b; border-radius: 4px;">
        Aucune pièce de rechange imputée sur cette intervention.
      </div>
    ` : `
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 130px;">Réf. SKU</th>
            <th>Désignation de la pièce</th>
            <th class="text-center" style="width: 70px;">Quantité</th>
            <th class="text-right" style="width: 110px;">Prix Unit. HT</th>
            <th class="text-right" style="width: 120px;">Total Ligne HT</th>
          </tr>
        </thead>
        <tbody>
          ${pieces.map(p => `
            <tr>
              <td style="font-family: monospace; font-weight: 700; color: #b45309;">${p.reference}</td>
              <td style="font-weight: 600;">${p.designation}</td>
              <td class="text-center" style="font-family: monospace; font-weight: 700;">${p.quantite}</td>
              <td class="text-right" style="font-family: monospace;">${formatDH(p.prixUnitaire)}</td>
              <td class="text-right" style="font-family: monospace; font-weight: 700;">${formatDH(p.quantite * p.prixUnitaire)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `}

    <!-- 5. Décompte Financier -->
    <div class="totals-wrapper">
      <table class="totals-table">
        <tr>
          <td style="color: #64748b;">Total Fournitures Pièces :</td>
          <td class="text-right" style="font-family: monospace; font-weight: 700;">${formatDH(reparation.coutPieces)}</td>
        </tr>
        <tr>
          <td style="color: #64748b;">Main d'Œuvre Atelier :</td>
          <td class="text-right" style="font-family: monospace; font-weight: 700;">${formatDH(reparation.coutMainOeuvre)}</td>
        </tr>
        <tr class="total-row">
          <td>COÛT TOTAL INTERVENTION :</td>
          <td class="text-right" style="font-family: monospace;">${formatDH(totalCost)}</td>
        </tr>
      </table>
    </div>

    <!-- 6. Remarques d'atelier -->
    ${reparation.remarques ? `
      <div class="section-title">5. Observations & Contrôle Qualité Atelier</div>
      <div style="border: 1px solid #e2e8f0; padding: 8px 12px; background: #fafafa; border-radius: 4px; color: #334155;">
        ${reparation.remarques}
      </div>
    ` : ''}

    <!-- 7. Visas & Signatures -->
    <div class="signatures-block">
      <div class="signature-card">
        <span class="signature-title">Visa Chef d'Atelier / Mécanicien Intervenant :</span>
        <div style="font-size: 10px; color: #64748b; border-top: 1px solid #cbd5e1; padding-top: 4px;">
          Nom & Date : ____________________
        </div>
      </div>
      <div class="signature-card">
        <span class="signature-title">Visa Responsable Parc Matériel & Direction :</span>
        <div style="font-size: 10px; color: #64748b; border-top: 1px solid #cbd5e1; padding-top: 4px;">
          Validation Bon Pour Accord : ________
        </div>
      </div>
    </div>

    <div class="footer-note">
      Document officiel généré par AutoParc PRO Entreprise · Traçabilité ISO Maintenance & Suivi Réglementaire des Véhicules et Engins
    </div>
  </div>

</body>
</html>`;
};

/**
 * Télécharge le document officiel de l'Ordre de Travail sous format HTML/A4 imprimable autonome
 */
export const downloadWorkOrderDocument = (reparation: Reparation, vehicule?: Vehicule): void => {
  const htmlContent = generateWorkOrderHtml(reparation, vehicule);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  downloadBlob(blob, `Ordre_de_Travail_${reparation.numeroOT}.html`);
};

/**
 * Lance l'impression isolée du document de l'Ordre de Travail via un iframe masqué
 */
export const printWorkOrderDocument = (reparation: Reparation, vehicule?: Vehicule): void => {
  const htmlContent = generateWorkOrderHtml(reparation, vehicule);

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  doc.open();
  doc.write(htmlContent);
  doc.close();

  iframe.contentWindow?.focus();
  setTimeout(() => {
    iframe.contentWindow?.print();
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 1500);
  }, 400);
};

/**
 * Exporte l'Ordre de Travail en fichier Excel (.xlsx) avec classeur structuré
 */
export const downloadWorkOrderExcel = (reparation: Reparation, vehicule?: Vehicule): void => {
  const generalData = [
    { 'Propriété': 'Numéro Ordre de Travail', 'Valeur': reparation.numeroOT },
    { 'Propriété': 'Statut d\'avancement', 'Valeur': reparation.statut },
    { 'Propriété': 'Niveau de Priorité', 'Valeur': reparation.priorite },
    { 'Propriété': 'Type d\'Intervention', 'Valeur': reparation.type },
    { 'Propriété': 'Objet / Titre', 'Valeur': reparation.titre },
    { 'Propriété': 'Diagnostic & Description', 'Valeur': reparation.description },
    { 'Propriété': 'Matériel / Code Parc', 'Valeur': vehicule?.code || 'N/C' },
    { 'Propriété': 'Immatriculation', 'Valeur': vehicule?.immatriculation || 'N/C' },
    { 'Propriété': 'Marque & Modèle', 'Valeur': vehicule ? `${vehicule.marque} ${vehicule.modele}` : 'N/C' },
    { 'Propriété': 'Compteur Relevé', 'Valeur': `${reparation.compteurReleve} ${vehicule?.compteurType || 'km'}` },
    { 'Propriété': 'Site Affectation', 'Valeur': vehicule?.siteAffectation || 'Atelier' },
    { 'Propriété': 'Conducteur', 'Valeur': vehicule?.conducteur || 'Non assigné' },
    { 'Propriété': 'Intervenant / Atelier', 'Valeur': reparation.technicien },
    { 'Propriété': 'Date Déclaration', 'Valeur': reparation.dateDeclaration },
    { 'Propriété': 'Date Réalisation', 'Valeur': reparation.dateRealisation || reparation.datePrevue },
    { 'Propriété': 'Coût Pièces (DH)', 'Valeur': reparation.coutPieces },
    { 'Propriété': 'Coût Main d\'œuvre (DH)', 'Valeur': reparation.coutMainOeuvre },
    { 'Propriété': 'Coût Total Intervention (DH)', 'Valeur': reparation.coutTotal },
    { 'Propriété': 'Remarques & Observations', 'Valeur': reparation.remarques || '' }
  ];

  const piecesData = (reparation.piecesUtilisees || []).map(p => ({
    'N° OT': reparation.numeroOT,
    'Référence SKU': p.reference,
    'Désignation': p.designation,
    'Quantité': p.quantite,
    'Prix Unitaire HT (DH)': p.prixUnitaire,
    'Total Ligne HT (DH)': p.quantite * p.prixUnitaire
  }));

  exportToExcel([
    {
      name: `OT_${reparation.numeroOT}`,
      data: generalData,
      colWidths: [{ wch: 30 }, { wch: 50 }]
    },
    {
      name: 'Fournitures_Pieces',
      data: piecesData.length > 0 ? piecesData : [{ 'Information': 'Aucune pièce consommée' }],
      colWidths: [{ wch: 16 }, { wch: 20 }, { wch: 35 }, { wch: 12 }, { wch: 20 }, { wch: 20 }]
    }
  ], `Ordre_Travail_${reparation.numeroOT}_${new Date().toISOString().split('T')[0]}`);
};

/**
 * Exporte l'Ordre de Travail au format CSV
 */
export const downloadWorkOrderCSV = (reparation: Reparation, vehicule?: Vehicule): void => {
  const headers = [
    'Numero_OT',
    'Statut',
    'Priorite',
    'Type',
    'Code_Materiel',
    'Immatriculation',
    'Marque_Modele',
    'Compteur',
    'Technicien',
    'Date_Declaration',
    'Date_Realisation',
    'Titre',
    'Description',
    'Cout_Pieces_DH',
    'Cout_MO_DH',
    'Cout_Total_DH',
    'Pieces_Utilisees',
    'Remarques'
  ];

  const piecesStr = (reparation.piecesUtilisees || [])
    .map(p => `${p.reference} (${p.designation} x${p.quantite})`)
    .join(' ; ');

  const rows = [
    [
      reparation.numeroOT,
      reparation.statut,
      reparation.priorite,
      reparation.type,
      vehicule?.code || '',
      vehicule?.immatriculation || '',
      vehicule ? `${vehicule.marque} ${vehicule.modele}` : '',
      `${reparation.compteurReleve} ${vehicule?.compteurType || 'km'}`,
      reparation.technicien,
      reparation.dateDeclaration,
      reparation.dateRealisation || reparation.datePrevue,
      reparation.titre,
      reparation.description,
      reparation.coutPieces.toFixed(2),
      reparation.coutMainOeuvre.toFixed(2),
      reparation.coutTotal.toFixed(2),
      piecesStr,
      reparation.remarques || ''
    ]
  ];

  exportToCSV(headers, rows, `Ordre_Travail_${reparation.numeroOT}`);
};
