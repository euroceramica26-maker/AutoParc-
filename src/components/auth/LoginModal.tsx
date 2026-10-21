import React, { useState } from 'react';
import { X, Lock, Key, AlertCircle, Shield, CheckCircle2, User } from 'lucide-react';
import { useFleet } from '../../context/FleetContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose
}) => {
  const { login, currentUser, users } = useFleet();
  const [loginInput, setLoginInput] = useState('ouaradtech');
  const [mdpInput, setMdpInput] = useState('Ouaradtech26@');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const ok = login(loginInput, mdpInput);
    if (ok) {
      setSuccessMsg('Authentification réussie !');
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 700);
    } else {
      setErrorMsg('Identifiant ou mot de passe incorrect (ou compte inactif).');
    }
  };

  const handleQuickFillAdmin = () => {
    setLoginInput('ouaradtech');
    setMdpInput('Ouaradtech26@');
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                Connexion / Changement d'Utilisateur
              </h2>
              <p className="text-[11px] text-slate-400">
                Session actuelle : {currentUser?.nom || 'Non connecté'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800 text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Identifiant (Login)</label>
            <input
              type="text"
              required
              value={loginInput}
              onChange={e => setLoginInput(e.target.value)}
              placeholder="Ex: ouaradtech"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Mot de passe</label>
            <input
              type="password"
              required
              value={mdpInput}
              onChange={e => setMdpInput(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Quick account shortcut */}
          <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block">Compte Administrateur :</span>
              <span className="text-amber-400 font-mono font-semibold">ouaradtech / Ouaradtech26@</span>
            </div>
            <button
              type="button"
              onClick={handleQuickFillAdmin}
              className="px-2.5 py-1 text-[11px] font-semibold bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 rounded border border-amber-500/40 transition-colors cursor-pointer"
            >
              Pré-remplir
            </button>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Fermer
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Se Connecter</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
