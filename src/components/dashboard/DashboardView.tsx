import React from 'react';
import { 
  Truck, 
  Wrench, 
  AlertTriangle, 
  CalendarCheck2, 
  Plus, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  ShieldAlert,
  TrendingUp,
  Package,
  Layers,
  Fuel
} from 'lucide-react';
import { useFleet } from '../../context/FleetContext';
import { Reparation, AlerteMaintenance, PieceRechange, Vehicule } from '../../types/fleet';
import { formatDH } from '../../utils/formatters';

interface DashboardViewProps {
  onSelectTab: (tab: string) => void;
  onOpenNewOT: () => void;
  onOpenNewVehicule: () => void;
  onOpenRestockPiece: (piece: PieceRechange) => void;
  onViewVehiculeDetail: (vehicule: Vehicule) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onSelectTab,
  onOpenNewOT,
  onOpenNewVehicule,
  onOpenRestockPiece,
  onViewVehiculeDetail
}) => {
  const { 
    vehicules, 
    pieces, 
    reparations, 
    alertes, 
    statsGlobales, 
    convertirAlerteEnOT 
  } = useFleet();

  // Alertes actives non traitées classées par sévérité
  const activeAlerts = alertes
    .filter(a => !a.estTraitee)
    .sort((a, b) => {
      const order = { URGENT: 0, ATTENTION: 1, OK: 2 };
      return order[a.severite] - order[b.severite];
    });

  // Pièces en alerte (stock <= stockMin)
  const alertPieces = pieces
    .filter(p => p.stockActuel <= p.stockMin)
    .sort((a, b) => (a.stockActuel / (a.stockMin || 1)) - (b.stockActuel / (b.stockMin || 1)));

  // Réparations récentes
  const recentRepairs = [...reparations]
    .sort((a, b) => new Date(b.dateDeclaration).getTime() - new Date(a.dateDeclaration).getTime())
    .slice(0, 5);

  // Dépenses par type de véhicule
  const coutsParType = vehicules.reduce((acc, v) => {
    const reps = reparations.filter(r => r.vehiculeId === v.id);
    const total = reps.reduce((sum, r) => sum + r.coutTotal, 0);
    acc[v.type] = (acc[v.type] || 0) + total;
    return acc;
  }, {} as Record<string, number>);

  const totalCouts = Object.values(coutsParType).reduce((a, b) => a + b, 0) || 1;

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'ENGIN': return 'Engins de chantier';
      case 'POIDS_LOURD': return 'Poids Lourds';
      case 'UTILITAIRE': return 'Utilitaires (VU)';
      case 'VL': return 'Véhicules légers (VL)';
      default: return type;
    }
  };

  const getStatusBadge = (statut: Reparation['statut']) => {
    switch (statut) {
      case 'TERMINEE':
        return <span className="text-emerald-400 font-medium">Terminée</span>;
      case 'EN_COURS':
        return <span className="text-blue-400 font-medium">En cours d'atelier</span>;
      case 'EN_ATTENTE_PIECES':
        return <span className="text-amber-400 font-medium">En attente pièces</span>;
      case 'PLANIFIEE':
        return <span className="text-slate-400 font-medium">Planifiée</span>;
      case 'ANNULEE':
        return <span className="text-slate-500 font-medium">Annulée</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête de bienvenue & Actions rapides */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Tableau de Bord de Flotte & Maintenance
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Supervision opérationnelle en temps réel des engins, interventions et stocks de pièces.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelectTab('maintenance')}
            className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <CalendarCheck2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Voir le calendrier d'entretien</span>
          </button>
          <button
            onClick={onOpenNewOT}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Créer un Ordre de Travail</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid (4 Colonnes) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 : Disponibilité Flotte */}
        <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Disponibilité Flotte</span>
            <Truck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-white">
              {statsGlobales.tauxDisponibilite}%
            </span>
            <span className="text-xs text-emerald-400">
              {statsGlobales.vehiculesEnService}/{statsGlobales.totalVehicules} opérationnels
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
            <span>Immobilisés ou en panne :</span>
            <span className="font-mono tabular-nums text-rose-400 font-semibold">
              {statsGlobales.vehiculesEnPanneOuMaint}
            </span>
          </div>
        </div>

        {/* KPI 2 : Ordres de travail */}
        <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Interventions Actives</span>
            <Wrench className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-white">
              {statsGlobales.otEnCours}
            </span>
            <span className="text-xs text-blue-400">
              en cours d'atelier
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
            <span>Urgences prioritaires :</span>
            <span className="font-mono tabular-nums text-rose-400 font-semibold">
              {statsGlobales.otUrgents}
            </span>
          </div>
        </div>

        {/* KPI 3 : Alertes périodiques */}
        <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Échéances & Alertes</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-white">
              {statsGlobales.alertesUrgentes + statsGlobales.alertesAttentions}
            </span>
            <span className="text-xs text-amber-400">
              {statsGlobales.alertesUrgentes} critique(s)
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
            <span>Contrôles tech. / Vidanges :</span>
            <span className="text-slate-300">À planifier</span>
          </div>
        </div>

        {/* KPI 4 : Stock pièces & Budget */}
        <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>État Stock Pièces</span>
            <Package className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-white">
              {statsGlobales.piecesEnAlerte + statsGlobales.piecesEnRupture}
            </span>
            <span className="text-xs text-rose-400">
              références à réassortir
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
            <span>Valeur stock magasin :</span>
            <span className="font-mono tabular-nums text-slate-200">
              {formatDH(statsGlobales.valeurTotaleStock)}
            </span>
          </div>
        </div>
      </div>

      {/* Grille principale : Alertes & Interventions à gauche, Stocks & Coûts à droite */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Colonne Gauche (2/3 largeur) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section 1 : Alertes de maintenance périodique imminentes */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-semibold text-white">
                  Alertes de Maintenance Périodique & Conformité
                </h2>
              </div>
              <button
                onClick={() => onSelectTab('maintenance')}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Toutes les alertes</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {activeAlerts.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-500/50 mx-auto mb-2" />
                Toutes les opérations d'entretien périodique sont à jour.
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeAlerts.slice(0, 4).map(alerte => {
                  const vehicule = vehicules.find(v => v.id === alerte.vehiculeId);
                  const isUrgent = alerte.severite === 'URGENT';

                  return (
                    <div 
                      key={alerte.id}
                      className={`p-3 rounded-lg border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isUrgent 
                          ? 'bg-rose-950/20 border-rose-800/40 text-rose-200' 
                          : 'bg-amber-950/20 border-amber-800/40 text-amber-200'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                            isUrgent ? 'bg-rose-500/30 text-rose-300' : 'bg-amber-500/30 text-amber-300'
                          }`}>
                            {isUrgent ? 'URGENT' : 'À PLANIFIER'}
                          </span>
                          <span className="text-xs font-semibold text-white">
                            {alerte.titre}
                          </span>
                          {vehicule && (
                            <button
                              onClick={() => onViewVehiculeDetail(vehicule)}
                              className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                            >
                              [{vehicule.code} - {vehicule.marque} {vehicule.modele}]
                            </button>
                          )}
                        </div>
                        <div className="text-xs text-slate-300 flex items-center gap-2">
                          <span className="font-medium">{alerte.messageEcheance}</span>
                          <span className="text-slate-500" aria-hidden="true">·</span>
                          <span className="text-slate-400 truncate max-w-md">{alerte.description}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            convertirAlerteEnOT(alerte.id);
                            onSelectTab('reparations');
                          }}
                          className="px-2.5 py-1 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded transition-colors whitespace-nowrap cursor-pointer"
                        >
                          Générer OT
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2 : Dernières Interventions & Ordres de Réparation */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-400" />
                <h2 className="text-sm font-semibold text-white">
                  Derniers Ordres d'Intervention (OT)
                </h2>
              </div>
              <button
                onClick={() => onSelectTab('reparations')}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Voir le registre complet</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 pb-2">
                    <th className="py-2 font-medium">N° OT</th>
                    <th className="py-2 font-medium">Véhicule / Engin</th>
                    <th className="py-2 font-medium">Nature des travaux</th>
                    <th className="py-2 font-medium">Statut</th>
                    <th className="py-2 font-medium text-right">Coût Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {recentRepairs.map(rep => {
                    const vehicule = vehicules.find(v => v.id === rep.vehiculeId);

                    return (
                      <tr key={rep.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-2.5 font-mono tabular-nums text-amber-400 font-medium">
                          {rep.numeroOT}
                        </td>
                        <td className="py-2.5">
                          {vehicule ? (
                            <div>
                              <div className="font-semibold text-white">{vehicule.code} ({vehicule.immatriculation})</div>
                              <div className="text-[11px] text-slate-400">{vehicule.marque} {vehicule.modele}</div>
                            </div>
                          ) : (
                            <span className="text-slate-500">Non spécifié</span>
                          )}
                        </td>
                        <td className="py-2.5 max-w-xs">
                          <p className="text-slate-200 truncate font-medium">{rep.titre}</p>
                          <p className="text-[11px] text-slate-500">{rep.technicien}</p>
                        </td>
                        <td className="py-2.5">
                          {getStatusBadge(rep.statut)}
                        </td>
                        <td className="py-2.5 text-right font-mono tabular-nums text-slate-200 font-semibold">
                          {formatDH(rep.coutTotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Colonne Droite (1/3 largeur) */}
        <div className="space-y-6">
          
          {/* Alerte Pièces & Réapprovisionnement rapide */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-purple-400" />
                <h2 className="text-sm font-semibold text-white">
                  Stock Critique Pièces
                </h2>
              </div>
              <button
                onClick={() => onSelectTab('pieces')}
                className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Magasin</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {alertPieces.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-500">
                Aucune référence sous le seuil d'alerte.
              </div>
            ) : (
              <div className="space-y-3">
                {alertPieces.slice(0, 4).map(piece => {
                  const isRupture = piece.stockActuel === 0;

                  return (
                    <div 
                      key={piece.id}
                      className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[11px] text-amber-400 font-medium">{piece.reference}</span>
                          <span className={`text-[10px] px-1 py-0.2 rounded font-bold ${
                            isRupture ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {isRupture ? 'RUPTURE' : 'STOCK BAS'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 truncate mt-0.5">{piece.designation}</p>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>Stock: <strong className="text-white font-mono tabular-nums">{piece.stockActuel}</strong> (min {piece.stockMin})</span>
                          <span>·</span>
                          <span className="truncate">{piece.emplacement}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => onOpenRestockPiece(piece)}
                        className="px-2 py-1 text-[11px] font-medium text-slate-200 hover:text-white bg-slate-700 hover:bg-slate-600 rounded transition-colors whitespace-nowrap cursor-pointer shrink-0"
                        title="Commander / Réapprovisionner"
                      >
                        + Réassort
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Répartition des coûts de maintenance */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Répartition des Dépenses de Flotte
            </h2>

            <div className="space-y-3">
              {['ENGIN', 'POIDS_LOURD', 'UTILITAIRE', 'VL'].map(cat => {
                const montant = coutsParType[cat] || 0;
                const pourcentage = Math.round((montant / totalCouts) * 100);

                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-300">{getTypeLabel(cat)}</span>
                      <span className="font-mono tabular-nums text-slate-200 font-semibold">
                        {formatDH(montant)}
                        <span className="text-slate-500 font-normal ml-1">({pourcentage}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-1.5 rounded-full ${
                          cat === 'ENGIN' ? 'bg-amber-500' :
                          cat === 'POIDS_LOURD' ? 'bg-blue-500' :
                          cat === 'UTILITAIRE' ? 'bg-emerald-500' : 'bg-purple-500'
                        }`}
                        style={{ width: `${Math.max(pourcentage, 3)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Total cumulé réparations :</span>
              <span className="text-sm font-bold font-mono tabular-nums text-amber-400">
                {formatDH(totalCouts)}
              </span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
