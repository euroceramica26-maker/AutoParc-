import { Vehicule, PieceRechange, MouvementStock, Reparation, AlerteMaintenance, FleetUser } from '../types/fleet';

export const INITIAL_USERS: FleetUser[] = [
  {
    id: 'usr-admin-01',
    nom: 'Administrateur Ouaradtech',
    login: 'ouaradtech',
    motDePasse: 'Ouaradtech26@',
    email: 'contact@ouaradtech.ma',
    role: 'ADMIN',
    actif: true,
    telephone: '+212 661-002233',
    dateCreation: '2026-01-01',
    dernierAcces: '2026-10-21 09:45'
  },
  {
    id: 'usr-atelier-02',
    nom: 'Julien Renaud',
    login: 'j.renaud',
    motDePasse: 'Atelier2026!',
    email: 'j.renaud@autoparc.ma',
    role: 'CHEF_ATELIER',
    actif: true,
    telephone: '+212 662-445566',
    dateCreation: '2026-02-15',
    dernierAcces: '2026-10-20 16:30'
  },
  {
    id: 'usr-magasin-03',
    nom: 'David Giraud',
    login: 'd.giraud',
    motDePasse: 'Magasin2026!',
    email: 'd.giraud@autoparc.ma',
    role: 'MAGASINIER',
    actif: true,
    telephone: '+212 663-778899',
    dateCreation: '2026-03-01',
    dernierAcces: '2026-10-19 11:20'
  },
  {
    id: 'usr-cond-04',
    nom: 'Karim Mansouri',
    login: 'k.mansouri',
    motDePasse: 'Chauffeur2026!',
    email: 'k.mansouri@autoparc.ma',
    role: 'CONDUCTEUR',
    actif: true,
    telephone: '+212 664-112233',
    dateCreation: '2026-04-10',
    dernierAcces: '2026-10-18 08:00'
  }
];

export const INITIAL_VEHICULES: Vehicule[] = [
  {
    id: 'vh-001',
    code: 'ENG-01',
    immatriculation: 'CAT-320-GC',
    marque: 'Caterpillar',
    modele: '320 GC Pelle Hydraulique',
    type: 'ENGIN',
    compteurType: 'heures',
    compteurActuel: 3450,
    annee: 2022,
    statut: 'EN_SERVICE',
    conducteur: 'Karim Mansouri (Opérateur CACES R482)',
    carburant: 'DIESEL',
    consommationMoyenne: '14.5 L/h',
    dateMiseEnService: '2022-03-15',
    dateProchainControle: '2026-11-15',
    dateExpirationAssurance: '2027-01-31',
    siteAffectation: 'Chantier Carrière Nord',
    notes: 'Godet 1.2m³, révision 3000h validée chez concessionnaire.'
  },
  {
    id: 'vh-002',
    code: 'PL-02',
    immatriculation: 'EK-894-TM',
    marque: 'Mercedes-Benz',
    modele: 'Actros 2645 Benne 6x4',
    type: 'POIDS_LOURD',
    compteurType: 'km',
    compteurActuel: 198420,
    annee: 2021,
    statut: 'EN_SERVICE',
    conducteur: 'Patrice Dumont (Chauffeur PL)',
    carburant: 'DIESEL',
    consommationMoyenne: '31.2 L/100km',
    dateMiseEnService: '2021-06-10',
    dateProchainControle: '2026-10-25', // Alerte imminente contrôle technique
    dateExpirationAssurance: '2027-03-15',
    siteAffectation: 'Dépôt Logistique Central',
    notes: 'Benne Meiller avec bâchage électrique.'
  },
  {
    id: 'vh-003',
    code: 'ENG-03',
    immatriculation: 'KOM-WA380',
    marque: 'Komatsu',
    modele: 'WA380-8 Chargeuse sur pneus',
    type: 'ENGIN',
    compteurType: 'heures',
    compteurActuel: 4890,
    annee: 2020,
    statut: 'EN_MAINTENANCE',
    conducteur: 'Ahmed Benali',
    carburant: 'DIESEL',
    consommationMoyenne: '16.8 L/h',
    dateMiseEnService: '2020-09-01',
    dateProchainControle: '2026-12-05',
    dateExpirationAssurance: '2026-12-31',
    siteAffectation: 'Plateforme Granulats',
    notes: 'Fuite flexible vérin de godet en cours de réparation à l\'atelier.'
  },
  {
    id: 'vh-004',
    code: 'UT-04',
    immatriculation: 'FZ-342-XP',
    marque: 'Renault',
    modele: 'Master 2.3 dCi 150cv Fourgon L3H2',
    type: 'UTILITAIRE',
    compteurType: 'km',
    compteurActuel: 112350,
    annee: 2022,
    statut: 'EN_SERVICE',
    conducteur: 'Stéphane Morel (Équipe Maintenance)',
    carburant: 'DIESEL',
    consommationMoyenne: '8.9 L/100km',
    dateMiseEnService: '2022-01-20',
    dateProchainControle: '2027-01-20',
    dateExpirationAssurance: '2027-02-28',
    siteAffectation: 'Atelier Mobile & Dépannage',
    notes: 'Aménagement atelier Sortimo complet avec compresseur embarqué.'
  },
  {
    id: 'vh-005',
    code: 'UT-05',
    immatriculation: 'GH-671-BC',
    marque: 'Toyota',
    modele: 'Hilux Double Cabine 2.4 D-4D 4x4',
    type: 'UTILITAIRE',
    compteurType: 'km',
    compteurActuel: 84600,
    annee: 2023,
    statut: 'EN_SERVICE',
    conducteur: 'Marc Lefebvre (Conducteur de travaux)',
    carburant: 'DIESEL',
    consommationMoyenne: '9.4 L/100km',
    dateMiseEnService: '2023-04-12',
    dateProchainControle: '2027-04-12',
    dateExpirationAssurance: '2027-04-12',
    siteAffectation: 'Chantier Carrière Nord',
    notes: 'Équipé pneus tout-terrain BF Goodrich AT.'
  },
  {
    id: 'vh-006',
    code: 'ENG-06',
    immatriculation: 'MAN-MSI30',
    marque: 'Manitou',
    modele: 'MSI 30 Chariot Élévateur Semi-Industriel',
    type: 'ENGIN',
    compteurType: 'heures',
    compteurActuel: 2150,
    annee: 2021,
    statut: 'EN_SERVICE',
    conducteur: 'David Giraud (Magasinier)',
    carburant: 'DIESEL',
    consommationMoyenne: '5.2 L/h',
    dateMiseEnService: '2021-11-05',
    dateProchainControle: '2026-10-18', // VGP semestrielle urgente
    dateExpirationAssurance: '2027-01-15',
    siteAffectation: 'Parc Magasin Central',
    notes: 'Capacité 3 tonnes, mât triplex 4.5m.'
  },
  {
    id: 'vh-007',
    code: 'PL-07',
    immatriculation: 'DJ-551-ZZ',
    marque: 'Volvo',
    modele: 'FH 500 Tracteur Routier 4x2',
    type: 'POIDS_LOURD',
    compteurType: 'km',
    compteurActuel: 342100,
    annee: 2019,
    statut: 'EN_PANNE',
    conducteur: 'Laurent Vasseur',
    carburant: 'DIESEL',
    consommationMoyenne: '28.5 L/100km',
    dateMiseEnService: '2019-05-18',
    dateProchainControle: '2027-05-18',
    dateExpirationAssurance: '2026-10-12', // Assurance expire très bientôt
    siteAffectation: 'Base Logistique',
    notes: 'Problème compresseur d\'air freinage détecté sur autoroute.'
  },
  {
    id: 'vh-008',
    code: 'VL-08',
    immatriculation: 'FL-902-QA',
    marque: 'Peugeot',
    modele: '208 Business 1.5 BlueHDi 100',
    type: 'VL',
    compteurType: 'km',
    compteurActuel: 46800,
    annee: 2023,
    statut: 'EN_SERVICE',
    conducteur: 'Sophie Colin (Directrice Exploitation)',
    carburant: 'DIESEL',
    consommationMoyenne: '4.8 L/100km',
    dateMiseEnService: '2023-02-01',
    dateProchainControle: '2027-02-01',
    dateExpirationAssurance: '2027-02-01',
    siteAffectation: 'Siège Social',
    notes: 'Véhicule de liaison inter-sites.'
  }
];

export const INITIAL_PIECES: PieceRechange[] = [
  {
    id: 'pc-001',
    reference: 'FLT-OIL-CAT20',
    designation: 'Filtre à huile moteur Caterpillar 1R-1808',
    categorie: 'Filtration',
    stockActuel: 3,
    stockMin: 4, // Stock bas !
    prixUnitaire: 38.50,
    emplacement: 'Magasin A - Rayon 1 - Bac 04',
    fournisseur: 'Cat Parts Direct France',
    compatibilites: ['Caterpillar 320 GC', 'Komatsu WA380-8'],
    dateDernierAppro: '2026-08-15'
  },
  {
    id: 'pc-002',
    reference: 'FLT-FUEL-MB01',
    designation: 'Cartouche filtre gazole séparateur d\'eau Actros',
    categorie: 'Filtration',
    stockActuel: 6,
    stockMin: 3,
    prixUnitaire: 54.00,
    emplacement: 'Magasin A - Rayon 1 - Bac 08',
    fournisseur: 'Daimler Truck Parts',
    compatibilites: ['Mercedes-Benz Actros 2645'],
    dateDernierAppro: '2026-09-02'
  },
  {
    id: 'pc-003',
    reference: 'BRK-PAD-ACTROS',
    designation: 'Jeu plaquettes de frein essieu AV/AR Knorr-Bremse',
    categorie: 'Freinage',
    stockActuel: 1,
    stockMin: 2, // Critique !
    prixUnitaire: 142.00,
    emplacement: 'Magasin B - Étagère Freinage 2',
    fournisseur: 'AutoDistribution Poids Lourds',
    compatibilites: ['Mercedes-Benz Actros 2645', 'Volvo FH 500'],
    dateDernierAppro: '2026-07-20'
  },
  {
    id: 'pc-004',
    reference: 'HYD-FLEX-38HP',
    designation: 'Flexible hydraulique haute pression 2 tresses 3/8"',
    categorie: 'Hydraulique',
    stockActuel: 0,
    stockMin: 3, // Rupture de stock !
    prixUnitaire: 78.00,
    emplacement: 'Magasin A - Râtelier Hydraulique',
    fournisseur: 'Hydro-Flex Services',
    compatibilites: ['Komatsu WA380-8', 'Caterpillar 320 GC', 'Manitou MSI 30'],
    dateDernierAppro: '2026-06-10'
  },
  {
    id: 'pc-005',
    reference: 'LUB-15W40-20L',
    designation: 'Huile Moteur TP & Poids Lourd 15W40 (Bidon 20L)',
    categorie: 'Lubrifiants & Fluides',
    stockActuel: 14,
    stockMin: 5,
    prixUnitaire: 86.00,
    emplacement: 'Zone Huiles & Fûts - Palette 3',
    fournisseur: 'TotalEnergies Lubrifiants Pro',
    compatibilites: ['Caterpillar 320 GC', 'Mercedes-Benz Actros 2645', 'Komatsu WA380-8', 'Manitou MSI 30'],
    dateDernierAppro: '2026-09-28'
  },
  {
    id: 'pc-006',
    reference: 'BAT-HD-225AH',
    designation: 'Batterie de démarrage renforcée 12V 225Ah 1150A',
    categorie: 'Électricité',
    stockActuel: 2,
    stockMin: 2,
    prixUnitaire: 215.00,
    emplacement: 'Magasin C - Zone Batteries',
    fournisseur: 'Varta Industrial Batteries',
    compatibilites: ['Mercedes-Benz Actros 2645', 'Volvo FH 500', 'Caterpillar 320 GC'],
    dateDernierAppro: '2026-08-30'
  },
  {
    id: 'pc-007',
    reference: 'FLT-AIR-MAS23',
    designation: 'Filtre à air moteur Renault Master III 2.3 dCi',
    categorie: 'Filtration',
    stockActuel: 8,
    stockMin: 3,
    prixUnitaire: 22.50,
    emplacement: 'Magasin A - Rayon 2 - Bac 12',
    fournisseur: 'Renault Trucks Retail',
    compatibilites: ['Renault Master 2.3 dCi 150cv Fourgon L3H2'],
    dateDernierAppro: '2026-09-12'
  },
  {
    id: 'pc-008',
    reference: 'BRK-DISC-MAS23',
    designation: 'Disques de frein ventilés avant (Paire) Master III',
    categorie: 'Freinage',
    stockActuel: 2,
    stockMin: 2,
    prixUnitaire: 110.00,
    emplacement: 'Magasin B - Étagère Freinage 1',
    fournisseur: 'Brembo Pro Parts',
    compatibilites: ['Renault Master 2.3 dCi 150cv Fourgon L3H2'],
    dateDernierAppro: '2026-08-10'
  },
  {
    id: 'pc-009',
    reference: 'PNE-31580R225',
    designation: 'Pneu Poids Lourd Chantier 315/80 R22.5 Michelin X Works',
    categorie: 'Pneumatique',
    stockActuel: 4,
    stockMin: 4,
    prixUnitaire: 465.00,
    emplacement: 'Hangar Stockage Pneumatiques',
    fournisseur: 'Euromaster Flottes',
    compatibilites: ['Mercedes-Benz Actros 2645', 'Volvo FH 500'],
    dateDernierAppro: '2026-07-05'
  },
  {
    id: 'pc-010',
    reference: 'GRA-EP2-LITH',
    designation: 'Cartouche de graisse extrême pression EP2 Lithium 400g',
    categorie: 'Lubrifiants & Fluides',
    stockActuel: 28,
    stockMin: 12,
    prixUnitaire: 6.80,
    emplacement: 'Magasin A - Rayon Lubrifiants Bac 01',
    fournisseur: 'TotalEnergies Lubrifiants Pro',
    compatibilites: ['Caterpillar 320 GC', 'Komatsu WA380-8', 'Manitou MSI 30'],
    dateDernierAppro: '2026-09-25'
  }
];

export const INITIAL_MOUVEMENTS: MouvementStock[] = [
  {
    id: 'mvt-001',
    pieceId: 'pc-005',
    referencePiece: 'LUB-15W40-20L',
    designationPiece: 'Huile Moteur TP & Poids Lourd 15W40 (Bidon 20L)',
    type: 'ENTREE',
    quantite: 10,
    date: '2026-09-28',
    motif: 'Réapprovisionnement commande fournisseur BC-2026-88',
    auteur: 'David Giraud (Magasinier)'
  },
  {
    id: 'mvt-002',
    pieceId: 'pc-004',
    referencePiece: 'HYD-FLEX-38HP',
    designationPiece: 'Flexible hydraulique haute pression 2 tresses 3/8"',
    type: 'SORTIE',
    quantite: 1,
    date: '2026-10-02',
    motif: 'Intervention urgente OT-2026-0041 sur Komatsu WA380',
    auteur: 'Julien Renaud (Chef Atelier)',
    reparationId: 'rep-002'
  },
  {
    id: 'mvt-003',
    pieceId: 'pc-001',
    referencePiece: 'FLT-OIL-CAT20',
    designationPiece: 'Filtre à huile moteur Caterpillar 1R-1808',
    type: 'SORTIE',
    quantite: 2,
    date: '2026-09-18',
    motif: 'Entretien périodique 3250h OT-2026-0038 sur CAT 320 GC',
    auteur: 'Julien Renaud (Chef Atelier)',
    reparationId: 'rep-001'
  },
  {
    id: 'mvt-004',
    pieceId: 'pc-010',
    referencePiece: 'GRA-EP2-LITH',
    designationPiece: 'Cartouche de graisse extrême pression EP2 Lithium 400g',
    type: 'ENTREE',
    quantite: 24,
    date: '2026-09-25',
    motif: 'Stock régulier mensuel graissage engins',
    auteur: 'David Giraud (Magasinier)'
  }
];

export const INITIAL_REPARATIONS: Reparation[] = [
  {
    id: 'rep-001',
    numeroOT: 'OT-2026-0038',
    vehiculeId: 'vh-001',
    type: 'PREVENTIVE',
    titre: 'Entretien périodique 3250h + Remplacement filtres & graissage',
    description: 'Vidange huile moteur 15W40, remplacement filtre à huile et filtre gazole, inspection des axes de flèche et godet, graissage sous pression.',
    priorite: 'NORMALE',
    statut: 'TERMINEE',
    dateDeclaration: '2026-09-15',
    datePrevue: '2026-09-18',
    dateRealisation: '2026-09-18',
    technicien: 'Atelier Interne - Julien Renaud',
    compteurReleve: 3250,
    piecesUtilisees: [
      {
        pieceId: 'pc-001',
        reference: 'FLT-OIL-CAT20',
        designation: 'Filtre à huile moteur Caterpillar 1R-1808',
        quantite: 1,
        prixUnitaire: 38.50
      },
      {
        pieceId: 'pc-005',
        reference: 'LUB-15W40-20L',
        designation: 'Huile Moteur TP & Poids Lourd 15W40 (Bidon 20L)',
        quantite: 2,
        prixUnitaire: 86.00
      },
      {
        pieceId: 'pc-010',
        reference: 'GRA-EP2-LITH',
        designation: 'Cartouche de graisse extrême pression EP2 Lithium 400g',
        quantite: 4,
        prixUnitaire: 6.80
      }
    ],
    coutMainOeuvre: 280.00,
    coutPieces: 237.70,
    coutTotal: 517.70,
    remarques: 'R.A.S. Aucun jeu détecté sur couronne de rotation.'
  },
  {
    id: 'rep-002',
    numeroOT: 'OT-2026-0041',
    vehiculeId: 'vh-003',
    type: 'CORRECTIVE',
    titre: 'Remplacement flexible hydraulique vérin godet fuyard',
    description: 'Chute de pression et trace d\'huile hydraulique importante sur vérin de cavage. Remplacement du raccord haute pression et appoint huile hydraulique ISO 46.',
    priorite: 'HAUTE',
    statut: 'EN_COURS',
    dateDeclaration: '2026-10-02',
    datePrevue: '2026-10-05',
    technicien: 'Atelier Interne - Julien Renaud & Prestataire Hydro-Flex',
    compteurReleve: 4890,
    piecesUtilisees: [
      {
        pieceId: 'pc-004',
        reference: 'HYD-FLEX-38HP',
        designation: 'Flexible hydraulique haute pression 2 tresses 3/8"',
        quantite: 1,
        prixUnitaire: 78.00
      }
    ],
    coutMainOeuvre: 350.00,
    coutPieces: 78.00,
    coutTotal: 428.00,
    remarques: 'Attente du second raccord coudé 90° commandé en urgence pour finaliser le serrage.'
  },
  {
    id: 'rep-003',
    numeroOT: 'OT-2026-0042',
    vehiculeId: 'vh-007',
    type: 'DEPANNAGE_URGENT',
    titre: 'Dépannage circuit pneumatique de freinage Volvo FH 500',
    description: 'Perte brutale de pression dans circuit secondaire de freinage, voyant rouge stop allumé. Véhicule remorqué au dépôt.',
    priorite: 'URGENTE',
    statut: 'EN_ATTENTE_PIECES',
    dateDeclaration: '2026-10-06',
    datePrevue: '2026-10-08',
    technicien: 'Garage Agréé Volvo Trucks',
    compteurReleve: 342100,
    piecesUtilisees: [],
    coutMainOeuvre: 620.00,
    coutPieces: 0,
    coutTotal: 620.00,
    remarques: 'Devis reçu pour valve APM / dessiccateur d\'air. Validation direction demandée.'
  },
  {
    id: 'rep-004',
    numeroOT: 'OT-2026-0043',
    vehiculeId: 'vh-004',
    type: 'PREVENTIVE',
    titre: 'Grosse révision 110 000 km Renault Master (Filtres + Disques/Plaquettes)',
    description: 'Remplacement plaquettes et disques avant, vidange moteur synthèse 5W30, remplacement filtre à air et habitacle.',
    priorite: 'NORMALE',
    statut: 'PLANIFIEE',
    dateDeclaration: '2026-10-04',
    datePrevue: '2026-10-14',
    technicien: 'Atelier Interne - Sébastien Fabre',
    compteurReleve: 112350,
    piecesUtilisees: [
      {
        pieceId: 'pc-007',
        reference: 'FLT-AIR-MAS23',
        designation: 'Filtre à air moteur Renault Master III 2.3 dCi',
        quantite: 1,
        prixUnitaire: 22.50
      },
      {
        pieceId: 'pc-008',
        reference: 'BRK-DISC-MAS23',
        designation: 'Disques de frein ventilés avant (Paire) Master III',
        quantite: 1,
        prixUnitaire: 110.00
      }
    ],
    coutMainOeuvre: 190.00,
    coutPieces: 132.50,
    coutTotal: 322.50,
    remarques: 'Prévu pendant le jour de repos du conducteur.'
  },
  {
    id: 'rep-005',
    numeroOT: 'OT-2026-0036',
    vehiculeId: 'vh-002',
    type: 'CONTROLE_REGLEMENTAIRE',
    titre: 'Pré-contrôle technique et réglage feux Actros 2645',
    description: 'Vérification banc de freinage, jeu des rotules, réglage hauteur des optiques, test opacité fumées avant présentation au centre Dekra PL.',
    priorite: 'HAUTE',
    statut: 'TERMINEE',
    dateDeclaration: '2026-09-22',
    datePrevue: '2026-09-25',
    dateRealisation: '2026-09-25',
    technicien: 'Atelier Interne - Julien Renaud',
    compteurReleve: 197800,
    piecesUtilisees: [],
    coutMainOeuvre: 140.00,
    coutPieces: 0.00,
    coutTotal: 140.00,
    remarques: 'Rien à signaler. Véhicule conforme pour présentation au CT le 25/10.'
  }
];

export const INITIAL_ALERTES: AlerteMaintenance[] = [
  {
    id: 'alt-001',
    vehiculeId: 'vh-001',
    titre: 'Vidange & Révision moteur 3 500h',
    description: 'Intervalle préconisé constructeur Caterpillar: vidange moteur toutes les 250 heures avec analyse d\'huile.',
    typeDeclencheur: 'COMPTEUR',
    intervalleCompteur: 250,
    dernierCompteurFait: 3250,
    compteurEcheance: 3500,
    severite: 'ATTENTION', // Compteur à 3450h -> Reste 50h !
    messageEcheance: 'Échéance imminente (dans 50 heures)',
    estTraitee: false
  },
  {
    id: 'alt-002',
    vehiculeId: 'vh-002',
    titre: 'Contrôle Technique Poids Lourd Annuel',
    description: 'Visite périodique obligatoire code de la route pour véhicule de transport de marchandises > 3.5t.',
    typeDeclencheur: 'CALENDRIER',
    dateDerniereRealisation: '2025-10-25',
    dateEcheance: '2026-10-25',
    severite: 'ATTENTION', // Dans ~18 jours
    messageEcheance: 'Échéance le 25/10/2026 (dans 18 jours)',
    estTraitee: false
  },
  {
    id: 'alt-003',
    vehiculeId: 'vh-006',
    titre: 'Vérification Générale Périodique (VGP) Semestrielle',
    description: 'Contrôle réglementaire obligatoire des appareils et engins de levage (Arrêté du 1er mars 2004). Mât, chaînes, fourches.',
    typeDeclencheur: 'CALENDRIER',
    dateDerniereRealisation: '2026-04-18',
    dateEcheance: '2026-10-18',
    severite: 'URGENT', // Dans 11 jours
    messageEcheance: 'Urgent : Échéance le 18/10/2026 (dans 11 jours)',
    estTraitee: false
  },
  {
    id: 'alt-004',
    vehiculeId: 'vh-007',
    titre: 'Renouvellement Attestation Assurance Flotte',
    description: 'Contrat flotte groupe à renouveler avant expiration.',
    typeDeclencheur: 'CALENDRIER',
    dateDerniereRealisation: '2025-10-12',
    dateEcheance: '2026-10-12',
    severite: 'URGENT', // Dans 5 jours !
    messageEcheance: 'Critique : Expiration le 12/10/2026 (dans 5 jours)',
    estTraitee: false
  },
  {
    id: 'alt-005',
    vehiculeId: 'vh-002',
    titre: 'Remplacement plaquettes de freins essieu 1 (200 000 km)',
    description: 'Seuil constructeur de contrôle et remplacement préventif des garnitures de freins à disque.',
    typeDeclencheur: 'COMPTEUR',
    intervalleCompteur: 100000,
    dernierCompteurFait: 100000,
    compteurEcheance: 200000,
    severite: 'ATTENTION', // Compteur à 198420 -> Reste 1580 km
    messageEcheance: 'À planifier : Reste 1 580 km',
    estTraitee: false
  },
  {
    id: 'alt-006',
    vehiculeId: 'vh-005',
    titre: 'Permutation des pneumatiques & Graissage pont 4x4 (85 000 km)',
    description: 'Entretien périodique tout-terrain Toyota Hilux.',
    typeDeclencheur: 'COMPTEUR',
    intervalleCompteur: 15000,
    dernierCompteurFait: 70000,
    compteurEcheance: 85000,
    severite: 'ATTENTION', // Compteur à 84600 -> reste 400 km
    messageEcheance: 'Dans 400 km (Atteint bientôt)',
    estTraitee: false
  }
];
