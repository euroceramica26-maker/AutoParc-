import React, { useState } from 'react';
import { 
  Wrench, 
  Search, 
  Plus, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  Edit2, 
  Trash2,
  Calendar,
  Layers,
  DollarSign,
  Printer,
  Download,
  FileSpreadsheet,
  FileText,
  Cloud,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { useFleet } from '../../context/FleetContext';
import { Reparation, StatutReparation, TypeReparation, PrioriteReparation } from '../../types/fleet';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';
import { formatDH } from '../../utils/formatters';
import { 
  printWorkOrderDocument, 
  downloadWorkOrderDocument, 
  downloadWorkOrderExcel 
} from '../../utils/workOrderDocument';
import { saveWorkOrderToDrive } from '../../services/googleDriveService';
import { exportToExcel, exportToCSV } from '../../utils/exportUtils';

interface RepairsViewProps {
  onOpenAddModal: () => void;
  onOpenEditModal: (reparation: Reparation) => void;
  onOpenDetailModal: (reparation: Reparation) => void;
  onOpenScanInvoice?: () => void;
}

export const RepairsView: React.FC<RepairsViewProps> = ({
  onOpenAddModal,
  onOpenEditModal,
  onOpenDetailModal,
  onOpenScanInvoice
}) => {
  const { 
    reparations, 
    vehicules, 
    deleteReparation, 
    changerStatutReparation,
    statsGlobales 
  } = useFleet();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatut, setSelectedStatut] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedPriorite, setSelectedPriorite] = useState<string>('ALL');
  const [repairToDelete, setRepairToDelete] = useState<Reparation | null>(null);
  const [savingDriveOTId, setSavingDriveOTId] = useState<string | null>(null);
  const [driveToast, setDriveToast] = useState<{ message: string; link?: string } | null>(null);

  const filteredRepairs = reparations.filter(r => {
    const vehicule = vehicules.find(v => v.id === r.vehiculeId);
    const matchesSearch = 
      r.numeroOT.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.technicien.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (vehicule && (
        vehicule.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicule.immatriculation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicule.marque.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicule.modele.toLowerCase().includes(searchTerm.toLowerCase())
      ));

    const matchesStatut = selectedStatut === 'ALL' || r.statut === selectedStatut;
    const matchesType = selectedType === 'ALL' || r.type === selectedType;
    const matchesPriorite = selectedPriorite === 'ALL' || r.priorite === selectedPriorite;

    return matchesSearch && matchesStatut && matchesType && matchesPriorite;
  });

  const getStatutBadge = (statut: StatutReparation) => {
    switch (statut) {
      case 'TERMINEE':
        return <span className="text-emerald-400 font-semibold">Terminée</span>;
      case 'EN_COURS':
        return <span className="text-blue-400 font-semibold">En cours</span>;
      case 'EN_ATTENTE_PIECES':
        return <span className="text-amber-400 font-semibold">Attente pièces</span>;
      case 'PLANIFIEE':
        return <span className="text-slate-400 font-medium">Planifiée</span>;
      case 'ANNULEE':
        return <span className="text-slate-500 font-medium">Annulée</span>;
    }
  };

  const getPrioriteBadge = (priorite: PrioriteReparation) => {
    switch (priorite) {
      case 'URGENTE':
        return <span className="text-rose-400 font-bold">Urgente</span>;
      case 'HAUTE':
        return <span className="text-amber-400 font-semibold">Haute</span>;
      case 'NORMALE':
        return <span className="text-slate-300">Normale</span>;
      case 'BASSE':
        return <span className="text-slate-500">Basse</span>;
    }
  };

  const handleExportExcel = () => {
    const list = filteredRepairs.length > 0 ? filteredRepairs : reparations;
    const excelRows = list.map(rep => {
      const v = vehicules.find(item => item.id === rep.vehiculeId);
      return {
        'N° OT': rep.numeroOT,
        'Code Matériel': v?.code || 'N/C',
        'Immatriculation': v?.immatriculation || 'N/C',
        'Marque & Modèle': v ? `${v.marque} ${v.modele}` : 'N/C',
        'Titre Intervention': rep.titre,
        'Description': rep.description,
        'Type': rep.type,
        'Priorité': rep.priorite,
        'Statut': rep.statut,
        'Technicien': rep.technicien,
        'Date Déclaration': rep.dateDeclaration,
        'Date Réalisation': rep.dateRealisation || rep.datePrevue,
        'Compteur Relevé': `${rep.compteurReleve} ${v?.compteurType || 'km'}`,
        'Coût Pièces (DH)': rep.coutPieces,
        'Coût Main d\'œuvre (DH)': rep.coutMainOeuvre,
        'Coût Total (DH)': rep.coutTotal,
        'Pièces Utilisées': (rep.piecesUtilisees || []).map(p => `${p.reference} (x${p.quantite})`).join(' ; '),
        'Remarques': rep.remarques || ''
      };
    });

    exportToExcel([
      {
        name: 'Ordres_de_Travail',
        data: excelRows,
        colWidths: [
          { wch: 16 },
          { wch: 14 },
          { wch: 18 },
          { wch: 24 },
          { wch: 30 },
          { wch: 36 },
          { wch: 16 },
          { wch: 12 },
          { wch: 14 },
          { wch: 22 },
          { wch: 14 },
          { wch: 14 },
          { wch: 16 },
          { wch: 16 },
          { wch: 18 },
          { wch: 16 },
          { wch: 30 },
          { wch: 25 }
        ]
      }
    ], `Ordres_de_Travail_Flotte_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportCSV = () => {
    const list = filteredRepairs.length > 0 ? filteredRepairs : reparations;
    const headers = [
      'Numero_OT',
      'Code_Materiel',
      'Immatriculation',
      'Marque_Modele',
      'Titre',
      'Type',
      'Priorite',
      'Statut',
      'Technicien',
      'Date_Declaration',
      'Date_Realisation',
      'Compteur',
      'Cout_Pieces_DH',
      'Cout_MO_DH',
      'Cout_Total_DH'
    ];

    const rows = list.map(rep => {
      const v = vehicules.find(item => item.id === rep.vehiculeId);
      return [
        rep.numeroOT,
        v?.code || '',
        v?.immatriculation || '',
        v ? `${v.marque} ${v.modele}` : '',
        rep.titre,
        rep.type,
        rep.priorite,
        rep.statut,
        rep.technicien,
        rep.dateDeclaration,
        rep.dateRealisation || rep.datePrevue,
        `${rep.compteurReleve} ${v?.compteurType || 'km'}`,
        rep.coutPieces.toFixed(2),
        rep.coutMainOeuvre.toFixed(2),
        rep.coutTotal.toFixed(2)
      ];
    });

    exportToCSV(headers, rows, `Ordres_de_Travail_Flotte_${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Gestion des Réparations & Ordres de Travail
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Planification des révisions, gestion des pannes, impression et téléchargement des bons d'intervention.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportExcel}
            className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Exporter tous les ordres de travail en Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Exporter tous les ordres de travail en CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {onOpenScanInvoice && (
            <button
              onClick={onOpenScanInvoice}
              className="px-3.5 py-1.5 text-xs font-semibold text-amber-300 hover:text-white bg-amber-500/15 hover:bg-amber-500/30 border border-amber-500/40 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Scanner une facture ou devis réparation (OCR IA)"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Scanner Facture (OCR)</span>
            </button>
          )}

          <button
            onClick={onOpenAddModal}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Créer un Ordre de Travail</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (en DH) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Total Interventions Référencées</span>
          <span className="text-xl font-bold font-mono text-white">{reparations.length} OT</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">En cours d'exécution</span>
          <span className="text-xl font-bold font-mono text-blue-400">{statsGlobales.otEnCours}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Urgences Actives</span>
          <span className="text-xl font-bold font-mono text-rose-400">{statsGlobales.otUrgents}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Dépenses de Réparations (Mois)</span>
          <span className="text-xl font-bold font-mono text-amber-400">
            {formatDH(statsGlobales.depensesMoisEnCours)}
          </span>
        </div>
      </div>

      {/* Drive Toast Notification */}
      {driveToast && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{driveToast.message}</span>
          </div>
          {driveToast.link && (
            <a
              href={driveToast.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold underline text-white hover:text-amber-300 cursor-pointer shrink-0"
            >
              <span>Consulter sur Google Drive</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Rechercher par N° OT, titre, technicien, équipement..."
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Statut filter tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-800/80 rounded-lg overflow-x-auto">
            {[
              { id: 'ALL', label: 'Tous' },
              { id: 'EN_COURS', label: 'En cours' },
              { id: 'EN_ATTENTE_PIECES', label: 'Attente pièces' },
              { id: 'PLANIFIEE', label: 'Planifiées' },
              { id: 'TERMINEE', label: 'Terminées' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedStatut(tab.id)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  selectedStatut === tab.id
                    ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="w-full md:w-44">
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="ALL">Tous types</option>
              <option value="PREVENTIVE">Préventive</option>
              <option value="CORRECTIVE">Corrective</option>
              <option value="DEPANNAGE_URGENT">Dépannage Urgent</option>
              <option value="CONTROLE_REGLEMENTAIRE">Contrôle Réglementaire</option>
            </select>
          </div>
        </div>

        {/* Quick search chips */}
        <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
          <span>Accès rapide :</span>
          <button
            onClick={() => setSearchTerm('OT-2026-0045')}
            className={`px-2 py-0.5 rounded font-mono text-[11px] transition-colors cursor-pointer border ${
              searchTerm === 'OT-2026-0045'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold shadow-sm'
                : 'bg-slate-800/90 text-slate-300 hover:text-amber-400 border-slate-700'
            }`}
            title="Filtrer immédiatement l'Ordre de Travail OT-2026-0045"
          >
            OT-2026-0045 (Actros 2642)
          </button>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-slate-500 hover:text-slate-300 underline cursor-pointer ml-1"
            >
              Réinitialiser le filtre ({filteredRepairs.length} résultat{filteredRepairs.length > 1 ? 's' : ''})
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/40 text-slate-400">
                <th className="py-3 px-4 font-medium">N° OT</th>
                <th className="py-3 px-4 font-medium">Équipement / Immatriculation</th>
                <th className="py-3 px-4 font-medium">Nature des travaux</th>
                <th className="py-3 px-4 font-medium">Type</th>
                <th className="py-3 px-4 font-medium">Priorité</th>
                <th className="py-3 px-4 font-medium">Statut</th>
                <th className="py-3 px-4 font-medium text-right">Coût Total</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRepairs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Aucun ordre de travail ne correspond aux filtres.
                  </td>
                </tr>
              ) : (
                filteredRepairs.map(rep => {
                  const vehicule = vehicules.find(v => v.id === rep.vehiculeId);

                  return (
                    <tr key={rep.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <button
                          onClick={() => onOpenDetailModal(rep)}
                          className="font-mono font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                        >
                          {rep.numeroOT}
                        </button>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">{rep.dateDeclaration}</div>
                      </td>

                      <td className="py-3 px-4">
                        {vehicule ? (
                          <div>
                            <div className="font-semibold text-white">{vehicule.code} · {vehicule.immatriculation}</div>
                            <div className="text-[11px] text-slate-400">{vehicule.marque} {vehicule.modele}</div>
                          </div>
                        ) : (
                          <span className="text-slate-500">Non lié</span>
                        )}
                      </td>

                      <td className="py-3 px-4 max-w-sm">
                        <button
                          onClick={() => onOpenDetailModal(rep)}
                          className="text-left group cursor-pointer block"
                        >
                          <div className="font-semibold text-slate-200 group-hover:text-amber-400 transition-colors">
                            {rep.titre}
                          </div>
                          <div className="text-[11px] text-slate-400 line-clamp-1">
                            {rep.description}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Intervenant: {rep.technicien} {rep.piecesUtilisees.length > 0 && `· ${rep.piecesUtilisees.length} pièce(s)`}
                          </div>
                        </button>
                      </td>

                      <td className="py-3 px-4 text-slate-300">
                        {rep.type === 'PREVENTIVE' ? 'Préventive' :
                         rep.type === 'CORRECTIVE' ? 'Corrective' :
                         rep.type === 'DEPANNAGE_URGENT' ? 'Urgence' : 'Réglementaire'}
                      </td>

                      <td className="py-3 px-4">
                        {getPrioriteBadge(rep.priorite)}
                      </td>

                      <td className="py-3 px-4">
                        {getStatutBadge(rep.statut)}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="font-mono tabular-nums font-bold text-slate-200">
                          {formatDH(rep.coutTotal)}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          P: {formatDH(rep.coutPieces)} · MO: {formatDH(rep.coutMainOeuvre)}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => printWorkOrderDocument(rep, vehicule)}
                            className="p-1.5 text-slate-400 hover:text-amber-400 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Imprimer l'Ordre de Travail (A4 Officiel)"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => downloadWorkOrderDocument(rep, vehicule)}
                            className="p-1.5 text-slate-400 hover:text-sky-400 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Télécharger l'OT (Document Officiel A4 / PDF)"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => downloadWorkOrderExcel(rep, vehicule)}
                            className="p-1.5 text-slate-400 hover:text-emerald-400 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Télécharger l'OT en Excel (.xlsx)"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={async () => {
                              setSavingDriveOTId(rep.id);
                              try {
                                const file = await saveWorkOrderToDrive(rep, vehicule);
                                setDriveToast({
                                  message: `L'ordre de travail ${rep.numeroOT} a été archivé avec succès sur Google Drive !`,
                                  link: file.webViewLink
                                });
                                setTimeout(() => setDriveToast(null), 8000);
                              } catch (err: any) {
                                alert(`Erreur Google Drive : ${err.message}`);
                              } finally {
                                setSavingDriveOTId(null);
                              }
                            }}
                            disabled={savingDriveOTId === rep.id}
                            className="p-1.5 text-slate-400 hover:text-amber-400 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Archiver cet Ordre de Travail sur Google Drive"
                          >
                            <Cloud className={`w-3.5 h-3.5 ${savingDriveOTId === rep.id ? 'animate-spin text-amber-500' : ''}`} />
                          </button>
                          <button
                            onClick={() => onOpenDetailModal(rep)}
                            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Consulter tous les détails"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onOpenEditModal(rep)}
                            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Modifier"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setRepairToDelete(rep)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal confirmation suppression réparation */}
      <ConfirmDeleteModal
        isOpen={!!repairToDelete}
        title="Supprimer l'Ordre de Travail"
        message={`Confirmez-vous la suppression de l'intervention ${repairToDelete?.numeroOT} ("${repairToDelete?.titre}") ?`}
        itemDetails={repairToDelete ? `Montant valorisé : ${formatDH(repairToDelete.coutTotal)} · Technicien : ${repairToDelete.technicien}` : undefined}
        onConfirm={() => {
          if (repairToDelete) {
            deleteReparation(repairToDelete.id);
            setRepairToDelete(null);
          }
        }}
        onCancel={() => setRepairToDelete(null)}
      />
    </div>
  );
};
