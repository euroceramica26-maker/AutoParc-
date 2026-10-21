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
  DollarSign
} from 'lucide-react';
import { useFleet } from '../../context/FleetContext';
import { Reparation, StatutReparation, TypeReparation, PrioriteReparation } from '../../types/fleet';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';
import { formatDH } from '../../utils/formatters';

interface RepairsViewProps {
  onOpenAddModal: () => void;
  onOpenEditModal: (reparation: Reparation) => void;
  onOpenDetailModal: (reparation: Reparation) => void;
}

export const RepairsView: React.FC<RepairsViewProps> = ({
  onOpenAddModal,
  onOpenEditModal,
  onOpenDetailModal
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Gestion des Réparations & Ordres de Travail
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Planification des révisions, gestion des pannes et traçabilité des dépenses de maintenance.
          </p>
        </div>

        <button
          onClick={onOpenAddModal}
          className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Créer un Ordre de Travail</span>
        </button>
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
                            onClick={() => onOpenDetailModal(rep)}
                            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Consulter / Imprimer"
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
