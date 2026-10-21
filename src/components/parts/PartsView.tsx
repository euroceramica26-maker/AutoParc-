import React, { useState } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  AlertTriangle, 
  ArrowDownRight, 
  ArrowUpRight, 
  History, 
  Download, 
  Edit2, 
  Trash2,
  Boxes,
  MapPin,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { useFleet } from '../../context/FleetContext';
import { PieceRechange, CategoriePiece } from '../../types/fleet';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';
import { formatDH } from '../../utils/formatters';

interface PartsViewProps {
  onOpenAddModal: () => void;
  onOpenEditModal: (piece: PieceRechange) => void;
  onOpenRestockModal: (piece: PieceRechange) => void;
  onOpenImportExcel: () => void;
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

export const PartsView: React.FC<PartsViewProps> = ({
  onOpenAddModal,
  onOpenEditModal,
  onOpenRestockModal,
  onOpenImportExcel
}) => {
  const { pieces, mouvements, deletePiece, statsGlobales } = useFleet();

  const [activeTab, setActiveTab] = useState<'catalogue' | 'mouvements'>('catalogue');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategorie, setSelectedCategorie] = useState<string>('ALL');
  const [filterStockStatus, setFilterStockStatus] = useState<'ALL' | 'ALERT' | 'RUPTURE'>('ALL');
  const [pieceToDelete, setPieceToDelete] = useState<PieceRechange | null>(null);

  // Filtrage du catalogue
  const filteredPieces = pieces.filter(p => {
    const matchesSearch = 
      p.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.fournisseur.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.emplacement.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.compatibilites.some(c => c.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategorie = selectedCategorie === 'ALL' || p.categorie === selectedCategorie;

    let matchesStock = true;
    if (filterStockStatus === 'ALERT') {
      matchesStock = p.stockActuel <= p.stockMin && p.stockActuel > 0;
    } else if (filterStockStatus === 'RUPTURE') {
      matchesStock = p.stockActuel === 0;
    }

    return matchesSearch && matchesCategorie && matchesStock;
  });

  // Export CSV avec Dirham Marocain
  const handleExportCSV = () => {
    const headers = ['Reference', 'Designation', 'Categorie', 'Stock_Actuel', 'Stock_Min', 'Prix_Unitaire_DH', 'Emplacement', 'Fournisseur'];
    const rows = filteredPieces.map(p => [
      `"${p.reference}"`,
      `"${p.designation}"`,
      `"${p.categorie}"`,
      p.stockActuel,
      p.stockMin,
      p.prixUnitaire.toFixed(2),
      `"${p.emplacement}"`,
      `"${p.fournisseur}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `inventaire_pieces_parc_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Gestion des Pièces de Rechange & Stocks
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Magasin de pièces détachées, gestion des réapprovisionnements et traçabilité des consommations.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenImportExcel}
            className="px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:text-white bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-700/60 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Importer un fichier Excel (.xlsx / .csv)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Importer Excel</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nouvelle pièce</span>
          </button>
        </div>
      </div>

      {/* KPI stock bar (en DH) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Références en catalogue</span>
          <span className="text-xl font-bold font-mono text-white">{statsGlobales.totalPiecesRefs}</span>
        </div>

        <div 
          onClick={() => setFilterStockStatus(filterStockStatus === 'ALERT' ? 'ALL' : 'ALERT')}
          className={`p-3.5 rounded-xl border transition-colors cursor-pointer ${
            filterStockStatus === 'ALERT' 
              ? 'bg-amber-500/10 border-amber-500/40 text-amber-300' 
              : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Stock Faible (Seuil min)</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <span className="text-xl font-bold font-mono text-amber-400">{statsGlobales.piecesEnAlerte}</span>
        </div>

        <div 
          onClick={() => setFilterStockStatus(filterStockStatus === 'RUPTURE' ? 'ALL' : 'RUPTURE')}
          className={`p-3.5 rounded-xl border transition-colors cursor-pointer ${
            filterStockStatus === 'RUPTURE' 
              ? 'bg-rose-500/10 border-rose-500/40 text-rose-300' 
              : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Ruptures de stock</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <span className="text-xl font-bold font-mono text-rose-400">{statsGlobales.piecesEnRupture}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Valorisation Globale du Stock</span>
          <span className="text-xl font-bold font-mono text-emerald-400">
            {formatDH(statsGlobales.valeurTotaleStock)}
          </span>
        </div>
      </div>

      {/* Tabs : Catalogue vs Journal des mouvements */}
      <div className="border-b border-slate-800 flex items-center justify-between">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('catalogue')}
            className={`py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'catalogue' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Catalogue & Inventaire Pièces</span>
          </button>
          <button
            onClick={() => setActiveTab('mouvements')}
            className={`py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'mouvements' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Journal des Entrées / Sorties ({mouvements.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'catalogue' ? (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Rechercher référence SKU, désignation, fournisseur, véhicule compatible..."
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-800/80 rounded-lg overflow-x-auto">
                {CATEGORIES.slice(0, 6).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategorie(cat)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      selectedCategorie === cat
                        ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat === 'ALL' ? 'Toutes catégories' : cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/40 text-slate-400">
                    <th className="py-3 px-4 font-medium">Référence SKU</th>
                    <th className="py-3 px-4 font-medium">Désignation</th>
                    <th className="py-3 px-4 font-medium">Catégorie</th>
                    <th className="py-3 px-4 font-medium text-center">Stock / Min</th>
                    <th className="py-3 px-4 font-medium text-right">Prix Unit. HT</th>
                    <th className="py-3 px-4 font-medium text-right">Valeur Stock</th>
                    <th className="py-3 px-4 font-medium">Emplacement</th>
                    <th className="py-3 px-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredPieces.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        Aucune pièce ne correspond aux critères de filtre.
                      </td>
                    </tr>
                  ) : (
                    filteredPieces.map(piece => {
                      const isRupture = piece.stockActuel === 0;
                      const isAlert = piece.stockActuel <= piece.stockMin && !isRupture;
                      const totalVal = piece.stockActuel * piece.prixUnitaire;

                      return (
                        <tr key={piece.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-amber-400">{piece.reference}</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-white">{piece.designation}</div>
                            <div className="text-[11px] text-slate-400 truncate max-w-xs">
                              {piece.compatibilites?.join(', ') || piece.fournisseur}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-300 font-medium">
                            {piece.categorie}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex items-center gap-1.5 font-mono">
                              <span className={`font-bold text-sm ${
                                isRupture ? 'text-rose-400' : isAlert ? 'text-amber-400' : 'text-emerald-400'
                              }`}>
                                {piece.stockActuel}
                              </span>
                              <span className="text-slate-500 text-[11px]">/ {piece.stockMin} min</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-300">
                            {formatDH(piece.prixUnitaire)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-200">
                            {formatDH(totalVal)}
                          </td>
                          <td className="py-3 px-4 text-slate-400 truncate max-w-[140px]">
                            {piece.emplacement}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => onOpenRestockModal(piece)}
                                className="px-2 py-1 text-[11px] font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded transition-colors cursor-pointer"
                                title="Réapprovisionner"
                              >
                                + Réassort
                              </button>
                              <button
                                onClick={() => onOpenEditModal(piece)}
                                className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
                                title="Modifier"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setPieceToDelete(piece)}
                                className="p-1.5 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                                title="Supprimer la référence"
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
      ) : (
        /* Journal des mouvements */
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="p-4 border-b border-slate-800 bg-slate-800/40 flex items-center justify-between text-xs">
            <span className="font-semibold text-white">Historique d'audit des flux de pièces</span>
            <span className="text-slate-400">{mouvements.length} opérations enregistrées</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Type flux</th>
                  <th className="py-3 px-4">Référence</th>
                  <th className="py-3 px-4">Désignation</th>
                  <th className="py-3 px-4 text-center">Quantité</th>
                  <th className="py-3 px-4">Motif / Contexte</th>
                  <th className="py-3 px-4">Opérateur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {mouvements.map(mvt => {
                  const isEntree = mvt.type === 'ENTREE';

                  return (
                    <tr key={mvt.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-400">{mvt.date}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 font-semibold ${
                          isEntree ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {isEntree ? <ArrowDownRight className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                          {isEntree ? 'ENTRÉE' : 'SORTIE'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-amber-400">{mvt.referencePiece}</td>
                      <td className="py-3 px-4 text-slate-200">{mvt.designationPiece}</td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-sm">
                        <span className={isEntree ? 'text-emerald-400' : 'text-rose-400'}>
                          {isEntree ? `+${mvt.quantite}` : `-${mvt.quantite}`}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{mvt.motif}</td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">{mvt.auteur}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal confirmation suppression pièce */}
      <ConfirmDeleteModal
        isOpen={!!pieceToDelete}
        title="Supprimer la référence pièce"
        message={`Confirmez-vous la suppression définitive de la référence "${pieceToDelete?.reference}" (${pieceToDelete?.designation}) du magasin ?`}
        itemDetails={pieceToDelete ? `Stock actuel : ${pieceToDelete.stockActuel} unités · Prix unit. : ${formatDH(pieceToDelete.prixUnitaire)} · Emplacement : ${pieceToDelete.emplacement}` : undefined}
        onConfirm={() => {
          if (pieceToDelete) {
            deletePiece(pieceToDelete.id);
            setPieceToDelete(null);
          }
        }}
        onCancel={() => setPieceToDelete(null)}
      />
    </div>
  );
};
