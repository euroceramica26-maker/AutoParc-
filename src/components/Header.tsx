import React from 'react';
import { 
  Bell, 
  Plus, 
  Database,
  Truck,
  Users,
  LogOut,
  UserCheck,
  Shield,
  Key
} from 'lucide-react';
import { useFleet } from '../context/FleetContext';

interface HeaderProps {
  currentTab: string;
  onOpenNewOT: () => void;
  onOpenNewVehicule: () => void;
  onOpenSystemModal: () => void;
  onOpenLoginModal: () => void;
  onSelectTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenNewOT,
  onOpenNewVehicule,
  onOpenSystemModal,
  onOpenLoginModal,
  onSelectTab
}) => {
  const { statsGlobales, currentUser, logout } = useFleet();

  const getBreadcrumbLabel = () => {
    switch (currentTab) {
      case 'dashboard': return 'Tableau de bord';
      case 'vehicules': return 'Flotte Véhicules & Engins';
      case 'pieces': return 'Pièces de Rechange & Stocks';
      case 'reparations': return 'Réparations & Ordres de Travail';
      case 'maintenance': return 'Alertes Maintenance Périodique';
      case 'rapports': return 'Rapports d\'Activité & Analyses';
      case 'utilisateurs': return 'Gestion des Utilisateurs & Droits';
      default: return 'Gestion de Parc';
    }
  };

  const totalUrgentNotifications = statsGlobales.alertesUrgentes + statsGlobales.piecesEnRupture + statsGlobales.otUrgents;

  const getRoleShortLabel = (role?: string) => {
    switch (role) {
      case 'ADMIN': return 'Admin';
      case 'CHEF_ATELIER': return 'Atelier';
      case 'MAGASINIER': return 'Magasin';
      case 'CONDUCTEUR': return 'Opérateur';
      default: return 'Utilisateur';
    }
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Zone 1: Single text element wordmark / Brand */}
      <div className="flex items-center gap-6">
        <button 
          onClick={() => onSelectTab('dashboard')}
          className="text-left group flex items-center gap-2.5 focus:outline-none cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <Truck className="w-4 h-4" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white group-hover:text-amber-400 transition-colors">
            AutoParc <span className="text-amber-500 font-extrabold">PRO</span>
          </span>
        </button>

        <span className="hidden lg:inline text-slate-600 font-light text-sm" aria-hidden="true">/</span>
        <span className="hidden lg:inline text-sm font-medium text-slate-300">
          {getBreadcrumbLabel()}
        </span>
      </div>

      {/* Zone 2: Navigation Links (Breadcrumb shortcuts & quick indicators) */}
      <nav className="hidden md:flex items-center gap-6 text-xs text-slate-400">
        <button 
          onClick={() => onSelectTab('vehicules')}
          className={`hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer ${currentTab === 'vehicules' ? 'text-amber-400 font-semibold' : ''}`}
        >
          <span>{statsGlobales.totalVehicules} Engins/Véhicules</span>
          <span className="text-slate-600">({statsGlobales.tauxDisponibilite}% dispo)</span>
        </button>

        <span className="text-slate-700" aria-hidden="true">·</span>

        <button 
          onClick={() => onSelectTab('maintenance')}
          className={`hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer ${currentTab === 'maintenance' ? 'text-amber-400 font-semibold' : ''}`}
        >
          {statsGlobales.alertesUrgentes > 0 ? (
            <span className="text-rose-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
              {statsGlobales.alertesUrgentes} alertes urgentes
            </span>
          ) : (
            <span>Maintenance à jour</span>
          )}
        </button>

        <span className="text-slate-700" aria-hidden="true">·</span>

        <button 
          onClick={() => onSelectTab('pieces')}
          className={`hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer ${currentTab === 'pieces' ? 'text-amber-400 font-semibold' : ''}`}
        >
          {statsGlobales.piecesEnRupture > 0 ? (
            <span className="text-amber-400 font-medium">
              {statsGlobales.piecesEnRupture} rupture(s) stock
            </span>
          ) : (
            <span>Stock approvisionné</span>
          )}
        </button>
      </nav>

      {/* Zone 3: Primary Actions and Profile Avatar */}
      <div className="flex items-center gap-3">
        {/* Bouton création OT rapide */}
        <button
          onClick={onOpenNewOT}
          className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap cursor-pointer"
          title="Créer un nouvel Ordre de Travail"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nouvel OT</span>
        </button>

        {/* Bouton nouveau véhicule rapide */}
        <button
          onClick={onOpenNewVehicule}
          className="hidden sm:flex px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors items-center gap-1.5 whitespace-nowrap cursor-pointer"
          title="Enregistrer un nouveau véhicule ou engin"
        >
          <Truck className="w-3.5 h-3.5 text-slate-400" />
          <span>+ Engin</span>
        </button>

        {/* Notifications & Alertes button */}
        <button
          onClick={() => onSelectTab('maintenance')}
          className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          title="Consulter les alertes"
        >
          <Bell className="w-4 h-4" />
          {totalUrgentNotifications > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500"></span>
          )}
        </button>

        {/* Données système & Sauvegarde */}
        <button
          onClick={onOpenSystemModal}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          title="Sauvegarde & Données système"
        >
          <Database className="w-4 h-4" />
        </button>

        {/* Menu Utilisateurs raccourci */}
        <button
          onClick={() => onSelectTab('utilisateurs')}
          className={`p-2 rounded-lg transition-colors cursor-pointer ${
            currentTab === 'utilisateurs' ? 'text-amber-400 bg-slate-800' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Gérer les utilisateurs et permissions"
        >
          <Users className="w-4 h-4" />
        </button>

        {/* Fleet Manager Profile Avatar & Login Switcher */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <button 
            onClick={onOpenLoginModal}
            className="flex items-center gap-2 hover:bg-slate-800/80 p-1 rounded-lg transition-colors cursor-pointer text-left"
            title="Changer d'utilisateur ou se connecter"
          >
            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-slate-700 bg-slate-800 flex items-center justify-center shrink-0">
              <img 
                src="/src/assets/images/avatar_fleet_manager_1791390470954.jpg" 
                alt="Responsable Parc & Maintenance"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span className="text-xs font-bold text-amber-500 absolute pointer-events-none">
                {currentUser?.nom?.substring(0, 2).toUpperCase() || 'AD'}
              </span>
            </div>
            <div className="hidden xl:block text-left">
              <p className="text-xs font-medium text-slate-200 leading-none flex items-center gap-1">
                <span>{currentUser?.nom || 'Non connecté'}</span>
                {currentUser?.role === 'ADMIN' && (
                  <Shield className="w-3 h-3 text-amber-400" />
                )}
              </p>
              <p className="text-[11px] text-amber-400 mt-0.5 leading-none font-mono">
                {getRoleShortLabel(currentUser?.role)} ({currentUser?.login || 'guest'})
              </p>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
