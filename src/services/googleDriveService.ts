import { getCachedAccessToken, googleSignIn } from './firebase';
import { Reparation, Vehicule } from '../types/fleet';
import { generateWorkOrderHtml } from '../utils/workOrderDocument';

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime: string;
  createdTime?: string;
  webViewLink?: string;
  webContentLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
  parents?: string[];
  description?: string;
}

export interface GoogleDriveAbout {
  user?: {
    displayName: string;
    emailAddress: string;
    photoLink?: string;
  };
  storageQuota?: {
    limit?: string;
    usage?: string;
    usageInDrive?: string;
    usageInDriveTrash?: string;
  };
}

const APP_ROOT_FOLDER_NAME = 'AutoParc Pro - Flotte & Documents';

// Récupère ou déclenche l'obtention du token d'accès Google Drive
export async function getValidDriveToken(): Promise<string> {
  const token = getCachedAccessToken();
  if (token) return token;

  const res = await googleSignIn();
  if (!res || !res.accessToken) {
    throw new Error('Connexion Google requise pour accéder à Google Drive.');
  }
  return res.accessToken;
}

// Informations sur le compte et quota Google Drive
export async function getDriveAbout(): Promise<GoogleDriveAbout> {
  const token = await getValidDriveToken();
  const res = await fetch('https://www.googleapis.com/drive/v3/about?fields=user,storageQuota', {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Erreur récupération infos Drive (${res.status}): ${errorText}`);
  }

  return await res.json();
}

// Rechercher ou créer un dossier Google Drive
export async function findOrCreateFolder(
  folderName: string, 
  parentFolderId?: string
): Promise<string> {
  const token = await getValidDriveToken();

  let query = `mimeType = 'application/vnd.google-apps.folder' and name = '${folderName.replace(/'/g, "\\'")}' and trashed = false`;
  if (parentFolderId) {
    query += ` and '${parentFolderId}' in parents`;
  }

  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (searchRes.ok) {
    const data = await searchRes.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
  }

  // Créer le dossier s'il n'existe pas
  const body: Record<string, any> = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder'
  };
  if (parentFolderId) {
    body.parents = [parentFolderId];
  }

  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!createRes.ok) {
    const errorText = await createRes.text();
    throw new Error(`Impossible de créer le dossier Drive "${folderName}": ${errorText}`);
  }

  const created = await createRes.json();
  return created.id;
}

// Initialise l'arborescence standard AutoParc Pro sur Google Drive
export async function initializeAutoParcFolders(): Promise<{
  rootFolderId: string;
  otFolderId: string;
  backupsFolderId: string;
  vehiculesFolderId: string;
}> {
  const rootFolderId = await findOrCreateFolder(APP_ROOT_FOLDER_NAME);
  const otFolderId = await findOrCreateFolder('Ordres de Travail (OT)', rootFolderId);
  const backupsFolderId = await findOrCreateFolder('Sauvegardes & Exports', rootFolderId);
  const vehiculesFolderId = await findOrCreateFolder('Documents Véhicules & Engins', rootFolderId);

  return { rootFolderId, otFolderId, backupsFolderId, vehiculesFolderId };
}

// Lister les fichiers d'un dossier ou de l'application
export async function listDriveFiles(options?: {
  folderId?: string;
  searchQuery?: string;
  pageSize?: number;
}): Promise<GoogleDriveFile[]> {
  const token = await getValidDriveToken();

  const queries: string[] = ['trashed = false'];
  if (options?.folderId) {
    queries.push(`'${options.folderId}' in parents`);
  }
  if (options?.searchQuery) {
    queries.push(`name contains '${options.searchQuery.replace(/'/g, "\\'")}'`);
  }

  const q = queries.join(' and ');
  const fields = 'files(id,name,mimeType,size,modifiedTime,createdTime,webViewLink,webContentLink,iconLink,thumbnailLink,parents,description)';
  const pageSize = options?.pageSize || 40;

  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&pageSize=${pageSize}&fields=${encodeURIComponent(fields)}&orderBy=modifiedTime desc`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Erreur consultation des fichiers Drive (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return data.files || [];
}

// Téléverser un fichier vers Google Drive (Multipart)
export async function uploadFileToDrive(params: {
  name: string;
  content: string | Blob;
  mimeType: string;
  parentFolderId?: string;
  description?: string;
}): Promise<GoogleDriveFile> {
  const token = await getValidDriveToken();

  const metadata: Record<string, any> = {
    name: params.name,
    mimeType: params.mimeType,
  };
  if (params.parentFolderId) {
    metadata.parents = [params.parentFolderId];
  }
  if (params.description) {
    metadata.description = params.description;
  }

  const boundary = '-------AutoParcProDriveBoundary' + Math.random().toString(36).substring(2);
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  let body: Blob;
  const metadataBlob = new Blob([
    delimiter,
    'Content-Type: application/json; charset=UTF-8\r\n\r\n',
    JSON.stringify(metadata),
    delimiter,
    `Content-Type: ${params.mimeType}\r\n\r\n`
  ], { type: 'text/plain' });

  const contentBlob = typeof params.content === 'string'
    ? new Blob([params.content], { type: params.mimeType })
    : params.content;

  const closeBlob = new Blob([closeDelimiter], { type: 'text/plain' });
  body = new Blob([metadataBlob, contentBlob, closeBlob]);

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,modifiedTime,webViewLink,webContentLink,parents,description',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Échec téléversement Drive (${res.status}): ${errorText}`);
  }

  return await res.json();
}

// Supprimer un fichier Google Drive (Destructive: strictly called after user confirmation)
export async function deleteDriveFile(fileId: string): Promise<boolean> {
  const token = await getValidDriveToken();
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok && res.status !== 204) {
    const errorText = await res.text();
    throw new Error(`Erreur suppression fichier Drive (${res.status}): ${errorText}`);
  }

  return true;
}

// Fonction métier : Sauvegarder un Ordre de Travail spécifique sur Google Drive
export async function saveWorkOrderToDrive(
  reparation: Reparation,
  vehicule?: Vehicule
): Promise<GoogleDriveFile> {
  // Obtenir ou créer le dossier 'Ordres de Travail (OT)'
  const { otFolderId } = await initializeAutoParcFolders();

  // Générer le document HTML officiel A4
  const htmlContent = generateWorkOrderHtml(reparation, vehicule);
  const safeTitle = (reparation.titre || 'Intervention').replace(/[^a-zA-Z0-9_-]/g, '_');
  const immat = vehicule?.immatriculation ? vehicule.immatriculation.replace(/[^a-zA-Z0-9_-]/g, '-') : 'Flotte';
  const fileName = `${reparation.numeroOT}_${immat}_${safeTitle}.html`;

  return await uploadFileToDrive({
    name: fileName,
    content: htmlContent,
    mimeType: 'text/html',
    parentFolderId: otFolderId,
    description: `Ordre de travail ${reparation.numeroOT} pour le véhicule ${vehicule ? `${vehicule.marque} ${vehicule.modele} (${vehicule.immatriculation})` : 'non lié'}. Technicien : ${reparation.technicien}. Date : ${reparation.dateDeclaration}.`
  });
}

// Fonction métier : Sauvegarder l'intégralité de la base de données sur Google Drive
export async function saveFleetBackupToDrive(databaseJson: string): Promise<GoogleDriveFile> {
  const { backupsFolderId } = await initializeAutoParcFolders();
  const dateStr = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const fileName = `AutoParc_Pro_Backup_Complet_${dateStr}.json`;

  return await uploadFileToDrive({
    name: fileName,
    content: databaseJson,
    mimeType: 'application/json',
    parentFolderId: backupsFolderId,
    description: `Sauvegarde intégrale du parc de véhicules, des pièces de rechange, des ordres de travail et des alertes générée le ${new Date().toLocaleString('fr-FR')}.`
  });
}
