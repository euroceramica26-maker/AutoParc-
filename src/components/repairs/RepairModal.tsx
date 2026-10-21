import React, { useState } from 'react';
import { X, Wrench, Plus, Trash2, Save, Calculator } from 'lucide-react';
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

export const RepairModal: React.FC<RepairModalProps> = ({
  reparation,
  defaultVehiculeId,
  isOpen,
  onClose,
  onSave
}) => {
  const { vehicules, pieces } = useFleet();

  const [vehiculeId, setVehiculeId] = useState(reparation?.vehiculeId || defaultVehiculeId || (vehicules[0]?.id || ''));
  const [type, setType] = useState<TypeReparation>(reparation?.type || 'CORRECTIVE');
  const [titre, setTitre] = useState(reparation?.titre || '');
  const [description, setDescription] = useState(reparation?.description || '');
  const [priorite, setPriorite] = useState<PrioriteReparation>(reparation?.priorite || 'NORMALE');
  const [statut, setStatut] = useState<StatutReparation>(reparation?.statut || 'PLANIFIEE');
  const [dateDeclaration, setDateDeclaration] = useState(reparation?.dateDeclaration || new Date().toISOString().split('T')[0]);
  const [datePrevue, setDatePrevue] = useState(reparation?.datePrevue || new Date().toISOString().split('T')[0]);
  const [technicien, setTechnicien] = useState(reparation?.technicien || 'Atelier Interne');
  
  const currentVehicule = vehicules.find(v => v.id === vehiculeId);
  const [compteurReleve, setCompteurReleve] = useState<number>(reparation?.compteurReleve || (currentVehicule?.compteurActuel || 0));

  const [piecesUtilisees, setPiecesUtilisees] = useState<PieceUtilisee[]>(reparation?.piecesUtilisees || []);
  const [coutMainOeuvre, setCoutMainOeuvre] = useState<number>(reparation?.coutMainOeuvre || 120);
  const [remarques, setRemarques] = useState(reparation?.remarques || '');

  // Pièce à ajouter au formulaire
  const [selectedPieceId, setSelectedPieceId] = useState<string>(pieces[0]?.id || '');
  const [quantitePiece, setQuantitePiece] = useState<number>(1);

  if (!isOpen) return null;

  const handleAddPiece = () => {
    const piece = pieces.find(p => p.id === selectedPieceId);
    if (!piece || quantitePiece <= 0) return;

    // Vérifier si déjà présente
    const existingIndex = piecesUtilisees.findIndex(p => p.pieceId === piece.id);
    if (existingIndex >= 0) {
      const updated = [...piecesUtilisees];
      updated[existingIndex].quantite += quantitePiece;
      setPiecesUtilisees(updated);
    } else {
      setPiecesUtilisees(prev => [
        ...prev,
        {
          pieceId: piece.id,
          reference: piece.reference,
          designation: piece.designation,
          quantite: quantitePiece,
          prixUnitaire: piece.prixUnitaire
        }
      ]);
    }
    setQuantitePiece(1);
  };

  const handleRemovePiece = (index: number) => {
    setPiecesUtilisees(prev => prev.filter((_, i) => i !== index));
  };

  const coutPiecesCalcule = piecesUtilisees.reduce((sum, item) => sum + (item.prixUnitaire * item.quantite), 0);
  const coutTotalCalcule = coutPiecesCalcule + Number(coutMainOeuvre || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
      compteurReleve: Number(compteurReleve),
      piecesUtilisees,
      coutMainOeuvre: Number(coutMainOeuvre),
      remarques: remarques.trim()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl">
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Véhicule & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Véhicule ou Engin concerné *</label>
              <select
                required
                value={vehiculeId}
                onChange={e => {
                  setVehiculeId(e.target.value);
                  const v = vehicules.find(item => item.id === e.target.value);
                  if (v) setCompteurReleve(v.compteurActuel);
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
                Compteur au moment de l'intervention ({currentVehicule?.compteurType || 'km'})
              </label>
              <input
                type="number"
                min="0"
                value={compteurReleve}
                onChange={e => setCompteurReleve(Number(e.target.value))}
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

          {/* Pièces de rechange consommées */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">Pièces de Rechange Utilisées (Déduction du stock)</span>
              <span className="font-mono text-amber-400 font-semibold">
                Sous-total pièces : {formatDH(coutPiecesCalcule)}
              </span>
            </div>

            {/* Sélecteur d'ajout de pièce */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
              <select
                value={selectedPieceId}
                onChange={e => setSelectedPieceId(e.target.value)}
                className="flex-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {pieces.map(p => (
                  <option key={p.id} value={p.id} disabled={p.stockActuel === 0}>
                    [{p.reference}] {p.designation} - {formatDH(p.prixUnitaire)} (Dispo: {p.stockActuel})
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={quantitePiece}
                  onChange={e => setQuantitePiece(Number(e.target.value))}
                  placeholder="Qté"
                  className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-white font-mono text-center focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddPiece}
                  className="px-3 py-2 text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter</span>
                </button>
              </div>
            </div>

            {/* Liste des pièces ajoutées */}
            {piecesUtilisees.length > 0 && (
              <div className="border border-slate-800 rounded-lg overflow-hidden mt-2">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/80 text-slate-400">
                    <tr>
                      <th className="py-2 px-3">Réf</th>
                      <th className="py-2 px-3">Désignation</th>
                      <th className="py-2 px-3 text-center">Qté</th>
                      <th className="py-2 px-3 text-right">Prix Unit.</th>
                      <th className="py-2 px-3 text-right">Total</th>
                      <th className="py-2 px-3 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {piecesUtilisees.map((p, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-mono text-amber-400">{p.reference}</td>
                        <td className="py-2 px-3 text-slate-200">{p.designation}</td>
                        <td className="py-2 px-3 text-center font-mono font-bold">{p.quantite}</td>
                        <td className="py-2 px-3 text-right font-mono">{formatDH(p.prixUnitaire)}</td>
                        <td className="py-2 px-3 text-right font-mono font-semibold text-slate-200">
                          {formatDH(p.quantite * p.prixUnitaire)}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemovePiece(idx)}
                            className="text-slate-500 hover:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                step="5"
                value={coutMainOeuvre}
                onChange={e => setCoutMainOeuvre(Number(e.target.value))}
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
