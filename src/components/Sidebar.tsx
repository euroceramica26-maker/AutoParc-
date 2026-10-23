import React from 'react';
import { 
  LayoutDashboard, 
  Truck, 
  Wrench, 
  FileText, 
  BarChart3,
  CalendarCheck2,
  Users,
  Cloud
} from 'lucide-react';
import { useFleet } from '../context/FleetContext';
import { formatDH } from '../utils/formatters';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  collapsed?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab
}) => {
  const { statsGlobales, reparations, pieces, alertes, users } = useFleet();

  const activeRepairsCount = reparations.filter(r => r.statut === 'EN_COURS' || r.statut === 'EN_ATTENTE_PIECES').length;
  const criticalPartsCount = pieces.filter(p => p.stockActuel <= p.stockMin).length;
  const pendingAlertsCount = alertes.filter(a => !a.estTraitee && a.severite !== 'OK').length;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'vehicules',
      label: 'Véhicules & Engins',
      icon: Truck,
      badge: `${statsGlobales.totalVehicules}`
    },
    {
      id: 'pieces',
      label: 'Pièces de Rechange',
      icon: Wrench,
      badge: criticalPartsCount > 0 ? `${criticalPartsCount}` : null,
      badgeColor: criticalPartsCount > 0 ? 'bg-amber-500/20 text-amber-300' : ''
    },
    {
      id: 'reparations',
      label: 'Réparations & OT',
      icon: FileText,
      badge: activeRepairsCount > 0 ? `${activeRepairsCount}` : null,
      badgeColor: 'bg-blue-500/20 text-blue-300'
    },
    {
      id: 'maintenance',
      label: 'Alertes Maintenance',
      icon: CalendarCheck2,
      badge: pendingAlertsCount > 0 ? `${pendingAlertsCount}` : null,
      badgeColor: statsGlobales.alertesUrgentes > 0 ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
    },
    {
      id: 'drive',
      label: 'Google Drive (GED)',
      icon: Cloud,
      badge: 'Drive',
      badgeColor: 'bg-amber-500/20 text-amber-300'
    },
    {
      id: 'rapports',
      label: 'Rapports d\'Activité',
      icon: BarChart3,
      badge: null
    },
    {
      id: 'utilisateurs',
      label: 'Utilisateurs & Accès',
      icon: Users,
      badge: `${users.length}`
    }
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900/60 flex flex-col shrink-0 select-none">
      {/* Flotte active status snippet */}
      <div className="p-4 border-b border-slate-800/80">
        <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span>Disponibilité Flotte</span>
            <span className="font-mono tabular-nums text-emerald-400 font-semibold">{statsGlobales.tauxDisponibilite}%</span>
          </div>
          <div className="w-full bg-slate-700/60 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${statsGlobales.tauxDisponibilite}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
            <span>{statsGlobales.vehiculesEnService} opérationnels</span>
            <span>{statsGlobales.vehiculesEnPanneOuMaint} immobilisés</span>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="p-3 space-y-1 flex-1">
        <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 tracking-wider">
          MODULES PRINCIPAUX
        </div>

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer group ${
                isActive 
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-300'}`} />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono tabular-nums font-semibold ${item.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick summary bottom info with Moroccan Dirham (DH) */}
      <div className="p-4 border-t border-slate-800 text-xs text-slate-400 space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="text-slate-400">Valeur stock pièces :</span>
          <span className="font-mono tabular-nums text-slate-300 font-medium">
            {formatDH(statsGlobales.valeurTotaleStock)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-400">Dépenses mois (Oct.) :</span>
          <span className="font-mono tabular-nums text-amber-400 font-medium">
            {formatDH(statsGlobales.depensesMoisEnCours)}
          </span>
        </div>
      </div>
    </aside>
  );
};
