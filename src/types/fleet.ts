export type VehiculeType = 'VL' | 'UTILITAIRE' | 'POIDS_LOURD' | 'ENGIN';

export type CompteurType = 'km' | 'heures';

export type VehiculeStatut = 
  | 'EN_SERVICE' 
  | 'EN_MAINTENANCE' 
  | 'EN_PANNE' 
  | 'IMMOBILISE' 
  | 'REFORME';

export type CarburantType = 'DIESEL' | 'ESSENCE' | 'ELECTRIQUE' | 'HYBRIDE';

export interface Vehicule {
  id: string;
  code: string; // Ex: VH-001, ENG-003
  immatriculation: string; // Ou N° Série / N° Parc
  marque: string;
  modele: string;
  type: VehiculeType;
  compteurType: CompteurType;
  compteurActuel: number;
  annee: number;
  statut: VehiculeStatut;
  conducteur: string;
  carburant: CarburantType;
  consommationMoyenne: string;
  dateMiseEnService: string;
  dateProchainControle: string; // Contrôle technique ou VGP
  dateExpirationAssurance: string;
  siteAffectation: string;
  notes?: string;
}

export type CategoriePiece = 
  | 'Filtration' 
  | 'Freinage' 
  | 'Moteur' 
  | 'Hydraulique' 
  | 'Électricité' 
  | 'Pneumatique' 
  | 'Lubrifiants & Fluides' 
  | 'Transmission';

export interface PieceRechange {
  id: string;
  reference: string;
  designation: string;
  categorie: CategoriePiece;
  stockActuel: number;
  stockMin: number;
  prixUnitaire: number; // en €
  emplacement: string;
  fournisseur: string;
  compatibilites: string[]; // Liste de modèles compatibles
  dateDernierAppro: string;
}

export type TypeMouvementStock = 'ENTREE' | 'SORTIE' | 'AJUSTEMENT';

export interface MouvementStock {
  id: string;
  pieceId: string;
  referencePiece: string;
  designationPiece: string;
  type: TypeMouvementStock;
  quantite: number;
  date: string;
  motif: string;
  auteur: string;
  reparationId?: string;
}

export type TypeReparation = 
  | 'PREVENTIVE' 
  | 'CORRECTIVE' 
  | 'DEPANNAGE_URGENT' 
  | 'CONTROLE_REGLEMENTAIRE';

export type PrioriteReparation = 'BASSE' | 'NORMALE' | 'HAUTE' | 'URGENTE';

export type StatutReparation = 
  | 'PLANIFIEE' 
  | 'EN_COURS' 
  | 'EN_ATTENTE_PIECES' 
  | 'TERMINEE' 
  | 'ANNULEE';

export interface PieceUtilisee {
  pieceId: string;
  reference: string;
  designation: string;
  quantite: number;
  prixUnitaire: number;
}

export interface Reparation {
  id: string;
  numeroOT: string; // Ex: OT-2026-0042
  vehiculeId: string;
  type: TypeReparation;
  titre: string;
  description: string;
  priorite: PrioriteReparation;
  statut: StatutReparation;
  dateDeclaration: string;
  datePrevue: string;
  dateRealisation?: string;
  technicien: string;
  compteurReleve: number;
  piecesUtilisees: PieceUtilisee[];
  coutMainOeuvre: number;
  coutPieces: number;
  coutTotal: number;
  remarques?: string;
}

export type TypeDeclencheur = 'COMPTEUR' | 'CALENDRIER';

export type SeveriteAlerte = 'OK' | 'ATTENTION' | 'URGENT';

export interface AlerteMaintenance {
  id: string;
  vehiculeId: string;
  titre: string;
  description: string;
  typeDeclencheur: TypeDeclencheur;
  intervalleCompteur?: number;
  dernierCompteurFait?: number;
  compteurEcheance?: number;
  dateDerniereRealisation?: string;
  dateEcheance?: string;
  severite: SeveriteAlerte;
  messageEcheance: string;
  estTraitee: boolean;
}

export type UserRole = 'ADMIN' | 'CHEF_ATELIER' | 'MAGASINIER' | 'CONDUCTEUR';

export interface FleetUser {
  id: string;
  nom: string;
  login: string;
  motDePasse: string;
  email: string;
  role: UserRole;
  actif: boolean;
  telephone?: string;
  dateCreation: string;
  dernierAcces?: string;
}


