import React, { useState } from 'react';
import { X, Database, Download, Upload, RotateCcw, Check, AlertCircle } from 'lucide-react';
import { useFleet } from '../../context/FleetContext';

interface SystemDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemDataModal: React.FC<SystemDataModalProps> = ({
  isOpen,
  onClose
}) => {
  const { 
    resetToDefaultData, 
    exportDatabaseJSON, 
    importDatabaseJSON,
    isFirebaseConnected,
    isSyncing,
    lastSyncTime,
    syncAllToFirestore,
    loadAllFromFirestore
  } = useFleet();
  const [importText, setImportText] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  if (!isOpen) return null;

  const handleDownload = () => {
    const jsonStr = exportDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `autoparc_pro_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setMessage({ type: 'success', text: 'Sauvegarde JSON téléchargée avec succès.' });
  };

  const handleImport = () => {
    if (!importText.trim()) return;
    const ok = importDatabaseJSON(importText);
    if (ok) {
      setMessage({ type: 'success', text: 'Données importées avec succès !' });
      setImportText('');
      setTimeout(() => onClose(), 1200);
    } else {
      setMessage({ type: 'error', text: 'Format de fichier JSON invalide.' });
    }
  };

  const handleReset = () => {
    if (confirm('Voulez-vous vraiment réinitialiser toutes les données aux valeurs de démonstration ? Toutes vos modifications non exportées seront écrasées.')) {
      resetToDefaultData();
      setMessage({ type: 'success', text: 'Données de démonstration réinitialisées !' });
      setTimeout(() => onClose(), 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-white">
              Gestion des Données & Sauvegardes
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs">
          {message && (
            <div className={`p-3 rounded-lg flex items-center gap-2 ${
              message.type === 'success' ? 'bg-emerald-950/40 border border-emerald-800 text-emerald-300' : 'bg-rose-950/40 border border-rose-800 text-rose-300'
            }`}>
              {message.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{message.text}</span>
            </div>
          )}

          {/* Firebase Cloud Firestore Section */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-slate-800/50 to-slate-800/40 border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-xs">
                  🔥
                </div>
                <div>
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <span>Base de Données Cloud Firebase</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {isFirebaseConnected ? 'Connecté' : 'Initialisé'}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Projet : <span className="font-mono text-slate-300">gen-lang-client-0750271374</span>
                    {lastSyncTime && (
                      <span className="text-amber-400 ml-2">· Dernière synchro : {lastSyncTime}</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={async () => {
                  const ok = await syncAllToFirestore();
                  if (ok) setMessage({ type: 'success', text: 'Toutes les données du parc ont été synchronisées sur Firebase Firestore !' });
                }}
                disabled={isSyncing}
                className="px-3 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isSyncing ? 'Synchronisation...' : 'Synchroniser vers Firebase'}</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  const ok = await loadAllFromFirestore();
                  if (ok) setMessage({ type: 'success', text: 'Données rechargées avec succès depuis Firestore !' });
                }}
                disabled={isSyncing}
                className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Restaurer depuis Cloud</span>
              </button>
            </div>
          </div>

          {/* Export card */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-white">Sauvegarder les données</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Exporte l'intégralité du parc, stock, réparations et alertes au format JSON.
              </p>
            </div>
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exporter JSON</span>
            </button>
          </div>

          {/* Import section */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2">
            <h3 className="font-semibold text-white">Restaurer une sauvegarde</h3>
            <p className="text-[11px] text-slate-400">Collez le contenu d'un fichier de sauvegarde JSON :</p>
            <textarea
              rows={3}
              value={importText}
              onChange={e => setImportText(e.target.value)}
              placeholder="Coller le JSON ici..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-mono text-[11px] focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={handleImport}
              disabled={!importText.trim()}
              className="px-3 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Importer et Restaurer</span>
            </button>
          </div>

          {/* Reset section */}
          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/30 flex items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-rose-300">Réinitialiser les données de démo</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Rétablit le jeu de données initial (8 engins/véhicules, pièces, ordres de travaux et alertes).
              </p>
            </div>
            <button
              onClick={handleReset}
              className="px-3 py-1.5 text-xs font-semibold bg-rose-900/40 hover:bg-rose-800/50 text-rose-200 border border-rose-700/50 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Réinitialiser</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
