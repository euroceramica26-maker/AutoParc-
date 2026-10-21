import React, { useState } from 'react';
import { 
  CalendarCheck2, 
  AlertTriangle, 
  Plus, 
  CheckCircle2, 
  Gauge, 
  Calendar, 
  Clock, 
  ArrowRight, 
  Search,
  Check,
  RotateCcw,
  Trash2
} from 'lucide-react';
import { useFleet } from '../../context/FleetContext';
import { AlerteMaintenance, SeveriteAlerte } from '../../types/fleet';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';

interface MaintenanceAlertsViewProps {
  onOpenNewAlertModal: () => void;
  onNavigateToOT: () => void;
}

export const MaintenanceAlertsView: React.FC<MaintenanceAlertsViewProps> = ({
  onOpenNewAlertModal,
  onNavigateToOT
}) => {
  const { 
    alertes, 
    vehicules, 
    marquerAlerteTraitee, 
    convertirAlerteEnOT,
    deleteAlerte,
    statsGlobales 
  } = useFleet();

  const [filterSeverite, setFilterSeverite] = useState<string>('ACTIVE');
  const [searchTerm, setSearchTerm] = useState('');
  const [alerteToDelete, setAlerteToDelete] = useState<AlerteMaintenance | null>(null);

  const filteredAlertes = alertes.filter(a => {
    const vehicule = vehicules.find(v => v.id === a.vehiculeId);
    const matchesSearch = 
      a.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (vehicule && (
        vehicule.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicule.immatriculation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicule.marque.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicule.modele.toLowerCase().includes(searchTerm.toLowerCase())
      ));

    if (filterSeverite === 'ACTIVE') return !a.estTraitee && matchesSearch;
    if (filterSeverite === 'URGENT') return !a.estTraitee && a.severite === 'URGENT' && matchesSearch;
    if (filterSeverite === 'ATTENTION') return !a.estTraitee && a.severite === 'ATTENTION' && matchesSearch;
    if (filterSeverite === 'TRAITEE') return a.estTraitee && matchesSearch;
    return matchesSearch;
  });

  const handleConvertAndGo = (alerteId: string) => {
    convertirAlerteEnOT(alerteId);
    onNavigateToOT();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Alertes de Maintenance Périodique & Conformité
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Surveillance automatique des vidanges, révisions périodiques par compteur (km/h) et visites réglementaires (CT, VGP).
          </p>
        </div>

        <button
          onClick={onOpenNewAlertModal}
          className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Programmer un entretien</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div 
          onClick={() => setFilterSeverite('URGENT')}
          className={`p-4 rounded-xl border transition-colors cursor-pointer ${
            filterSeverite === 'URGENT' ? 'bg-rose-950/30 border-rose-800 text-rose-300' : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Urgences & Retards</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-rose-400">
              {statsGlobales.alertesUrgentes}
            </span>
            <span className="text-xs text-rose-300">interventions immédiates</span>
          </div>
        </div>

        <div 
          onClick={() => setFilterSeverite('ATTENTION')}
          className={`p-4 rounded-xl border transition-colors cursor-pointer ${
            filterSeverite === 'ATTENTION' ? 'bg-amber-950/30 border-amber-800 text-amber-300' : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Échéances Proches</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-400">
              {statsGlobales.alertesAttentions}
            </span>
            <span className="text-xs text-amber-300">à planifier sous peu</span>
          </div>
        </div>

        <div 
          onClick={() => setFilterSeverite('TRAITEE')}
          className={`p-4 rounded-xl border transition-colors cursor-pointer ${
            filterSeverite === 'TRAITEE' ? 'bg-emerald-950/30 border-emerald-800 text-emerald-300' : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Historique Réalisé</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {alertes.filter(a => a.estTraitee).length}
            </span>
            <span className="text-xs text-emerald-300">entretiens effectués</span>
          </div>
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
              placeholder="Rechercher par titre d'opération, équipement, description..."
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-800/80 rounded-lg overflow-x-auto">
            {[
              { id: 'ACTIVE', label: 'Toutes actives' },
              { id: 'URGENT', label: 'Urgentes' },
              { id: 'ATTENTION', label: 'À planifier' },
              { id: 'TRAITEE', label: 'Clôturées' },
              { id: 'ALL', label: 'Tout' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterSeverite(tab.id)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  filterSeverite === tab.id
                    ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts list */}
      <div className="space-y-3">
        {filteredAlertes.length === 0 ? (
          <div className="p-8 rounded-xl border border-slate-800 bg-slate-900/60 text-center text-xs text-slate-500">
            <CheckCircle2 className="w-8 h-8 text-emerald-500/50 mx-auto mb-2" />
            Aucune alerte de maintenance ne correspond aux critères sélectionnés.
          </div>
        ) : (
          filteredAlertes.map(alerte => {
            const vehicule = vehicules.find(v => v.id === alerte.vehiculeId);
            const isUrgent = alerte.severite === 'URGENT';
            const isAttention = alerte.severite === 'ATTENTION';

            return (
              <div
                key={alerte.id}
                className={`p-4 rounded-xl border transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  alerte.estTraitee 
                    ? 'bg-slate-900/40 border-slate-800 opacity-60' 
                    : isUrgent 
                      ? 'bg-rose-950/20 border-rose-900/50 hover:border-rose-700/60' 
                      : isAttention 
                        ? 'bg-amber-950/20 border-amber-900/50 hover:border-amber-700/60' 
                        : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                      alerte.estTraitee ? 'bg-slate-800 text-slate-400' :
                      isUrgent ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                      isAttention ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {alerte.estTraitee ? 'TRAITÉE' : isUrgent ? 'CRITIQUE / RETARD' : 'ÉCHÉANCE PROCHE'}
                    </span>

                    <span className="text-xs font-bold text-white">
                      {alerte.titre}
                    </span>

                    {vehicule && (
                      <span className="text-xs font-mono text-amber-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        {vehicule.code} · {vehicule.marque} {vehicule.modele} ({vehicule.immatriculation})
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300">
                    {alerte.description}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                    <span className="flex items-center gap-1 font-semibold text-white">
                      {alerte.typeDeclencheur === 'COMPTEUR' ? <Gauge className="w-3.5 h-3.5 text-amber-400" /> : <Calendar className="w-3.5 h-3.5 text-blue-400" />}
                      {alerte.messageEcheance}
                    </span>

                    {alerte.typeDeclencheur === 'COMPTEUR' && vehicule && (
                      <span className="text-slate-500">
                        Compteur véhicule : {vehicule.compteurActuel.toLocaleString()} {vehicule.compteurType} (Seuil : {alerte.compteurEcheance?.toLocaleString()} {vehicule.compteurType})
                      </span>
                    )}

                    {alerte.typeDeclencheur === 'CALENDRIER' && alerte.dateEcheance && (
                      <span className="text-slate-500">
                        Date butoir : {new Date(alerte.dateEcheance).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  {!alerte.estTraitee ? (
                    <>
                      <button
                        onClick={() => handleConvertAndGo(alerte.id)}
                        className="px-3 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                        title="Créer directement un Ordre de Travail à partir de cette alerte"
                      >
                        <span>Créer Ordre de Travail</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => marquerAlerteTraitee(alerte.id)}
                        className="px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                        title="Marquer comme fait manuellement"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      Opération validée
                    </span>
                  )}

                  <button
                    onClick={() => setAlerteToDelete(alerte)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Supprimer cette alerte"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal confirmation suppression alerte */}
      <ConfirmDeleteModal
        isOpen={!!alerteToDelete}
        title="Supprimer l'alerte de maintenance"
        message={`Confirmez-vous la suppression de l'alerte de maintenance "${alerteToDelete?.titre}" ?`}
        itemDetails={alerteToDelete ? `Détail : ${alerteToDelete.description} · Échéance : ${alerteToDelete.messageEcheance}` : undefined}
        onConfirm={() => {
          if (alerteToDelete) {
            deleteAlerte(alerteToDelete.id);
            setAlerteToDelete(null);
          }
        }}
        onCancel={() => setAlerteToDelete(null)}
      />
    </div>
  );
};
