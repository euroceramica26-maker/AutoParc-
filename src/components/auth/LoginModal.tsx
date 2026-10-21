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
  const { 
    login, 
    currentUser, 
    users, 
    firebaseUser, 
    signInWithGoogle, 
    signOutFirebase 
  } = useFleet();
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

        {/* Google Firebase Login Option */}
        <div className="px-6 pt-5 pb-2">
          {firebaseUser ? (
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-xs">
                  G
                </div>
                <div>
                  <span className="text-xs font-semibold text-white block">
                    {firebaseUser.displayName || 'Compte Google'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {firebaseUser.email}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={signOutFirebase}
                className="px-2.5 py-1 text-[11px] text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 rounded-md transition-colors cursor-pointer"
              >
                Déconnexion
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={async () => {
                const ok = await signInWithGoogle();
                if (ok) {
                  setSuccessMsg('Connexion Google / Firebase réussie !');
                  setTimeout(() => onClose(), 800);
                }
              }}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-md cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continuer avec Google (Firebase Auth)</span>
            </button>
          )}

          <div className="flex items-center gap-3 my-3">
            <div className="h-px bg-slate-800 flex-1" />
            <span className="text-[10px] uppercase font-mono text-slate-500">ou compte local</span>
            <div className="h-px bg-slate-800 flex-1" />
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-0 space-y-4 text-xs">
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
