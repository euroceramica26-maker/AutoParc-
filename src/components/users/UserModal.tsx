import React, { useState } from 'react';
import { X, UserPlus, Save, Shield, Key } from 'lucide-react';
import { FleetUser, UserRole } from '../../types/fleet';

interface UserModalProps {
  user?: FleetUser | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<FleetUser, 'id' | 'dateCreation'>) => void;
}

export const UserModal: React.FC<UserModalProps> = ({
  user,
  isOpen,
  onClose,
  onSave
}) => {
  const [nom, setNom] = useState(user?.nom || '');
  const [login, setLogin] = useState(user?.login || '');
  const [motDePasse, setMotDePasse] = useState(user?.motDePasse || '');
  const [email, setEmail] = useState(user?.email || '');
  const [telephone, setTelephone] = useState(user?.telephone || '');
  const [role, setRole] = useState<UserRole>(user?.role || 'CHEF_ATELIER');
  const [actif, setActif] = useState<boolean>(user ? user.actif : true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      nom: nom.trim(),
      login: login.trim().toLowerCase(),
      motDePasse: motDePasse.trim(),
      email: email.trim(),
      telephone: telephone.trim(),
      role,
      actif
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-white">
              {user ? `Modifier l'Utilisateur [${user.login}]` : 'Créer un Nouvel Utilisateur'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Nom complet & Prénom *</label>
            <input
              type="text"
              required
              value={nom}
              onChange={e => setNom(e.target.value)}
              placeholder="Ex: Mohamed Alami, Fatima Zahra..."
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Identifiant de connexion (Login) *</label>
              <input
                type="text"
                required
                value={login}
                onChange={e => setLogin(e.target.value)}
                placeholder="Ex: ouaradtech, m.alami..."
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Mot de passe *</label>
              <input
                type="password"
                required
                value={motDePasse}
                onChange={e => setMotDePasse(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Adresse Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Ex: contact@ouaradtech.ma"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Téléphone (WhatsApp / Appel)</label>
              <input
                type="text"
                value={telephone}
                onChange={e => setTelephone(e.target.value)}
                placeholder="Ex: +212 661-123456"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Rôle & Permissions *</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as UserRole)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="ADMIN">Administrateur (Tous droits d'accès)</option>
                <option value="CHEF_ATELIER">Chef d'Atelier / Maintenance</option>
                <option value="MAGASINIER">Magasinier (Gestion des Stocks)</option>
                <option value="CONDUCTEUR">Conducteur / Opérateur Engin</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Statut du compte</label>
              <select
                value={actif ? 'ACTIF' : 'INACTIF'}
                onChange={e => setActif(e.target.value === 'ACTIF')}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="ACTIF">Actif (Autorisé à se connecter)</option>
                <option value="INACTIF">Inactif / Suspendu</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>{user ? 'Mettre à jour' : 'Créer l\'utilisateur'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
