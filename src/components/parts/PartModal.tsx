import React, { useState } from 'react';
import { X, Package, Save } from 'lucide-react';
import { PieceRechange, CategoriePiece } from '../../types/fleet';

interface PartModalProps {
  piece?: PieceRechange | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<PieceRechange, 'id'>) => void;
}

const CATEGORIES: CategoriePiece[] = [
  'Filtration',
  'Freinage',
  'Moteur',
  'Hydraulique',
  'Électricité',
  'Pneumatique',
  'Lubrifiants & Fluides',
  'Transmission'
];

export const PartModal: React.FC<PartModalProps> = ({
  piece,
  isOpen,
  onClose,
  onSave
}) => {
  const [reference, setReference] = useState(piece?.reference || '');
  const [designation, setDesignation] = useState(piece?.designation || '');
  const [categorie, setCategorie] = useState<CategoriePiece>(piece?.categorie || 'Filtration');
  const [stockActuel, setStockActuel] = useState<number>(piece?.stockActuel || 0);
  const [stockMin, setStockMin] = useState<number>(piece?.stockMin || 2);
  const [prixUnitaire, setPrixUnitaire] = useState<number>(piece?.prixUnitaire || 0);
  const [emplacement, setEmplacement] = useState(piece?.emplacement || '');
  const [fournisseur, setFournisseur] = useState(piece?.fournisseur || '');
  const [compatibilitesStr, setCompatibilitesStr] = useState(piece?.compatibilites?.join(', ') || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const compatibilites = compatibilitesStr
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    onSave({
      reference: reference.trim().toUpperCase(),
      designation: designation.trim(),
      categorie,
      stockActuel: Number(stockActuel),
      stockMin: Number(stockMin),
      prixUnitaire: Number(prixUnitaire),
      emplacement: emplacement.trim() || 'Magasin Central',
      fournisseur: fournisseur.trim() || 'Fournisseur Agréé',
      compatibilites,
      dateDernierAppro: piece?.dateDernierAppro || new Date().toISOString().split('T')[0]
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-white">
              {piece ? `Modifier Pièce [${piece.reference}]` : 'Nouvelle Référence Pièce de Rechange'}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Référence SKU / Code Fabricant *</label>
              <input
                type="text"
                required
                value={reference}
                onChange={e => setReference(e.target.value)}
                placeholder="Ex: FLT-OIL-42 ou BRK-PAD-10"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono font-semibold"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Famille / Catégorie *</label>
              <select
                value={categorie}
                onChange={e => setCategorie(e.target.value as CategoriePiece)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Désignation complète *</label>
            <input
              type="text"
              required
              value={designation}
              onChange={e => setDesignation(e.target.value)}
              placeholder="Ex: Filtre à huile moteur 15W40, Plaquettes avant..."
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Stock Actuel (Unité) *</label>
              <input
                type="number"
                min="0"
                required
                value={stockActuel}
                onChange={e => setStockActuel(Number(e.target.value))}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono font-semibold"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Seuil Stock Minimum (Alerte) *</label>
              <input
                type="number"
                min="0"
                required
                value={stockMin}
                onChange={e => setStockMin(Number(e.target.value))}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Prix Unitaire HT (DH) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={prixUnitaire}
                onChange={e => setPrixUnitaire(Number(e.target.value))}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Emplacement Magasin / Rayonnage</label>
              <input
                type="text"
                value={emplacement}
                onChange={e => setEmplacement(e.target.value)}
                placeholder="Ex: Rayon A2 - Bac 04"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Fournisseur principal</label>
              <input
                type="text"
                value={fournisseur}
                onChange={e => setFournisseur(e.target.value)}
                placeholder="Ex: AutoDistribution, Cat Parts..."
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Véhicules / Engins compatibles (séparer par virgule)</label>
            <input
              type="text"
              value={compatibilitesStr}
              onChange={e => setCompatibilitesStr(e.target.value)}
              placeholder="Ex: Caterpillar 320 GC, Renault Master III, Actros..."
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
              <span>Enregistrer la référence</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
