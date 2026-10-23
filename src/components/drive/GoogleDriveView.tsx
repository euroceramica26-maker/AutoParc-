import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  Folder, 
  FileText, 
  Download, 
  ExternalLink, 
  Trash2, 
  RefreshCw, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  HardDrive, 
  Search, 
  FileSpreadsheet, 
  ShieldCheck, 
  Layers, 
  Plus, 
  AlertCircle,
  FileCode,
  FileCheck
} from 'lucide-react';
import { useFleet } from '../../context/FleetContext';
import { 
  getValidDriveToken, 
  getDriveAbout, 
  listDriveFiles, 
  initializeAutoParcFolders, 
  deleteDriveFile, 
  uploadFileToDrive, 
  saveWorkOrderToDrive, 
  saveFleetBackupToDrive,
  GoogleDriveFile, 
  GoogleDriveAbout 
} from '../../services/googleDriveService';
import { getCachedAccessToken, googleSignIn, logoutGoogle } from '../../services/firebase';

export const GoogleDriveView: React.FC = () => {
  const { 
    reparations, 
    vehicules, 
    exportDatabaseJSON,
    firebaseUser,
    signInWithGoogle
  } = useFleet();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDriveConnected, setIsDriveConnected] = useState<boolean>(false);
  const [driveAbout, setDriveAbout] = useState<GoogleDriveAbout | null>(null);
  const [folders, setFolders] = useState<{
    rootFolderId: string;
    otFolderId: string;
    backupsFolderId: string;
    vehiculesFolderId: string;
  } | null>(null);
  const [selectedFolderTab, setSelectedFolderTab] = useState<'all' | 'ot' | 'backups' | 'vehicules'>('all');
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string; link?: string } | null>(null);

  // Modal de confirmation suppression (OBLIGATOIRE selon la règle Workspace Destructive Operations)
  const [fileToDelete, setFileToDelete] = useState<GoogleDriveFile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modal d'upload manuel
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDescription, setUploadDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Vérifier si le token est déjà disponible
  useEffect(() => {
    const token = getCachedAccessToken();
    if (token) {
      setIsDriveConnected(true);
      loadDriveData();
    }
  }, []);

  const loadDriveData = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      // 1. Charger informations sur le compte et quota
      const about = await getDriveAbout();
      setDriveAbout(about);
      setIsDriveConnected(true);

      // 2. Initialiser / récupérer dossiers AutoParc Pro
      const fds = await initializeAutoParcFolders();
      setFolders(fds);

      // 3. Charger les fichiers
      let targetFolderId: string | undefined;
      if (selectedFolderTab === 'ot') targetFolderId = fds.otFolderId;
      else if (selectedFolderTab === 'backups') targetFolderId = fds.backupsFolderId;
      else if (selectedFolderTab === 'vehicules') targetFolderId = fds.vehiculesFolderId;
      else targetFolderId = fds.rootFolderId;

      const driveFiles = await listDriveFiles({
        folderId: targetFolderId,
        searchQuery: searchQuery || undefined
      });
      setFiles(driveFiles);
    } catch (err: any) {
      console.error('Erreur chargement Drive:', err);
      if (err.message && err.message.includes('401')) {
        setIsDriveConnected(false);
      }
      setStatusMessage({
        type: 'error',
        text: err.message || 'Impossible de charger les données Google Drive. Veuillez vous reconnecter.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isDriveConnected) {
      loadDriveData();
    }
  }, [selectedFolderTab]);

  const handleConnectGoogle = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const res = await googleSignIn();
      if (res && res.accessToken) {
        setIsDriveConnected(true);
        setStatusMessage({
          type: 'success',
          text: `Connexion Google Drive réussie (${res.user.email || 'Compte Google'}) !`
        });
        await loadDriveData();
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Échec de la connexion Google Drive : ${err.message || 'Autorisation refusée.'}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    await logoutGoogle();
    setIsDriveConnected(false);
    setDriveAbout(null);
    setFiles([]);
    setStatusMessage({
      type: 'info',
      text: 'Session Google Drive déconnectée avec succès.'
    });
  };

  // Action : Sauvegarder l'Ordre de Travail OT-2026-0045 (Spécifiquement demandé)
  const handleSaveOT45 = async () => {
    const ot45 = reparations.find(r => r.numeroOT === 'OT-2026-0045') || reparations[0];
    if (!ot45) {
      setStatusMessage({ type: 'error', text: 'Ordre de travail OT-2026-0045 introuvable.' });
      return;
    }

    setIsLoading(true);
    try {
      const vehicule = vehicules.find(v => v.id === ot45.vehiculeId);
      const file = await saveWorkOrderToDrive(ot45, vehicule);
      setStatusMessage({
        type: 'success',
        text: `Ordre de travail ${ot45.numeroOT} (${vehicule ? `${vehicule.marque} ${vehicule.modele}` : 'Flotte'}) sauvegardé avec succès sur Google Drive !`,
        link: file.webViewLink
      });
      await loadDriveData();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Erreur sauvegarde OT sur Drive: ${err.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Action : Sauvegarder la base de données entière
  const handleBackupAll = async () => {
    setIsLoading(true);
    try {
      const json = exportDatabaseJSON();
      const file = await saveFleetBackupToDrive(json);
      setStatusMessage({
        type: 'success',
        text: 'Sauvegarde complète de la flotte archivée avec succès sur Google Drive !',
        link: file.webViewLink
      });
      await loadDriveData();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Erreur archivage sauvegarde: ${err.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Action : Supprimer définitivement un fichier (avec dialogue de confirmation obligatoire)
  const handleConfirmDelete = async () => {
    if (!fileToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDriveFile(fileToDelete.id);
      setStatusMessage({
        type: 'success',
        text: `Le fichier "${fileToDelete.name}" a été définitivement supprimé de Google Drive.`
      });
      setFileToDelete(null);
      await loadDriveData();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Échec de la suppression: ${err.message}`
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Action : Téléversement manuel d'un fichier (scan, facture, carte grise)
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setIsUploading(true);
    try {
      let targetFolder = folders?.vehiculesFolderId || folders?.rootFolderId;
      if (selectedFolderTab === 'ot') targetFolder = folders?.otFolderId;
      else if (selectedFolderTab === 'backups') targetFolder = folders?.backupsFolderId;

      const created = await uploadFileToDrive({
        name: uploadFile.name,
        content: uploadFile,
        mimeType: uploadFile.type || 'application/octet-stream',
        parentFolderId: targetFolder,
        description: uploadDescription || 'Document téléversé manuellement depuis AutoParc Pro'
      });

      setStatusMessage({
        type: 'success',
        text: `Document "${created.name}" téléversé avec succès sur Google Drive !`,
        link: created.webViewLink
      });
      setIsUploadModalOpen(false);
      setUploadFile(null);
      setUploadDescription('');
      await loadDriveData();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Échec du téléversement : ${err.message}`
      });
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytesStr?: string) => {
    if (!bytesStr) return '—';
    const bytes = parseInt(bytesStr, 10);
    if (isNaN(bytes)) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getStoragePercentage = () => {
    if (!driveAbout?.storageQuota?.limit || !driveAbout?.storageQuota?.usage) return 0;
    const limit = parseInt(driveAbout.storageQuota.limit, 10);
    const usage = parseInt(driveAbout.storageQuota.usage, 10);
    if (!limit || isNaN(limit) || !usage || isNaN(usage)) return 0;
    return Math.min(100, Math.round((usage / limit) * 100));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Cloud className="w-5 h-5 text-amber-500" />
              <span>Google Drive & Archivage GED</span>
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
              Workspace 1P
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Archivage dans le Cloud Google Drive : Ordres de Travail (OT-2026-0045), fiches véhicules et sauvegardes de données de maintenance.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {isDriveConnected && (
            <>
              <button
                onClick={handleSaveOT45}
                disabled={isLoading}
                className="px-3 py-1.5 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="Sauvegarder l'Ordre de Travail OT-2026-0045 sur Google Drive"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>Archiver OT-2026-0045</span>
              </button>

              <button
                onClick={handleBackupAll}
                disabled={isLoading}
                className="px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="Créer une sauvegarde complète JSON sur Google Drive"
              >
                <HardDrive className="w-3.5 h-3.5 text-sky-400" />
                <span>Sauvegarde Parc</span>
              </button>

              <button
                onClick={() => setIsUploadModalOpen(true)}
                disabled={isLoading}
                className="px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span>Téléverser</span>
              </button>

              <button
                onClick={loadDriveData}
                disabled={isLoading}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                title="Actualiser les fichiers"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 text-xs ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' 
            : statusMessage.type === 'error'
            ? 'bg-rose-950/40 border-rose-800 text-rose-300'
            : 'bg-blue-950/40 border-blue-800 text-blue-300'
        }`}>
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : statusMessage.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-blue-400" />
            )}
            <span>{statusMessage.text}</span>
          </div>

          {statusMessage.link && (
            <a
              href={statusMessage.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold underline text-white hover:text-amber-300 shrink-0 cursor-pointer"
            >
              <span>Ouvrir sur Google Drive</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {/* Connexion Card / Auth State */}
      {!isDriveConnected ? (
        <div className="p-8 rounded-2xl bg-slate-900/80 border border-slate-800 text-center max-w-xl mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 mx-auto">
            <Cloud className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white">
              Connecter votre compte Google Drive
            </h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              Activez la synchronisation Google Workspace pour stocker et archiver vos Ordres de Travail officiels (dont <strong className="text-amber-400">OT-2026-0045</strong>), exporter vos fiches de maintenance et sauvegarder l'état du parc d'engins en temps réel.
            </p>
          </div>

          <div className="pt-2">
            {/* Bouton officiel Google conforme aux consignes */}
            <button
              onClick={handleConnectGoogle}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-3 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs shadow-md transition-all cursor-pointer hover:shadow-lg disabled:opacity-60"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Se connecter avec Google (Autoriser Drive)</span>
            </button>
          </div>

          <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 pt-2 border-t border-slate-800">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Accès avec permission utilisateur
            </span>
            <span>·</span>
            <span>Dossier dédié « AutoParc Pro »</span>
          </div>
        </div>
      ) : (
        /* Connected Status Dashboard Card */
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {/* User info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold overflow-hidden">
              {driveAbout?.user?.photoLink ? (
                <img src={driveAbout.user.photoLink} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                'G'
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-white">
                  {driveAbout?.user?.displayName || 'Compte Google'}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" title="Connecté" />
              </div>
              <span className="text-[11px] text-slate-400 font-mono block">
                {driveAbout?.user?.emailAddress || 'euroceramica26@gmail.com'}
              </span>
            </div>
          </div>

          {/* Quota bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <HardDrive className="w-3 h-3 text-amber-400" />
                Espace Google Drive
              </span>
              <span className="font-mono text-slate-300">
                {formatFileSize(driveAbout?.storageQuota?.usage)} / {formatFileSize(driveAbout?.storageQuota?.limit)}
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${getStoragePercentage()}%` }}
              />
            </div>
          </div>

          {/* Quick disconnect */}
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={handleDisconnect}
              className="px-3 py-1 text-xs text-rose-300 hover:text-white bg-rose-950/30 hover:bg-rose-900/50 border border-rose-800/60 rounded-lg transition-colors cursor-pointer"
            >
              Déconnecter Drive
            </button>
          </div>
        </div>
      )}

      {/* Explorer / Documents Section */}
      {isDriveConnected && (
        <div className="space-y-4">
          {/* Fast Save OT-2026-0045 Card */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-amber-400 text-xs px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40">
                  OT-2026-0045
                </span>
                <span className="text-xs font-semibold text-white">
                  Révision Générale 100 000 km · Mercedes-Benz Actros 2642
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Immatriculation : 45678-A-26 · Montant : 4 980,00 DH · Technicien : Karim El Mansouri
              </p>
            </div>

            <button
              onClick={handleSaveOT45}
              disabled={isLoading}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Sauvegarder cet OT sur Google Drive</span>
            </button>
          </div>

          {/* Dossiers Tabs & Recherche */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Folder Navigation */}
              <div className="flex items-center gap-1 p-1 bg-slate-800/80 rounded-lg overflow-x-auto text-xs">
                <button
                  onClick={() => setSelectedFolderTab('all')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    selectedFolderTab === 'all'
                      ? 'bg-amber-500 text-slate-950 font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Folder className="w-3.5 h-3.5" />
                  <span>Dossier Racine AutoParc</span>
                </button>

                <button
                  onClick={() => setSelectedFolderTab('ot')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    selectedFolderTab === 'ot'
                      ? 'bg-amber-500 text-slate-950 font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Ordres de Travail (OT)</span>
                </button>

                <button
                  onClick={() => setSelectedFolderTab('backups')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    selectedFolderTab === 'backups'
                      ? 'bg-amber-500 text-slate-950 font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>Sauvegardes & Exports</span>
                </button>

                <button
                  onClick={() => setSelectedFolderTab('vehicules')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    selectedFolderTab === 'vehicules'
                      ? 'bg-amber-500 text-slate-950 font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Documents Engins</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-64">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && loadDriveData()}
                  placeholder="Rechercher dans Google Drive..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Files List Table */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/40 text-slate-400">
                    <th className="py-3 px-4 font-medium">Nom du Document</th>
                    <th className="py-3 px-4 font-medium">Type</th>
                    <th className="py-3 px-4 font-medium">Taille</th>
                    <th className="py-3 px-4 font-medium">Dernière Modification</th>
                    <th className="py-3 px-4 font-medium text-right">Actions Drive</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
                          <span>Synchronisation avec Google Drive en cours...</span>
                        </div>
                      </td>
                    </tr>
                  ) : files.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        Aucun fichier dans ce dossier Google Drive. Utilisez les boutons ci-dessus pour archiver un Ordre de Travail ou téléverser un fichier.
                      </td>
                    </tr>
                  ) : (
                    files.map(file => {
                      const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                      const isHTML = file.mimeType.includes('html');
                      const isJSON = file.mimeType.includes('json');
                      const isPDF = file.mimeType.includes('pdf');
                      const isSheet = file.mimeType.includes('sheet') || file.mimeType.includes('excel') || file.mimeType.includes('csv');

                      return (
                        <tr key={file.id} className="hover:bg-slate-800/30 transition-colors">
                          {/* File Name */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              {isFolder ? (
                                <Folder className="w-4 h-4 text-amber-400 shrink-0" />
                              ) : isHTML ? (
                                <FileCode className="w-4 h-4 text-sky-400 shrink-0" />
                              ) : isJSON ? (
                                <HardDrive className="w-4 h-4 text-emerald-400 shrink-0" />
                              ) : isSheet ? (
                                <FileSpreadsheet className="w-4 h-4 text-emerald-500 shrink-0" />
                              ) : isPDF ? (
                                <FileText className="w-4 h-4 text-rose-400 shrink-0" />
                              ) : (
                                <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                              )}

                              <div>
                                <span className="font-medium text-white block">
                                  {file.name}
                                </span>
                                {file.description && (
                                  <span className="text-[10px] text-slate-500 line-clamp-1">
                                    {file.description}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* MIME / Type */}
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700">
                              {isFolder ? 'Dossier' : 
                               isHTML ? 'Document A4' :
                               isJSON ? 'Sauvegarde JSON' :
                               isSheet ? 'Tableur' :
                               isPDF ? 'PDF' : 'Fichier'}
                            </span>
                          </td>

                          {/* File size */}
                          <td className="py-3 px-4 font-mono text-slate-400">
                            {formatFileSize(file.size)}
                          </td>

                          {/* Date modified */}
                          <td className="py-3 px-4 font-mono text-slate-400">
                            {file.modifiedTime ? new Date(file.modifiedTime).toLocaleString('fr-FR') : '—'}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {file.webViewLink && (
                                <a
                                  href={file.webViewLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                                  title="Ouvrir dans Google Drive"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}

                              {file.webContentLink && (
                                <a
                                  href={file.webContentLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                                  title="Télécharger depuis Google Drive"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </a>
                              )}

                              {/* Bouton de suppression : Ouvre le modal de confirmation obligatoire */}
                              <button
                                onClick={() => setFileToDelete(file)}
                                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                                title="Supprimer de Google Drive"
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
        </div>
      )}

      {/* MODAL OBLIGATOIRE DE CONFIRMATION DE SUPPRESSION (Workspace Destructive Operation) */}
      {fileToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-800/60 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Confirmer la suppression sur Google Drive
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Action destructive irréversible sur votre espace Google Workspace.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1 text-xs">
              <div className="text-slate-400">Fichier concerné :</div>
              <div className="font-semibold text-white font-mono break-all">
                {fileToDelete.name}
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                Taille : {formatFileSize(fileToDelete.size)}
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Êtes-vous certain de vouloir supprimer ce document de votre Google Drive ? Le fichier ne sera plus accessible ni restaurable via l'application.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setFileToDelete(null)}
                disabled={isDeleting}
                className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-60 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Suppression...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirmer la suppression</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Téléversement Manuel */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-white">
                  Téléverser un document vers Google Drive
                </h3>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                Fermer
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1.5 font-medium">
                  Sélectionner le fichier (PDF, image de constat, facture, carte grise...)
                </label>
                <input
                  type="file"
                  required
                  onChange={e => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full text-slate-300 bg-slate-800/80 border border-slate-700 rounded-lg p-2 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1.5 font-medium">
                  Description / Observations (Optionnel)
                </label>
                <textarea
                  rows={2}
                  value={uploadDescription}
                  onChange={e => setUploadDescription(e.target.value)}
                  placeholder="Ex: Facture vidange Mercedes Actros 2642..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  disabled={isUploading}
                  className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !uploadFile}
                  className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Téléversement...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Téléverser vers Drive</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
