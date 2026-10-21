import React, { useState } from 'react';
import { X, ArrowDownRight, PackageCheck, AlertCircle } from 'lucide-react';
import { PieceRechange } from '../../types/fleet';
import { useFleet } from '../../context/FleetContext';

interface RestockModalProps {
  piece: PieceRechange | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RestockModal: React.FC<RestockModalProps> = ({
  piece,
  isOpen,
  onClose
}) => {
  const { reapprovisionnerPiece, ajusterStockPiece } = useFleet();
  const [mode, setMode] = useState<'reassort' | 'ajustement'>('reassort');
  const [quantiteReassort, setQuantiteReassort] = useState<number>(5);
  const [motifReassort, setMotifReassort] = useState<string>('Livraison commande réapprovisionnement');
  const [stockReelAjustement, setStockReelAjustement] = useState<number>(piece?.stockActuel || 0);
  const [motifAjustement, setMotifAjustement] = useState<string>('Comptage physique inventaire tournant');

  if (!isOpen || !piece) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'reassort') {
      reapprovisionnerPiece(piece.id, quantiteReassort, motifReassort);
    } else {
      ajusterStockPiece(piece.id, stockReelAjustement, motifAjustement);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="text-base font-bold text-white">
                Mouvement de Stock
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                {piece.reference} · {piece.designation}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current status banner */}
        <div className="p-4 bg-slate-800/40 border-b border-slate-800 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400 block">Stock actuel en magasin</span>
            <span className="text-lg font-bold font-mono tabular-nums text-white">
              {piece.stockActuel} <span className="text-xs text-slate-400 font-normal">unités</span>
            </span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block">Seuil d'alerte min</span>
            <span className="font-mono text-amber-400 font-semibold">{piece.stockMin} unités</span>
          </div>
        </div>

        {/* Mode selector */}
        <div className="p-4 border-b border-slate-800 flex gap-2">
          <button
            type="button"
            onClick={() => setMode('reassort')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              mode === 'reassort'
                ? 'bg-amber-500 text-slate-950 font-semibold'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            + Entrée / Réassort
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('ajustement');
              setStockReelAjustement(piece.stockActuel);
            }}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              mode === 'ajustement'
                ? 'bg-amber-500 text-slate-950 font-semibold'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Ajustement Inventaire
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {mode === 'reassort' ? (
            <>
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Quantité à réceptionner *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantiteReassort}
                  onChange={e => setQuantiteReassort(Number(e.target.value))}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-base font-bold focus:outline-none focus:border-amber-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Nouveau stock après validation : <strong className="text-emerald-400 font-mono">{piece.stockActuel + quantiteReassort} unités</strong>
                </p>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">N° Bon de Livraison ou Motif</label>
                <input
                  type="text"
                  value={motifReassort}
                  onChange={e => setMotifReassort(e.target.value)}
                  placeholder="Ex: BL-2026-943, Commande fournisseur..."
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Quantité physique constatée *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={stockReelAjustement}
                  onChange={e => setStockReelAjustement(Number(e.target.value))}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-base font-bold focus:outline-none focus:border-amber-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Écart constaté : <strong className="font-mono text-amber-400">{stockReelAjustement - piece.stockActuel} unités</strong>
                </p>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Motif de la régularisation *</label>
                <input
                  type="text"
                  required
                  value={motifAjustement}
                  onChange={e => setMotifAjustement(e.target.value)}
                  placeholder="Ex: Recomptage inventaire annuel, casse..."
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </>
          )}

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
              className="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors cursor-pointer shadow-sm"
            >
              Enregistrer le mouvement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
