import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Wrench, 
  Plus, 
  Trash2, 
  Save, 
  Calculator, 
  AlertCircle, 
  Search, 
  Filter, 
  Package, 
  Check, 
  Minus,
  Sparkles,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { 
  Reparation, 
  TypeReparation, 
  PrioriteReparation, 
  StatutReparation, 
  PieceUtilisee 
} from '../../types/fleet';
import { useFleet } from '../../context/FleetContext';
import { formatDH } from '../../utils/formatters';

interface RepairModalProps {
  reparation?: Reparation | null;
  defaultVehiculeId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Reparation, 'id' | 'numeroOT' | 'coutPieces' | 'coutTotal'>) => void;
}

const CATEGORIES: string[] = [
  'ALL',
  'Filtration',
  'Freinage',
  'Moteur',
  'Hydraulique',
  'Électricité',
  'Pneumatique',
  'Lubrifiants & Fluides',
  'Transmission'
];

export const RepairModal: React.FC<RepairModalProps> = ({
  reparation,
  defaultVehiculeId,
  isOpen,
  onClose,
  onSave
}) => {
  const { vehicules, pieces } = useFleet();

  const [vehiculeId, setVehiculeId] = useState<string>('');
  const [type, setType] = useState<TypeReparation>('CORRECTIVE');
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [priorite, setPriorite] = useState<PrioriteReparation>('NORMALE');
  const [statut, setStatut] = useState<StatutReparation>('PLANIFIEE');
  const [dateDeclaration, setDateDeclaration] = useState('');
  const [datePrevue, setDatePrevue] = useState('');
  const [technicien, setTechnicien] = useState('Atelier Interne');
  const [compteurReleve, setCompteurReleve] = useState<number>(0);
  const [piecesUtilisees, setPiecesUtilisees] = useState<PieceUtilisee[]>([]);
  const [coutMainOeuvre, setCoutMainOeuvre] = useState<number>(120);
  const [remarques, setRemarques] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Recherche & sélection de pièces
  const [pieceSearchTerm, setPieceSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [filterCompatibleOnly, setFilterCompatibleOnly] = useState<boolean>(false);
  const [selectedPieceId, setSelectedPieceId] = useState<string>('');
  const [quantitePiece, setQuantitePiece] = useState<number>(1);
  const [showDropdownResults, setShowDropdownResults] = useState<boolean>(false);

  // Synchronisation des données lorsque le modal s'ouvre ou change
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setPieceSearchTerm('');
      setSelectedCategory('ALL');
      setFilterCompatibleOnly(false);
      setShowDropdownResults(false);
      setQuantitePiece(1);

      if (reparation) {
        setVehiculeId(reparation.vehiculeId);
        setType(reparation.type);
        setTitre(reparation.titre);
        setDescription(reparation.description);
        setPriorite(reparation.priorite);
        setStatut(reparation.statut);
        setDateDeclaration(reparation.dateDeclaration);
        setDatePrevue(reparation.datePrevue);
        setTechnicien(reparation.technicien);
        setCompteurReleve(Number(reparation.compteurReleve || 0));
        setPiecesUtilisees(reparation.piecesUtilisees || []);
        setCoutMainOeuvre(Number(reparation.coutMainOeuvre || 0));
        setRemarques(reparation.remarques || '');
      } else {
        const vId = defaultVehiculeId || (vehicules[0]?.id || '');
        setVehiculeId(vId);
        setType('CORRECTIVE');
        setTitre('');
        setDescription('');
        setPriorite('NORMALE');
        setStatut('PLANIFIEE');
        const todayStr = new Date().toISOString().split('T')[0];
        setDateDeclaration(todayStr);
        setDatePrevue(todayStr);
        setTechnicien('Atelier Interne');
        const currentV = vehicules.find(v => v.id === vId);
        setCompteurReleve(currentV?.compteurActuel || 0);
        setPiecesUtilisees([]);
        setCoutMainOeuvre(120);
        setRemarques('');
      }

      if (pieces.length > 0) {
        setSelectedPieceId(pieces[0].id);
      }
    }
  }, [isOpen, reparation, defaultVehiculeId, vehicules, pieces]);

  const currentVehicule = useMemo(() => {
    return vehicules.find(v => v.id === vehiculeId);
  }, [vehicules, vehiculeId]);

  // Filtrage intelligent des pièces avec recherche multi-critères
  const filteredPieces = useMemo(() => {
    const term = pieceSearchTerm.trim().toLowerCase();

    return pieces.filter(p => {
      // Filtre textuel : référence, désignation, catégorie, fournisseur, emplacement, compatibilités
      const matchesSearch = !term || (
        p.reference.toLowerCase().includes(term) ||
        p.designation.toLowerCase().includes(term) ||
        p.categorie.toLowerCase().includes(term) ||
        (p.fournisseur && p.fournisseur.toLowerCase().includes(term)) ||
        (p.emplacement && p.emplacement.toLowerCase().includes(term)) ||
        (p.compatibilites && p.compatibilites.some(c => c.toLowerCase().includes(term)))
      );

      // Filtre catégorie
      const matchesCategory = selectedCategory === 'ALL' || p.categorie === selectedCategory;

      // Filtre compatibilité véhicule sélectionné
      let matchesCompat = true;
      if (filterCompatibleOnly && currentVehicule) {
        const vModel = currentVehicule.modele.toLowerCase();
        const vBrand = currentVehicule.marque.toLowerCase();
        const vCode = currentVehicule.code.toLowerCase();
        const vImmat = currentVehicule.immatriculation.toLowerCase();

        matchesCompat = p.compatibilites && p.compatibilites.some(comp => {
          const compLower = comp.toLowerCase();
          return vModel.includes(compLower) || 
                 compLower.includes(vModel) ||
                 vBrand.includes(compLower) ||
                 compLower.includes(vBrand) ||
                 compLower.includes(vCode) ||
                 compLower.includes(vImmat);
        });
      }

      return matchesSearch && matchesCategory && matchesCompat;
    });
  }, [pieces, pieceSearchTerm, selectedCategory, filterCompatibleOnly, currentVehicule]);

  // Si la sélection courante n'est plus dans la liste filtrée, pointer sur la 1ère trouvée
  useEffect(() => {
    if (filteredPieces.length > 0 && !filteredPieces.some(p => p.id === selectedPieceId)) {
      setSelectedPieceId(filteredPieces[0].id);
    }
  }, [filteredPieces, selectedPieceId]);

  const activeSelectedPiece = useMemo(() => {
    return pieces.find(p => p.id === selectedPieceId);
  }, [pieces, selectedPieceId]);

  if (!isOpen) return null;

  // Ajout d'une pièce sélectionnée
  const handleAddPiece = (pieceToAdd?: typeof activeSelectedPiece, customQty?: number) => {
    const targetPiece = pieceToAdd || activeSelectedPiece;
    const qty = customQty !== undefined ? customQty : quantitePiece;

    if (!targetPiece || qty <= 0) {
      setErrorMessage("Veuillez sélectionner une pièce valide et indiquer une quantité supérieure à 0.");
      return;
    }

    setErrorMessage(null);

    // Vérifier si la pièce existe déjà dans la liste
    const existingIndex = piecesUtilisees.findIndex(p => p.pieceId === targetPiece.id);
    if (existingIndex >= 0) {
      const updated = [...piecesUtilisees];
      updated[existingIndex].quantite += qty;
      setPiecesUtilisees(updated);
    } else {
      setPiecesUtilisees(prev => [
        ...prev,
        {
          pieceId: targetPiece.id,
          reference: targetPiece.reference,
          designation: targetPiece.designation,
          quantite: qty,
          prixUnitaire: Number(targetPiece.prixUnitaire || 0)
        }
      ]);
    }

    setQuantitePiece(1);
    setShowDropdownResults(false);
  };

  // Modification directe de quantité dans la liste des pièces
  const handleUpdateItemQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemovePiece(index);
      return;
    }
    setPiecesUtilisees(prev => prev.map((item, idx) => {
      if (idx === index) {
        return { ...item, quantite: newQty };
      }
      return item;
    }));
  };

  const handleRemovePiece = (index: number) => {
    setPiecesUtilisees(prev => prev.filter((_, i) => i !== index));
  };

  const coutPiecesCalcule = piecesUtilisees.reduce(
    (sum, item) => sum + (Number(item.prixUnitaire || 0) * Number(item.quantite || 0)), 
    0
  );
  const coutTotalCalcule = coutPiecesCalcule + Number(coutMainOeuvre || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!vehiculeId) {
      setErrorMessage("Veuillez sélectionner un véhicule ou engin pour cet ordre de travail.");
      return;
    }

    if (!titre.trim()) {
      setErrorMessage("Veuillez spécifier l'objet ou le titre de l'intervention.");
      return;
    }

    if (!technicien.trim()) {
      setErrorMessage("Veuillez indiquer le technicien ou l'atelier intervenant.");
      return;
    }

    onSave({
      vehiculeId,
      type,
      titre: titre.trim(),
      description: description.trim(),
      priorite,
      statut,
      dateDeclaration,
      datePrevue,
      dateRealisation: statut === 'TERMINEE' ? (reparation?.dateRealisation || new Date().toISOString().split('T')[0]) : undefined,
      technicien: technicien.trim(),
      compteurReleve: Number(compteurReleve || 0),
      piecesUtilisees,
      coutMainOeuvre: Number(coutMainOeuvre || 0),
      remarques: remarques.trim()
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-white">
              {reparation ? `Modifier Ordre de Travail [${reparation.numeroOT}]` : 'Créer un Ordre de Travail / Réparation'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message d'erreur s'il y a lieu */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button 
              onClick={() => setErrorMessage(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              ✕
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Véhicule & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Véhicule ou Engin concerné *</label>
              <select
                required
                value={vehiculeId}
                onChange={e => {
                  const newId = e.target.value;
                  setVehiculeId(newId);
                  const v = vehicules.find(item => item.id === newId);
                  if (v && !reparation) {
                    setCompteurReleve(v.compteurActuel);
                  }
                }}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {vehicules.map(v => (
                  <option key={v.id} value={v.id}>
                    [{v.code}] {v.marque} {v.modele} ({v.immatriculation}) - {v.compteurActuel} {v.compteurType}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Type d'intervention *</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as TypeReparation)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="PREVENTIVE">Maintenance Préventive (Entretien régulier)</option>
                <option value="CORRECTIVE">Réparation Corrective (Panne / Usure)</option>
                <option value="DEPANNAGE_URGENT">Dépannage Urgent / Arrêt sur site</option>
                <option value="CONTROLE_REGLEMENTAIRE">Contrôle Réglementaire (CT, VGP, Mines)</option>
              </select>
            </div>
          </div>

          {/* Titre */}
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Objet des travaux / Titre de l'intervention *</label>
            <input
              type="text"
              required
              value={titre}
              onChange={e => setTitre(e.target.value)}
              placeholder="Ex: Remplacement disques et plaquettes avant, Vidange 250h..."
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Diagnostic & Description détaillée de la panne / intervention *</label>
            <textarea
              rows={2}
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Symptômes constatés, pièces inspectées, méthode d'intervention..."
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Priorité & Statut & Compteur */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Priorité</label>
              <select
                value={priorite}
                onChange={e => setPriorite(e.target.value as PrioriteReparation)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="BASSE">Basse</option>
                <option value="NORMALE">Normale</option>
                <option value="HAUTE">Haute</option>
                <option value="URGENTE">Urgente (Immobilisation)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Statut</label>
              <select
                value={statut}
                onChange={e => setStatut(e.target.value as StatutReparation)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="PLANIFIEE">Planifiée</option>
                <option value="EN_COURS">En cours d'exécution</option>
                <option value="EN_ATTENTE_PIECES">En attente pièces</option>
                <option value="TERMINEE">Terminée / Clôturée</option>
                <option value="ANNULEE">Annulée</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">
                Compteur relevé ({currentVehicule?.compteurType || 'km'})
              </label>
              <input
                type="number"
                min="0"
                value={compteurReleve}
                onChange={e => setCompteurReleve(Math.max(0, Number(e.target.value) || 0))}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono font-semibold"
              />
            </div>
          </div>

          {/* Technicien & Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Intervenant / Atelier *</label>
              <input
                type="text"
                required
                value={technicien}
                onChange={e => setTechnicien(e.target.value)}
                placeholder="Ex: Atelier Interne - Julien R."
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Date déclaration</label>
              <input
                type="date"
                value={dateDeclaration}
                onChange={e => setDateDeclaration(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Date prévue réalisation</label>
              <input
                type="date"
                value={datePrevue}
                onChange={e => setDatePrevue(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          {/* MODULE RECHERCHE & SÉLECTION DE PIÈCES DE RECHANGE */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-500" />
                <span className="font-semibold text-white">Pièces de Rechange Utilisées</span>
              </div>
              <span className="font-mono text-amber-400 font-semibold text-xs">
                Sous-total pièces : {formatDH(coutPiecesCalcule)}
              </span>
            </div>

            {/* Barre de Recherche Rapide avec filtres */}
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row items-stretch gap-2">
                {/* Champ de recherche avec icône et effacement */}
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={pieceSearchTerm}
                    onChange={e => {
                      setPieceSearchTerm(e.target.value);
                      setShowDropdownResults(true);
                    }}
                    onFocus={() => setShowDropdownResults(true)}
                    placeholder="Rechercher une pièce par référence (ex: FLT, BRK), désignation, marque..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8.5 pr-8 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs"
                  />
                  {pieceSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setPieceSearchTerm('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-white text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Filtre catégorie */}
                <div className="w-full sm:w-44">
                  <select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-white text-xs focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="ALL">Toutes catégories</option>
                    {CATEGORIES.filter(c => c !== 'ALL').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Filtre compatibilité véhicule */}
                {currentVehicule && (
                  <button
                    type="button"
                    onClick={() => setFilterCompatibleOnly(prev => !prev)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                      filterCompatibleOnly
                        ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                    title={`Filtrer les pièces compatibles avec ${currentVehicule.marque} ${currentVehicule.modele}`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span>Compatibles ({currentVehicule.modele.split(' ')[0]})</span>
                  </button>
                )}
              </div>

              {/* Indicateur de nombre de pièces trouvées */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                <span>
                  {filteredPieces.length} référence(s) disponible(s) 
                  {pieceSearchTerm ? ` pour "${pieceSearchTerm}"` : ''} 
                  {selectedCategory !== 'ALL' ? ` · Catégorie: ${selectedCategory}` : ''}
                  {filterCompatibleOnly ? ' · Compatibilité activée' : ''}
                </span>
                {pieceSearchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setPieceSearchTerm('');
                      setSelectedCategory('ALL');
                      setFilterCompatibleOnly(false);
                    }}
                    className="text-amber-400 hover:underline cursor-pointer"
                  >
                    Réinitialiser les filtres
                  </button>
                )}
              </div>

              {/* Résultats de recherche déroulants ou liste rapide */}
              {showDropdownResults && pieceSearchTerm && (
                <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-700 bg-slate-950 p-1 divide-y divide-slate-800/80 shadow-xl">
                  {filteredPieces.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-500">
                      Aucune pièce ne correspond à votre recherche "{pieceSearchTerm}".
                    </div>
                  ) : (
                    filteredPieces.map(piece => {
                      const isZeroStock = piece.stockActuel === 0;

                      return (
                        <div
                          key={piece.id}
                          onClick={() => {
                            setSelectedPieceId(piece.id);
                            setShowDropdownResults(false);
                          }}
                          className={`p-2 rounded flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                            selectedPieceId === piece.id ? 'bg-amber-500/10 border border-amber-500/30' : 'hover:bg-slate-800/60'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="font-mono font-bold text-amber-400 text-xs shrink-0">
                              {piece.reference}
                            </span>
                            <span className="text-white truncate font-medium">{piece.designation}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 shrink-0">
                              {piece.categorie}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {isZeroStock ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-medium">
                                Stock: 0 (Autorisé)
                              </span>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                                Dispo: {piece.stockActuel}
                              </span>
                            )}
                            <span className="font-mono text-white text-xs font-semibold">
                              {formatDH(piece.prixUnitaire)}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddPiece(piece, 1);
                              }}
                              className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded text-[11px] font-semibold cursor-pointer"
                            >
                              + Ajouter
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Sélection directe via menu déroulant filtré */}
              <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                <select
                  value={selectedPieceId}
                  onChange={e => setSelectedPieceId(e.target.value)}
                  className="flex-1 w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 cursor-pointer text-xs"
                >
                  {filteredPieces.length === 0 ? (
                    <option value="" disabled>Aucune pièce ne correspond au filtre</option>
                  ) : (
                    filteredPieces.map(p => (
                      <option key={p.id} value={p.id}>
                        [{p.reference}] {p.designation} - {formatDH(p.prixUnitaire)} {p.stockActuel === 0 ? '(Stock: 0 - Rupture / Commande directe)' : `(Dispo: ${p.stockActuel})`}
                      </option>
                    ))
                  )}
                </select>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {/* Stepper de quantité */}
                  <div className="flex items-center border border-slate-700 rounded-lg bg-slate-900 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setQuantitePiece(prev => Math.max(1, prev - 1))}
                      className="px-2.5 py-2 text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                      title="Diminuer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={quantitePiece}
                      onChange={e => setQuantitePiece(Math.max(1, Number(e.target.value) || 1))}
                      className="w-12 bg-transparent text-white font-mono text-center text-xs focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantitePiece(prev => prev + 1)}
                      className="px-2.5 py-2 text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                      title="Augmenter"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddPiece()}
                    disabled={!activeSelectedPiece}
                    className="px-3 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter à l'OT</span>
                  </button>
                </div>
              </div>

              {/* Aperçu de la pièce sélectionnée avec note si stock = 0 */}
              {activeSelectedPiece && (
                <div className={`p-2.5 rounded-lg border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                  activeSelectedPiece.stockActuel === 0 
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-200' 
                    : 'bg-slate-900/60 border-slate-800 text-slate-300'
                }`}>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-400">{activeSelectedPiece.reference}</span>
                      <span className="font-semibold text-white">{activeSelectedPiece.designation}</span>
                      <span className="text-[10px] text-slate-400">({activeSelectedPiece.categorie})</span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 flex-wrap">
                      <span>Emplacement : <strong className="text-slate-200">{activeSelectedPiece.emplacement}</strong></span>
                      <span>·</span>
                      <span>Prix unit. : <strong className="text-white font-mono">{formatDH(activeSelectedPiece.prixUnitaire)}</strong></span>
                      {activeSelectedPiece.fournisseur && (
                        <>
                          <span>·</span>
                          <span>Fournisseur : {activeSelectedPiece.fournisseur}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    {activeSelectedPiece.stockActuel === 0 ? (
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/20 text-amber-300 text-[11px] font-semibold border border-amber-500/40">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Stock 0 · Autorisé pour cet OT</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-500/15 text-emerald-300 text-[11px] font-mono font-semibold">
                        <span>Stock dispo : {activeSelectedPiece.stockActuel} unités</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Tableau récapitulatif des pièces ajoutées à l'intervention */}
            {piecesUtilisees.length > 0 ? (
              <div className="border border-slate-800 rounded-lg overflow-hidden mt-3">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/80 text-slate-400">
                    <tr>
                      <th className="py-2.5 px-3">Réf SKU</th>
                      <th className="py-2.5 px-3">Désignation</th>
                      <th className="py-2.5 px-3 text-center">Quantité</th>
                      <th className="py-2.5 px-3 text-right">Prix Unit. HT</th>
                      <th className="py-2.5 px-3 text-right">Sous-total HT</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {piecesUtilisees.map((p, idx) => {
                      const pieceInCatalog = pieces.find(item => item.id === p.pieceId);
                      const isOutOfStock = pieceInCatalog ? pieceInCatalog.stockActuel === 0 : false;

                      return (
                        <tr key={idx} className="hover:bg-slate-800/20">
                          <td className="py-2 px-3">
                            <span className="font-mono text-amber-400 font-semibold">{p.reference}</span>
                            {isOutOfStock && (
                              <span className="ml-2 inline-flex items-center text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Stock 0
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-slate-200">
                            {p.designation}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <div className="inline-flex items-center gap-1 font-mono">
                              <button
                                type="button"
                                onClick={() => handleUpdateItemQuantity(idx, p.quantite - 1)}
                                className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer text-xs"
                                title="Réduire"
                              >
                                -
                              </button>
                              <span className="w-8 text-center font-bold text-white text-xs">{p.quantite}</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateItemQuantity(idx, p.quantite + 1)}
                                className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer text-xs"
                                title="Augmenter"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-slate-300">{formatDH(p.prixUnitaire)}</td>
                          <td className="py-2 px-3 text-right font-mono font-semibold text-slate-100">
                            {formatDH(p.quantite * p.prixUnitaire)}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemovePiece(idx)}
                              className="text-slate-500 hover:text-rose-400 cursor-pointer p-1 rounded hover:bg-slate-800 transition-colors"
                              title="Retirer la pièce"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-4 text-center border border-dashed border-slate-800 rounded-lg text-slate-500 text-xs">
                Aucune pièce de rechange n'a encore été rattachée à cet ordre de travail.
              </div>
            )}
          </div>

          {/* Coût main d'œuvre & Total */}
          <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="w-full sm:w-64">
              <label className="block text-slate-400 mb-1 font-medium">Coût estimé Main d'Œuvre (DH HT)</label>
              <input
                type="number"
                min="0"
                step="10"
                value={coutMainOeuvre}
                onChange={e => setCoutMainOeuvre(Math.max(0, Number(e.target.value) || 0))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono font-semibold focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="text-right">
              <span className="text-slate-400 block text-[11px]">COÛT TOTAL ESTIMÉ DE L'INTERVENTION</span>
              <span className="text-2xl font-bold font-mono tabular-nums text-amber-400">
                {formatDH(coutTotalCalcule)}
              </span>
            </div>
          </div>

          {/* Observations / Remarques */}
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Observations de clôture / Remarques</label>
            <input
              type="text"
              value={remarques}
              onChange={e => setRemarques(e.target.value)}
              placeholder="Ex: R.A.S. Essai sur piste concluant..."
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Actions */}
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
              <span>Valider l'Ordre de Travail</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
