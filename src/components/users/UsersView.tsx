import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Shield, 
  Key, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Lock,
  Phone,
  Mail,
  UserCheck,
  RotateCcw
} from 'lucide-react';
import { useFleet } from '../../context/FleetContext';
import { FleetUser, UserRole } from '../../types/fleet';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';
import { AdminResetModal } from '../common/AdminResetModal';

interface UsersViewProps {
  onOpenAddUser: () => void;
  onOpenEditUser: (user: FleetUser) => void;
}

export const UsersView: React.FC<UsersViewProps> = ({
  onOpenAddUser,
  onOpenEditUser
}) => {
  const { users, currentUser, deleteUser, switchUser } = useFleet();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [userToDelete, setUserToDelete] = useState<FleetUser | null>(null);
  const [isAdminResetOpen, setIsAdminResetOpen] = useState(false);
  const [resetSuccessNotice, setResetSuccessNotice] = useState<string | null>(null);

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.login.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.telephone && u.telephone.includes(searchTerm));

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 w-fit">
            <Shield className="w-3 h-3" />
            Administrateur
          </span>
        );
      case 'CHEF_ATELIER':
        return (
          <span className="text-blue-400 bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 w-fit">
            Chef d'Atelier
          </span>
        );
      case 'MAGASINIER':
        return (
          <span className="text-purple-400 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 w-fit">
            Magasinier
          </span>
        );
      case 'CONDUCTEUR':
        return (
          <span className="text-slate-300 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 w-fit">
            Conducteur / Opérateur
          </span>
        );
    }
  };

  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 bg-slate-900/40 border border-slate-800 rounded-2xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mb-4">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-base font-bold text-white mb-2">
          Accès Restreint au Compte Administrateur
        </h2>
        <p className="text-xs text-slate-400 max-w-md leading-relaxed">
          La gestion des utilisateurs, des comptes et des droits d'accès est réservée exclusivement aux administrateurs. Votre compte actuel ({currentUser?.nom || 'Utilisateur'} - {currentUser?.role}) ne dispose pas des privilèges requis.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-amber-500" />
            <span>Gestion des Utilisateurs & Droits d'Accès</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Création, modification et attribution des rôles d'accès pour les équipes d'exploitation, atelier et magasin.
          </p>
        </div>

        <button
          onClick={onOpenAddUser}
          className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Nouvel utilisateur</span>
        </button>
      </div>

      {/* Admin Account Highlight Banner */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <Key className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-white flex items-center gap-2">
              <span>Compte Administrateur Principal</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold px-1.5 py-0.2 rounded font-mono">
                Sécurisé
              </span>
            </div>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Accès réservé aux administrateurs autorisés · Mots de passe chiffrés et confidentiels
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="text-[11px] text-slate-400">
            Connecté actuellement sous : <strong className="text-white">{currentUser?.nom || 'Non connecté'}</strong> ({currentUser?.role})
          </div>

          <button
            type="button"
            onClick={() => setIsAdminResetOpen(true)}
            className="px-3 py-1.5 text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/50 hover:bg-rose-900/70 border border-rose-800/60 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-sm w-fit"
            title="Réinitialiser toutes les données de la flotte (mot de passe administrateur obligatoire)"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
            <span>Réinitialiser les Données</span>
          </button>
        </div>
      </div>

      {resetSuccessNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-center justify-between gap-2 shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{resetSuccessNotice}</span>
          </div>
          <button
            onClick={() => setResetSuccessNotice(null)}
            className="text-slate-400 hover:text-white text-xs px-2 py-0.5"
          >
            Fermer
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Total Utilisateurs</span>
          <span className="text-xl font-bold font-mono text-white">{users.length}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Administrateurs</span>
          <span className="text-xl font-bold font-mono text-amber-400">
            {users.filter(u => u.role === 'ADMIN').length}
          </span>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Atelier & Magasin</span>
          <span className="text-xl font-bold font-mono text-blue-400">
            {users.filter(u => u.role === 'CHEF_ATELIER' || u.role === 'MAGASINIER').length}
          </span>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Comptes Actifs</span>
          <span className="text-xl font-bold font-mono text-emerald-400">
            {users.filter(u => u.actif).length}
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
              placeholder="Rechercher par nom, identifiant login, email, téléphone..."
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-800/80 rounded-lg overflow-x-auto">
            {[
              { id: 'ALL', label: 'Tous rôles' },
              { id: 'ADMIN', label: 'Admins' },
              { id: 'CHEF_ATELIER', label: 'Atelier' },
              { id: 'MAGASINIER', label: 'Magasin' },
              { id: 'CONDUCTEUR', label: 'Chauffeurs' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setRoleFilter(tab.id)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  roleFilter === tab.id
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

      {/* Users Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/40 text-slate-400">
                <th className="py-3 px-4 font-medium">Nom & Identifiant</th>
                <th className="py-3 px-4 font-medium">Rôle</th>
                <th className="py-3 px-4 font-medium">Coordonnées</th>
                <th className="py-3 px-4 font-medium">Statut</th>
                <th className="py-3 px-4 font-medium">Mot de passe</th>
                <th className="py-3 px-4 font-medium">Dernier accès</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Aucun utilisateur ne correspond aux critères de recherche.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => {
                  const isCurrent = currentUser?.id === u.id;

                  return (
                    <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-white flex items-center gap-1.5">
                            <span>{u.nom}</span>
                            {isCurrent && (
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.2 rounded border border-emerald-500/30">
                                Vous
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-[11px] font-mono text-amber-400 mt-0.5">
                          Login : {u.login}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {getRoleBadge(u.role)}
                      </td>

                      <td className="py-3 px-4 text-slate-300 space-y-0.5">
                        {u.email && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-400">
                            <Mail className="w-3 h-3 text-slate-500" />
                            <span>{u.email}</span>
                          </div>
                        )}
                        {u.telephone && (
                          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                            <Phone className="w-3 h-3 text-slate-500" />
                            <span>{u.telephone}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {u.actif ? (
                          <span className="text-emerald-400 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Actif
                          </span>
                        ) : (
                          <span className="text-slate-500 font-medium flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" />
                            Inactif
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                        ••••••••
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                        {u.dernierAcces || 'Jamais connecté'}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isCurrent && (
                            <button
                              onClick={() => switchUser(u.id)}
                              className="px-2 py-1 text-[11px] font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors cursor-pointer"
                              title="Se connecter sous ce profil"
                            >
                              Basculer
                            </button>
                          )}
                          <button
                            onClick={() => onOpenEditUser(u)}
                            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Modifier"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setUserToDelete(u)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Supprimer l'utilisateur"
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

      {/* Modal confirmation suppression in-app */}
      <ConfirmDeleteModal
        isOpen={!!userToDelete}
        title="Supprimer l'utilisateur"
        message={`Êtes-vous certain de vouloir supprimer le compte utilisateur "${userToDelete?.nom}" (${userToDelete?.login}) ? Il ne pourra plus se connecter au système.`}
        itemDetails={userToDelete ? `Identifiant : ${userToDelete.login} · Rôle : ${userToDelete.role}` : undefined}
        onConfirm={() => {
          if (userToDelete) {
            deleteUser(userToDelete.id);
            setUserToDelete(null);
          }
        }}
        onCancel={() => setUserToDelete(null)}
      />

      {/* Modal sécurisée réinitialisation avec mot de passe admin */}
      <AdminResetModal
        isOpen={isAdminResetOpen}
        onClose={() => setIsAdminResetOpen(false)}
        onSuccess={(msg) => {
          setResetSuccessNotice(msg);
          setTimeout(() => setResetSuccessNotice(null), 5000);
        }}
      />
    </div>
  );
};
