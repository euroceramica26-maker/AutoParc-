import React, { useRef } from 'react';
import { 
  X, 
  Printer, 
  Wrench, 
  Clock, 
  User, 
  Truck, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  DollarSign,
  FileCheck
} from 'lucide-react';
import { Reparation } from '../../types/fleet';
import { useFleet } from '../../context/FleetContext';
import { formatDH } from '../../utils/formatters';

interface RepairDetailModalProps {
  reparation: Reparation | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (reparation: Reparation) => void;
}

export const RepairDetailModal: React.FC<RepairDetailModalProps> = ({
  reparation,
  isOpen,
  onClose,
  onEdit
}) => {
  const { vehicules, changerStatutReparation } = useFleet();
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !reparation) return null;

  const vehicule = vehicules.find(v => v.id === reparation.vehiculeId);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 font-bold font-mono">
              OT
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Ordre de Travail {reparation.numeroOT}
                </h2>
                <span className={`text-[11px] px-2 py-0.5 rounded font-semibold ${
                  reparation.priorite === 'URGENTE' ? 'bg-rose-500/20 text-rose-300' :
                  reparation.priorite === 'HAUTE' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-300'
                }`}>
                  {reparation.priorite}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Créé le {reparation.dateDeclaration} · {reparation.type}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Imprimer le bon d'intervention"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer</span>
            </button>
            <button
              onClick={() => onEdit(reparation)}
              className="px-3 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors cursor-pointer"
            >
              Modifier
            </button>
            <button 
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Transition Bar */}
        <div className="p-4 bg-slate-800/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Statut actuel :</span>
            <span className="font-semibold text-white uppercase">{reparation.statut}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 mr-1 text-[11px]">Changer état :</span>
            {reparation.statut !== 'EN_COURS' && (
              <button
                onClick={() => changerStatutReparation(reparation.id, 'EN_COURS')}
                className="px-2.5 py-1 text-[11px] rounded bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 font-medium cursor-pointer"
              >
                Passer en cours
              </button>
            )}
            {reparation.statut !== 'EN_ATTENTE_PIECES' && (
              <button
                onClick={() => changerStatutReparation(reparation.id, 'EN_ATTENTE_PIECES')}
                className="px-2.5 py-1 text-[11px] rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 font-medium cursor-pointer"
              >
                Attente pièces
              </button>
            )}
            {reparation.statut !== 'TERMINEE' && (
              <button
                onClick={() => changerStatutReparation(reparation.id, 'TERMINEE')}
                className="px-2.5 py-1 text-[11px] rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 font-semibold cursor-pointer"
              >
                Clôturer & Terminer
              </button>
            )}
          </div>
        </div>

        {/* Body content */}
        <div ref={printRef} className="p-6 space-y-6 overflow-y-auto flex-1 text-xs printable-area">
          {/* Véhicule info card */}
          {vehicule && (
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <span className="text-slate-400 block text-[11px]">Équipement / Véhicule</span>
                <span className="font-bold text-white text-sm">{vehicule.code} - {vehicule.marque} {vehicule.modele}</span>
                <span className="text-amber-400 font-mono block mt-0.5">{vehicule.immatriculation}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Compteur relevé</span>
                <span className="font-bold text-white font-mono text-sm">
                  {reparation.compteurReleve.toLocaleString()} {vehicule.compteurType}
                </span>
                <span className="text-slate-400 block mt-0.5">Affectation: {vehicule.siteAffectation}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Intervenant / Atelier</span>
                <span className="font-bold text-white text-sm">{reparation.technicien}</span>
                <span className="text-slate-400 block mt-0.5">Échéance: {reparation.datePrevue}</span>
              </div>
            </div>
          )}

          {/* Diagnostic & Objet */}
          <div className="space-y-2">
            <h3 className="font-bold text-sm text-white">{reparation.titre}</h3>
            <div className="p-3.5 rounded-lg bg-slate-800/30 border border-slate-800 text-slate-300 leading-relaxed">
              {reparation.description}
            </div>
          </div>

          {/* Pièces consommées */}
          <div className="space-y-3">
            <h3 className="font-bold text-white flex items-center justify-between">
              <span>Fournitures & Pièces de Rechange Utilisées</span>
              <span className="font-mono text-amber-400 font-semibold">{formatDH(reparation.coutPieces)}</span>
            </h3>

            {reparation.piecesUtilisees.length === 0 ? (
              <p className="text-slate-500 italic">Aucune pièce du stock consommée sur cette intervention.</p>
            ) : (
              <div className="border border-slate-800 rounded-lg overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-800/60 text-slate-400">
                    <tr>
                      <th className="py-2 px-3">Réf</th>
                      <th className="py-2 px-3">Désignation</th>
                      <th className="py-2 px-3 text-center">Qté</th>
                      <th className="py-2 px-3 text-right">Prix Unit. HT</th>
                      <th className="py-2 px-3 text-right">Sous-total HT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {reparation.piecesUtilisees.map((pc, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-mono text-amber-400">{pc.reference}</td>
                        <td className="py-2 px-3 text-slate-200">{pc.designation}</td>
                        <td className="py-2 px-3 text-center font-mono font-bold">{pc.quantite}</td>
                        <td className="py-2 px-3 text-right font-mono">{formatDH(pc.prixUnitaire)}</td>
                        <td className="py-2 px-3 text-right font-mono font-semibold text-slate-200">
                          {formatDH(pc.quantite * pc.prixUnitaire)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Synthèse Coûts */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 flex justify-between items-center">
            <div className="space-y-1">
              <div className="text-slate-400">Main d'œuvre atelier : <strong className="text-white font-mono">{formatDH(reparation.coutMainOeuvre)}</strong></div>
              <div className="text-slate-400">Fournitures & pièces : <strong className="text-white font-mono">{formatDH(reparation.coutPieces)}</strong></div>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">TOTAL FACTURÉ / VALORISÉ</span>
              <span className="text-2xl font-bold font-mono text-amber-400">
                {formatDH(reparation.coutTotal)}
              </span>
            </div>
          </div>

          {reparation.remarques && (
            <div className="p-3 rounded-lg bg-slate-800/20 border border-slate-800 text-[11px] text-slate-300">
              <strong className="text-slate-400 block mb-0.5">Remarques de clôture :</strong>
              {reparation.remarques}
            </div>
          )}

          {/* Signature zones for printed document */}
          <div className="pt-6 border-t border-slate-800 grid grid-cols-2 gap-8 text-[11px] text-slate-400">
            <div>
              <p className="font-semibold text-slate-300 mb-8">Visa Chef d'Atelier / Mécanicien :</p>
              <div className="border-b border-slate-700 w-48"></div>
            </div>
            <div>
              <p className="font-semibold text-slate-300 mb-8">Visa Responsable Parc Auto :</p>
              <div className="border-b border-slate-700 w-48"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
