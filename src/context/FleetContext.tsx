import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { 
  Vehicule, 
  PieceRechange, 
  MouvementStock, 
  Reparation, 
  AlerteMaintenance,
  SeveriteAlerte,
  PieceUtilisee,
  FleetUser
} from '../types/fleet';
import { 
  INITIAL_VEHICULES, 
  INITIAL_PIECES, 
  INITIAL_MOUVEMENTS, 
  INITIAL_REPARATIONS, 
  INITIAL_ALERTES,
  INITIAL_USERS
} from '../data/mockData';
import { 
  db, 
  auth, 
  googleProvider, 
  googleSignIn,
  logoutGoogle,
  getCachedAccessToken,
  testConnection, 
  handleFirestoreError, 
  OperationType 
} from '../services/firebase';
import { 
  saveWorkOrderToDrive,
  saveFleetBackupToDrive
} from '../services/googleDriveService';
import { 
  onAuthStateChanged, 
  signOut as fbSignOut, 
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs 
} from 'firebase/firestore';

interface FleetContextType {
  vehicules: Vehicule[];
  pieces: PieceRechange[];
  mouvements: MouvementStock[];
  reparations: Reparation[];
  alertes: AlerteMaintenance[];
  users: FleetUser[];
  currentUser: FleetUser | null;
  
  // Auth actions
  login: (login: string, motDePasse: string) => boolean;
  logout: () => void;
  switchUser: (userId: string) => void;

  // Users actions
  addUser: (user: Omit<FleetUser, 'id' | 'dateCreation'>) => FleetUser;
  updateUser: (id: string, updates: Partial<FleetUser>) => void;
  deleteUser: (id: string) => void;

  // Vehicules actions
  addVehicule: (vehicule: Omit<Vehicule, 'id'>) => Vehicule;
  updateVehicule: (id: string, updates: Partial<Vehicule>) => void;
  deleteVehicule: (id: string) => void;
  updateCompteur: (id: string, nouvelleValeur: number) => void;
  importVehiculesFromExcel: (newVehicules: Array<Omit<Vehicule, 'id'>>) => number;
  
  // Pieces actions
  addPiece: (piece: Omit<PieceRechange, 'id'>) => PieceRechange;
  updatePiece: (id: string, updates: Partial<PieceRechange>) => void;
  deletePiece: (id: string) => void;
  reapprovisionnerPiece: (id: string, quantite: number, motif?: string, auteur?: string) => void;
  ajusterStockPiece: (id: string, nouvelleQuantite: number, motif: string, auteur?: string) => void;
  importPiecesFromExcel: (newPieces: Array<Omit<PieceRechange, 'id' | 'dateDernierAppro'>>) => number;

  // Reparations actions
  addReparation: (reparation: Omit<Reparation, 'id' | 'numeroOT' | 'coutPieces' | 'coutTotal'>) => Reparation;
  updateReparation: (id: string, updates: Partial<Reparation>) => void;
  deleteReparation: (id: string) => void;
  changerStatutReparation: (id: string, nouveauStatut: Reparation['statut']) => void;
  
  // Alertes actions
  addAlerte: (alerte: Omit<AlerteMaintenance, 'id' | 'severite' | 'messageEcheance' | 'estTraitee'>) => void;
  deleteAlerte: (id: string) => void;
  marquerAlerteTraitee: (id: string) => void;
  convertirAlerteEnOT: (alerteId: string) => Reparation | null;
  
  // Système & Données
  resetToDefaultData: () => void;
  exportDatabaseJSON: () => string;
  importDatabaseJSON: (jsonStr: string) => boolean;

  // Firebase & Google Drive Integration
  isFirebaseConnected: boolean;
  firebaseUser: FirebaseUser | null;
  isSyncing: boolean;
  lastSyncTime: string | null;
  signInWithGoogle: () => Promise<boolean>;
  signOutFirebase: () => Promise<void>;
  syncAllToFirestore: () => Promise<boolean>;
  loadAllFromFirestore: () => Promise<boolean>;
  saveOTToDrive: (reparationId: string) => Promise<{ success: boolean; file?: any; message: string; link?: string }>;
  saveAllFleetToDrive: () => Promise<{ success: boolean; file?: any; message: string; link?: string }>;

  // Statistiques calculées rapides
  statsGlobales: {
    totalVehicules: number;
    vehiculesEnService: number;
    vehiculesEnPanneOuMaint: number;
    tauxDisponibilite: number;
    totalPiecesRefs: number;
    piecesEnAlerte: number;
    piecesEnRupture: number;
    valeurTotaleStock: number;
    otEnCours: number;
    otUrgents: number;
    depensesMoisEnCours: number;
    alertesUrgentes: number;
    alertesAttentions: number;
  };
}

const STORAGE_KEY_PREFIX = 'autoparc_pro_data_v1';

const FleetContext = createContext<FleetContextType | undefined>(undefined);

export const FleetProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<FleetUser[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}_users`);
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<FleetUser | null>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}_session`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback below
      }
    }
    // Default to ouaradtech admin
    return INITIAL_USERS[0];
  });

  const [vehicules, setVehicules] = useState<Vehicule[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}_vehicules`);
    return saved ? JSON.parse(saved) : INITIAL_VEHICULES;
  });

  const [pieces, setPieces] = useState<PieceRechange[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}_pieces`);
    return saved ? JSON.parse(saved) : INITIAL_PIECES;
  });

  const [mouvements, setMouvements] = useState<MouvementStock[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}_mouvements`);
    return saved ? JSON.parse(saved) : INITIAL_MOUVEMENTS;
  });

  const [reparations, setReparations] = useState<Reparation[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}_reparations`);
    if (saved) {
      try {
        const parsed: Reparation[] = JSON.parse(saved);
        const has45 = parsed.some(r => r.numeroOT === 'OT-2026-0045');
        if (!has45) {
          const ot45 = INITIAL_REPARATIONS.find(r => r.numeroOT === 'OT-2026-0045');
          if (ot45) return [ot45, ...parsed];
        }
        return parsed;
      } catch (e) {
        return INITIAL_REPARATIONS;
      }
    }
    return INITIAL_REPARATIONS;
  });

  const [alertes, setAlertes] = useState<AlerteMaintenance[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}_alertes`);
    return saved ? JSON.parse(saved) : INITIAL_ALERTES;
  });

  // Firebase Cloud State
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Firebase boot connection test & Auth listener (Mandatory Skill constraint)
  useEffect(() => {
    testConnection().then(connected => {
      setIsFirebaseConnected(connected);
    });

    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        setIsFirebaseConnected(true);
        // Map Google user to fleet user session
        setUsers(prev => {
          const exists = prev.find(u => u.email === fbUser.email);
          if (exists) {
            setCurrentUser(exists);
            return prev;
          }
          const newGUser: FleetUser = {
            id: fbUser.uid,
            login: fbUser.email ? fbUser.email.split('@')[0] : 'admin_google',
            motDePasse: '••••••••',
            nom: fbUser.displayName || fbUser.email || 'Utilisateur Google',
            email: fbUser.email || '',
            role: fbUser.email === 'euroceramica26@gmail.com' ? 'ADMIN' : 'CHEF_ATELIER',
            actif: true,
            dateCreation: new Date().toISOString().split('T')[0],
            dernierAcces: new Date().toISOString().replace('T', ' ').substring(0, 16)
          };
          setCurrentUser(newGUser);
          return [newGUser, ...prev];
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Sauvegarde automatique localStorage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}_users`, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}_session`, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}_session`);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}_vehicules`, JSON.stringify(vehicules));
  }, [vehicules]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}_pieces`, JSON.stringify(pieces));
  }, [pieces]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}_mouvements`, JSON.stringify(mouvements));
  }, [mouvements]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}_reparations`, JSON.stringify(reparations));
  }, [reparations]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}_alertes`, JSON.stringify(alertes));
  }, [alertes]);

  // Recalcul des alertes de maintenance périodique en fonction des compteurs des véhicules
  useEffect(() => {
    const today = new Date('2026-10-07T00:00:00'); // Date de référence système

    setAlertes(prevAlertes => {
      let changed = false;
      const updated = prevAlertes.map(alt => {
        const vehicule = vehicules.find(v => v.id === alt.vehiculeId);
        if (!vehicule) return alt;

        let severite: SeveriteAlerte = 'OK';
        let messageEcheance = '';

        if (alt.typeDeclencheur === 'COMPTEUR' && alt.compteurEcheance !== undefined) {
          const diff = alt.compteurEcheance - vehicule.compteurActuel;
          const unite = vehicule.compteurType;

          if (diff <= 0) {
            severite = 'URGENT';
            messageEcheance = `Dépassé de ${Math.abs(diff).toLocaleString('fr-MA')} ${unite}`;
          } else if (diff <= (unite === 'km' ? 1500 : 40)) {
            severite = 'ATTENTION';
            messageEcheance = `Échéance proche : dans ${diff.toLocaleString('fr-MA')} ${unite}`;
          } else {
            severite = 'OK';
            messageEcheance = `À jour (dans ${diff.toLocaleString('fr-MA')} ${unite})`;
          }
        } else if (alt.typeDeclencheur === 'CALENDRIER' && alt.dateEcheance) {
          const echeance = new Date(alt.dateEcheance);
          const diffJours = Math.round((echeance.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

          if (diffJours <= 0) {
            severite = 'URGENT';
            messageEcheance = `Échu depuis ${Math.abs(diffJours)} jours (${alt.dateEcheance})`;
          } else if (diffJours <= 20) {
            severite = diffJours <= 7 ? 'URGENT' : 'ATTENTION';
            messageEcheance = `Échéance le ${new Date(alt.dateEcheance).toLocaleDateString('fr-FR')} (dans ${diffJours} j)`;
          } else {
            severite = 'OK';
            messageEcheance = `Prévu le ${new Date(alt.dateEcheance).toLocaleDateString('fr-FR')} (${diffJours} j)`;
          }
        }

        if (alt.severite !== severite || alt.messageEcheance !== messageEcheance) {
          changed = true;
          return { ...alt, severite, messageEcheance };
        }
        return alt;
      });

      return changed ? updated : prevAlertes;
    });
  }, [vehicules]);

  // Auth & Users
  const login = (loginInput: string, mdpInput: string): boolean => {
    const found = users.find(u => 
      u.login.trim().toLowerCase() === loginInput.trim().toLowerCase() && 
      u.motDePasse === mdpInput &&
      u.actif
    );
    if (found) {
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
      const updated = { ...found, dernierAcces: nowStr };
      setCurrentUser(updated);
      setUsers(prev => prev.map(u => u.id === found.id ? updated : u));
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const switchUser = (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (target) {
      setCurrentUser(target);
    }
  };

  const addUser = (data: Omit<FleetUser, 'id' | 'dateCreation'>): FleetUser => {
    const newUser: FleetUser = {
      ...data,
      id: `usr-${Date.now().toString(36)}`,
      dateCreation: new Date().toISOString().split('T')[0]
    };
    setUsers(prev => [newUser, ...prev]);
    return newUser;
  };

  const updateUser = (id: string, updates: Partial<FleetUser>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    if (currentUser && currentUser.id === id) {
      setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    if (currentUser && currentUser.id === id) {
      // Find remaining admin or first user
      const remaining = users.filter(u => u.id !== id);
      setCurrentUser(remaining[0] || null);
    }
  };

  // Actions Véhicules
  const addVehicule = (data: Omit<Vehicule, 'id'>): Vehicule => {
    const newId = `vh-${Date.now().toString(36)}`;
    const newVehicule: Vehicule = { ...data, id: newId };
    setVehicules(prev => [newVehicule, ...prev]);
    return newVehicule;
  };

  const updateVehicule = (id: string, updates: Partial<Vehicule>) => {
    setVehicules(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
  };

  const deleteVehicule = (id: string) => {
    setVehicules(prev => prev.filter(v => v.id !== id));
  };

  const updateCompteur = (id: string, nouvelleValeur: number) => {
    setVehicules(prev => prev.map(v => {
      if (v.id === id) {
        return { ...v, compteurActuel: Math.max(v.compteurActuel, nouvelleValeur) };
      }
      return v;
    }));
  };

  const importVehiculesFromExcel = (newVehiculesData: Array<Omit<Vehicule, 'id'>>): number => {
    if (!newVehiculesData || newVehiculesData.length === 0) return 0;
    const vehiculesToAdd: Vehicule[] = newVehiculesData.map((item, idx) => ({
      ...item,
      id: `vh-imp-${Date.now().toString(36)}-${idx}`
    }));
    setVehicules(prev => [...vehiculesToAdd, ...prev]);
    return vehiculesToAdd.length;
  };

  // Actions Pièces de rechange
  const addPiece = (data: Omit<PieceRechange, 'id'>): PieceRechange => {
    const newId = `pc-${Date.now().toString(36)}`;
    const newPiece: PieceRechange = { ...data, id: newId };
    setPieces(prev => [newPiece, ...prev]);

    // Enregistrer le premier mouvement d'entrée
    if (newPiece.stockActuel > 0) {
      const mvt: MouvementStock = {
        id: `mvt-${Date.now().toString(36)}`,
        pieceId: newId,
        referencePiece: newPiece.reference,
        designationPiece: newPiece.designation,
        type: 'ENTREE',
        quantite: newPiece.stockActuel,
        date: new Date().toISOString().split('T')[0],
        motif: 'Stock initial à la création de la référence',
        auteur: currentUser?.nom || 'Gestionnaire de Stock'
      };
      setMouvements(prev => [mvt, ...prev]);
    }

    return newPiece;
  };

  const updatePiece = (id: string, updates: Partial<PieceRechange>) => {
    setPieces(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deletePiece = (id: string) => {
    setPieces(prev => prev.filter(p => p.id !== id));
  };

  const reapprovisionnerPiece = (id: string, quantite: number, motif?: string, auteur?: string) => {
    const piece = pieces.find(p => p.id === id);
    if (!piece || quantite <= 0) return;

    const todayStr = new Date().toISOString().split('T')[0];

    setPieces(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          stockActuel: p.stockActuel + quantite,
          dateDernierAppro: todayStr
        };
      }
      return p;
    }));

    const mvt: MouvementStock = {
      id: `mvt-${Date.now().toString(36)}`,
      pieceId: id,
      referencePiece: piece.reference,
      designationPiece: piece.designation,
      type: 'ENTREE',
      quantite,
      date: todayStr,
      motif: motif || `Réapprovisionnement de stock (+${quantite})`,
      auteur: auteur || currentUser?.nom || 'Responsable Parc'
    };
    setMouvements(prev => [mvt, ...prev]);
  };

  const ajusterStockPiece = (id: string, nouvelleQuantite: number, motif: string, auteur?: string) => {
    const piece = pieces.find(p => p.id === id);
    if (!piece) return;

    const difference = nouvelleQuantite - piece.stockActuel;
    if (difference === 0) return;

    const todayStr = new Date().toISOString().split('T')[0];

    setPieces(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, stockActuel: nouvelleQuantite };
      }
      return p;
    }));

    const mvt: MouvementStock = {
      id: `mvt-${Date.now().toString(36)}`,
      pieceId: id,
      referencePiece: piece.reference,
      designationPiece: piece.designation,
      type: difference > 0 ? 'ENTREE' : 'SORTIE',
      quantite: Math.abs(difference),
      date: todayStr,
      motif: `Ajustement inventaire: ${motif} (${piece.stockActuel} -> ${nouvelleQuantite})`,
      auteur: auteur || currentUser?.nom || 'Magasinier'
    };
    setMouvements(prev => [mvt, ...prev]);
  };

  // Importation en masse via fichier Excel
  const importPiecesFromExcel = (newPiecesData: Array<Omit<PieceRechange, 'id' | 'dateDernierAppro'>>): number => {
    if (!newPiecesData || newPiecesData.length === 0) return 0;
    const todayStr = new Date().toISOString().split('T')[0];

    const piecesToAdd: PieceRechange[] = [];
    const mouvementsToAdd: MouvementStock[] = [];

    newPiecesData.forEach((item, idx) => {
      const newId = `pc-imp-${Date.now().toString(36)}-${idx}`;
      const piece: PieceRechange = {
        ...item,
        id: newId,
        dateDernierAppro: todayStr
      };
      piecesToAdd.push(piece);

      if (piece.stockActuel > 0) {
        mouvementsToAdd.push({
          id: `mvt-${Math.random().toString(36).substring(2, 9)}`,
          pieceId: newId,
          referencePiece: piece.reference,
          designationPiece: piece.designation,
          type: 'ENTREE',
          quantite: piece.stockActuel,
          date: todayStr,
          motif: 'Importation en masse via fichier Excel',
          auteur: currentUser?.nom || 'Administrateur'
        });
      }
    });

    setPieces(prev => [...piecesToAdd, ...prev]);
    if (mouvementsToAdd.length > 0) {
      setMouvements(prev => [...mouvementsToAdd, ...prev]);
    }
    return piecesToAdd.length;
  };

  // Actions Réparations
  const addReparation = (data: Omit<Reparation, 'id' | 'numeroOT' | 'coutPieces' | 'coutTotal'>): Reparation => {
    const newId = `rep-${Date.now().toString(36)}`;
    const nextOTNumber = `OT-2026-${String(reparations.length + 45).padStart(4, '0')}`;
    
    // Calcul coût des pièces
    const coutPieces = (data.piecesUtilisees || []).reduce((sum, item) => sum + (Number(item.prixUnitaire || 0) * Number(item.quantite || 0)), 0);
    const coutTotal = Number((coutPieces + Number(data.coutMainOeuvre || 0)).toFixed(2));

    const newReparation: Reparation = {
      ...data,
      id: newId,
      numeroOT: nextOTNumber,
      coutPieces: Number(coutPieces.toFixed(2)),
      coutTotal
    };

    setReparations(prev => [newReparation, ...prev]);

    // Déduire automatiquement les pièces du stock et tracer les sorties
    if (data.piecesUtilisees && data.piecesUtilisees.length > 0) {
      const todayStr = new Date().toISOString().split('T')[0];

      setPieces(prevPieces => {
        return prevPieces.map(piece => {
          const match = data.piecesUtilisees.find(pu => pu.pieceId === piece.id);
          if (match) {
            return {
              ...piece,
              stockActuel: Math.max(0, piece.stockActuel - match.quantite)
            };
          }
          return piece;
        });
      });

      const newMouvements: MouvementStock[] = data.piecesUtilisees.map(pu => ({
        id: `mvt-${Math.random().toString(36).substring(2, 9)}`,
        pieceId: pu.pieceId,
        referencePiece: pu.reference,
        designationPiece: pu.designation,
        type: 'SORTIE',
        quantite: pu.quantite,
        date: todayStr,
        motif: `Affecté à l'intervention ${nextOTNumber}`,
        auteur: data.technicien,
        reparationId: newId
      }));

      setMouvements(prev => [...newMouvements, ...prev]);
    }

    // Si l'intervention est urgente ou en panne, mettre à jour le statut du véhicule
    if (data.priorite === 'URGENTE' || data.type === 'DEPANNAGE_URGENT') {
      updateVehicule(data.vehiculeId, { statut: 'EN_PANNE' });
    } else if (data.statut === 'EN_COURS') {
      updateVehicule(data.vehiculeId, { statut: 'EN_MAINTENANCE' });
    }

    // Mettre à jour le compteur du véhicule s'il a progressé
    if (data.compteurReleve > 0) {
      updateCompteur(data.vehiculeId, data.compteurReleve);
    }

    return newReparation;
  };

  const updateReparation = (id: string, updates: Partial<Reparation>) => {
    setReparations(prev => prev.map(r => {
      if (r.id === id) {
        const merged = { ...r, ...updates };
        // Recalcul automatique des coûts
        if (updates.piecesUtilisees || updates.coutMainOeuvre !== undefined) {
          const coutPieces = (merged.piecesUtilisees || []).reduce((sum, item) => sum + (Number(item.prixUnitaire || 0) * Number(item.quantite || 0)), 0);
          merged.coutPieces = Number(coutPieces.toFixed(2));
          merged.coutTotal = Number((merged.coutPieces + Number(merged.coutMainOeuvre || 0)).toFixed(2));
        }
        return merged;
      }
      return r;
    }));

    if (updates.statut === 'TERMINEE' && updates.vehiculeId) {
      updateVehicule(updates.vehiculeId, { statut: 'EN_SERVICE' });
    } else if (updates.statut === 'EN_COURS' && updates.vehiculeId) {
      updateVehicule(updates.vehiculeId, { statut: 'EN_MAINTENANCE' });
    }

    if (updates.compteurReleve && updates.compteurReleve > 0 && updates.vehiculeId) {
      updateCompteur(updates.vehiculeId, updates.compteurReleve);
    }
  };

  const deleteReparation = (id: string) => {
    setReparations(prev => prev.filter(r => r.id !== id));
  };

  const changerStatutReparation = (id: string, nouveauStatut: Reparation['statut']) => {
    const rep = reparations.find(r => r.id === id);
    if (!rep) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const updates: Partial<Reparation> = { statut: nouveauStatut };
    
    if (nouveauStatut === 'TERMINEE' && !rep.dateRealisation) {
      updates.dateRealisation = todayStr;
      // Remettre le véhicule en service s'il était immobilisé
      updateVehicule(rep.vehiculeId, { statut: 'EN_SERVICE' });
    } else if (nouveauStatut === 'EN_COURS') {
      updateVehicule(rep.vehiculeId, { statut: 'EN_MAINTENANCE' });
    }

    updateReparation(id, updates);
  };

  // Actions Alertes
  const addAlerte = (data: Omit<AlerteMaintenance, 'id' | 'severite' | 'messageEcheance' | 'estTraitee'>) => {
    const newId = `alt-${Date.now().toString(36)}`;
    const newAlerte: AlerteMaintenance = {
      ...data,
      id: newId,
      severite: 'ATTENTION',
      messageEcheance: 'Nouvelle alerte programmée',
      estTraitee: false
    };
    setAlertes(prev => [newAlerte, ...prev]);
  };

  const deleteAlerte = (id: string) => {
    setAlertes(prev => prev.filter(a => a.id !== id));
  };

  const marquerAlerteTraitee = (id: string) => {
    setAlertes(prev => prev.map(a => a.id === id ? { ...a, estTraitee: true } : a));
  };

  const convertirAlerteEnOT = (alerteId: string): Reparation | null => {
    const alerte = alertes.find(a => a.id === alerteId);
    if (!alerte) return null;

    const vehicule = vehicules.find(v => v.id === alerte.vehiculeId);
    if (!vehicule) return null;

    const todayStr = new Date().toISOString().split('T')[0];

    const rep = addReparation({
      vehiculeId: vehicule.id,
      type: alerte.typeDeclencheur === 'CALENDRIER' ? 'CONTROLE_REGLEMENTAIRE' : 'PREVENTIVE',
      titre: `[Maintenance Périodique] ${alerte.titre}`,
      description: alerte.description,
      priorite: alerte.severite === 'URGENT' ? 'URGENTE' : 'NORMALE',
      statut: 'PLANIFIEE',
      dateDeclaration: todayStr,
      datePrevue: todayStr,
      technicien: 'Atelier Interne',
      compteurReleve: vehicule.compteurActuel,
      piecesUtilisees: [],
      coutMainOeuvre: 120.00,
      remarques: `Généré automatiquement depuis l'alerte de maintenance : ${alerte.messageEcheance}`
    });

    marquerAlerteTraitee(alerteId);
    return rep;
  };

  // Réinitialiser les données de démo
  const resetToDefaultData = () => {
    setUsers(INITIAL_USERS);
    setCurrentUser(INITIAL_USERS[0]);
    setVehicules(INITIAL_VEHICULES);
    setPieces(INITIAL_PIECES);
    setMouvements(INITIAL_MOUVEMENTS);
    setReparations(INITIAL_REPARATIONS);
    setAlertes(INITIAL_ALERTES);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}_users`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}_session`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}_vehicules`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}_pieces`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}_mouvements`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}_reparations`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}_alertes`);
  };

  // Exporter en JSON
  const exportDatabaseJSON = (): string => {
    const payload = {
      version: '1.2',
      devise: 'MAD',
      exportedAt: new Date().toISOString(),
      users,
      vehicules,
      pieces,
      mouvements,
      reparations,
      alertes
    };
    return JSON.stringify(payload, null, 2);
  };

  // Importer depuis JSON
  const importDatabaseJSON = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (Array.isArray(data.vehicules) && Array.isArray(data.pieces)) {
        setVehicules(data.vehicules);
        setPieces(data.pieces);
        if (Array.isArray(data.users)) setUsers(data.users);
        if (Array.isArray(data.mouvements)) setMouvements(data.mouvements);
        if (Array.isArray(data.reparations)) setReparations(data.reparations);
        if (Array.isArray(data.alertes)) setAlertes(data.alertes);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Erreur import JSON", err);
      return false;
    }
  };

  // Actions Firebase & Google Drive
  const signInWithGoogle = async (): Promise<boolean> => {
    try {
      const res = await googleSignIn();
      if (res?.user) {
        setFirebaseUser(res.user);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Erreur connexion Google Firebase / Drive:', err);
      return false;
    }
  };

  const signOutFirebase = async () => {
    try {
      await logoutGoogle();
      setFirebaseUser(null);
    } catch (err) {
      console.error('Erreur déconnexion Firebase:', err);
    }
  };

  const saveOTToDrive = async (reparationId: string) => {
    try {
      const rep = reparations.find(r => r.id === reparationId);
      if (!rep) {
        return { success: false, message: 'Ordre de travail introuvable' };
      }
      const vehicule = vehicules.find(v => v.id === rep.vehiculeId);
      const file = await saveWorkOrderToDrive(rep, vehicule);
      return { 
        success: true, 
        file, 
        message: `L'ordre de travail ${rep.numeroOT} a été sauvegardé sur Google Drive avec succès !`,
        link: file.webViewLink 
      };
    } catch (err: any) {
      console.error('Erreur sauvegarde Google Drive OT:', err);
      return { 
        success: false, 
        message: err.message || 'Erreur lors de la sauvegarde sur Google Drive' 
      };
    }
  };

  const saveAllFleetToDrive = async () => {
    try {
      const json = exportDatabaseJSON();
      const file = await saveFleetBackupToDrive(json);
      return {
        success: true,
        file,
        message: 'La sauvegarde complète de la flotte a été archivée sur Google Drive !',
        link: file.webViewLink
      };
    } catch (err: any) {
      console.error('Erreur sauvegarde complète Google Drive:', err);
      return {
        success: false,
        message: err.message || 'Erreur lors de la sauvegarde sur Google Drive'
      };
    }
  };

  const syncAllToFirestore = async (): Promise<boolean> => {
    setIsSyncing(true);
    try {
      for (const v of vehicules) {
        await setDoc(doc(db, 'vehicules', v.id), v);
      }
      for (const p of pieces) {
        await setDoc(doc(db, 'pieces', p.id), p);
      }
      for (const r of reparations) {
        await setDoc(doc(db, 'reparations', r.id), r);
      }
      for (const a of alertes) {
        await setDoc(doc(db, 'alertes', a.id), a);
      }
      for (const u of users) {
        await setDoc(doc(db, 'users', u.id), u);
      }
      for (const m of mouvements) {
        await setDoc(doc(db, 'mouvements', m.id), m);
      }
      setLastSyncTime(new Date().toLocaleTimeString('fr-FR'));
      setIsSyncing(false);
      return true;
    } catch (err) {
      setIsSyncing(false);
      handleFirestoreError(err, OperationType.WRITE, 'syncAllToFirestore');
    }
  };

  const loadAllFromFirestore = async (): Promise<boolean> => {
    setIsSyncing(true);
    try {
      const vehiculesSnap = await getDocs(collection(db, 'vehicules'));
      if (!vehiculesSnap.empty) {
        const loadedVehicules: Vehicule[] = [];
        vehiculesSnap.forEach(d => loadedVehicules.push(d.data() as Vehicule));
        setVehicules(loadedVehicules);
      }

      const piecesSnap = await getDocs(collection(db, 'pieces'));
      if (!piecesSnap.empty) {
        const loadedPieces: PieceRechange[] = [];
        piecesSnap.forEach(d => loadedPieces.push(d.data() as PieceRechange));
        setPieces(loadedPieces);
      }

      const reparationsSnap = await getDocs(collection(db, 'reparations'));
      if (!reparationsSnap.empty) {
        const loadedReparations: Reparation[] = [];
        reparationsSnap.forEach(d => loadedReparations.push(d.data() as Reparation));
        setReparations(loadedReparations);
      }

      const alertesSnap = await getDocs(collection(db, 'alertes'));
      if (!alertesSnap.empty) {
        const loadedAlertes: AlerteMaintenance[] = [];
        alertesSnap.forEach(d => loadedAlertes.push(d.data() as AlerteMaintenance));
        setAlertes(loadedAlertes);
      }

      setLastSyncTime(new Date().toLocaleTimeString('fr-FR'));
      setIsSyncing(false);
      return true;
    } catch (err) {
      setIsSyncing(false);
      handleFirestoreError(err, OperationType.GET, 'loadAllFromFirestore');
    }
  };

  // Calculs statistiques globaux
  const statsGlobales = useMemo(() => {
    const totalVehicules = vehicules.length;
    const vehiculesEnService = vehicules.filter(v => v.statut === 'EN_SERVICE').length;
    const vehiculesEnPanneOuMaint = vehicules.filter(v => v.statut === 'EN_MAINTENANCE' || v.statut === 'EN_PANNE' || v.statut === 'IMMOBILISE').length;
    const tauxDisponibilite = totalVehicules > 0 ? Math.round((vehiculesEnService / totalVehicules) * 100) : 0;

    const totalPiecesRefs = pieces.length;
    const piecesEnAlerte = pieces.filter(p => p.stockActuel <= p.stockMin && p.stockActuel > 0).length;
    const piecesEnRupture = pieces.filter(p => p.stockActuel === 0).length;
    const valeurTotaleStock = Number(pieces.reduce((sum, p) => sum + (p.stockActuel * p.prixUnitaire), 0).toFixed(2));

    const otEnCours = reparations.filter(r => r.statut === 'EN_COURS' || r.statut === 'EN_ATTENTE_PIECES').length;
    const otUrgents = reparations.filter(r => r.priorite === 'URGENTE' && r.statut !== 'TERMINEE' && r.statut !== 'ANNULEE').length;
    
    // Dépenses du mois courant (Octobre 2026)
    const depensesMoisEnCours = Number(reparations
      .filter(r => r.dateDeclaration.startsWith('2026-10') || (r.dateRealisation && r.dateRealisation.startsWith('2026-10')))
      .reduce((sum, r) => sum + r.coutTotal, 0).toFixed(2));

    const activeAlerts = alertes.filter(a => !a.estTraitee);
    const alertesUrgentes = activeAlerts.filter(a => a.severite === 'URGENT').length;
    const alertesAttentions = activeAlerts.filter(a => a.severite === 'ATTENTION').length;

    return {
      totalVehicules,
      vehiculesEnService,
      vehiculesEnPanneOuMaint,
      tauxDisponibilite,
      totalPiecesRefs,
      piecesEnAlerte,
      piecesEnRupture,
      valeurTotaleStock,
      otEnCours,
      otUrgents,
      depensesMoisEnCours,
      alertesUrgentes,
      alertesAttentions
    };
  }, [vehicules, pieces, reparations, alertes]);

  return (
    <FleetContext.Provider value={{
      vehicules,
      pieces,
      mouvements,
      reparations,
      alertes,
      users,
      currentUser,
      login,
      logout,
      switchUser,
      addUser,
      updateUser,
      deleteUser,
      addVehicule,
      updateVehicule,
      deleteVehicule,
      updateCompteur,
      importVehiculesFromExcel,
      addPiece,
      updatePiece,
      deletePiece,
      reapprovisionnerPiece,
      ajusterStockPiece,
      importPiecesFromExcel,
      addReparation,
      updateReparation,
      deleteReparation,
      changerStatutReparation,
      addAlerte,
      deleteAlerte,
      marquerAlerteTraitee,
      convertirAlerteEnOT,
      resetToDefaultData,
      exportDatabaseJSON,
      importDatabaseJSON,
      statsGlobales,
      isFirebaseConnected,
      firebaseUser,
      isSyncing,
      lastSyncTime,
      signInWithGoogle,
      signOutFirebase,
      syncAllToFirestore,
      loadAllFromFirestore,
      saveOTToDrive,
      saveAllFleetToDrive
    }}>
      {children}
    </FleetContext.Provider>
  );
};

export const useFleet = () => {
  const context = useContext(FleetContext);
  if (!context) {
    throw new Error('useFleet must be used within a FleetProvider');
  }
  return context;
};
