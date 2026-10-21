import React, { useState } from 'react';
import { 
  X, 
  Truck, 
  Wrench, 
  CalendarCheck2, 
  Clock, 
  Fuel, 
  User, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  FileText,
  DollarSign
} from 'lucide-react';
import { Vehicule, Reparation, AlerteMaintenance } from '../../types/fleet';
import { useFleet } from '../../context/FleetContext';
import { formatDH } from '../../utils/formatters';

interface VehicleDetailModalProps {
  vehicule: Vehicule | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (vehicule: Vehicule) => void;
  onCreateOTForVehicle: (vehiculeId: string) => void;
}

export const VehicleDetailModal: React.FC<VehicleDetailModalProps> = ({
  vehicule,
  isOpen,
  onClose,
  onEdit,
  onCreateOTForVehicle
}) => {
  const { reparations, alertes, updateCompteur, convertirAlerteEnOT } = useFleet();
  const [activeTab, setActiveTab] = useState<'fiche' | 'reparations' | 'pieces' | 'alertes'>('fiche');
  const [newMileage, setNewMileage] = useState<string>('');
  const [isUpdatingMileage, setIsUpdatingMileage] = useState(false);

  if (!isOpen || !vehicule) return null;

  // Interventions liées à cet engin
  const vehiculeRepairs = reparations
    .filter(r => r.vehiculeId === vehicule.id)
    .sort((a, b) => new Date(b.dateDeclaration).getTime() - new Date(a.dateDeclaration).getTime());

  // Alertes liées
  const vehiculeAlertes = alertes
    .filter(a => a.vehiculeId === vehicule.id && !a.estTraitee);

  // Total pièces consommées
  const partsConsumed = vehiculeRepairs.flatMap(r => r.piecesUtilisees || []);
  const totalCost = vehiculeRepairs.reduce((sum, r) => sum + r.coutTotal, 0);
  const totalPartsCost = vehiculeRepairs.reduce((sum, r) => sum + r.coutPieces, 0);
  const totalLaborCost = vehiculeRepairs.reduce((sum, r) => sum + r.coutMainOeuvre, 0);

  const handleUpdateCompteurSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(newMileage);
    if (!isNaN(val) && val > 0) {
      updateCompteur(vehicule.id, val);
      setIsUpdatingMileage(false);
      setNewMileage('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 font-bold font-mono">
              {vehicule.code}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  {vehicule.marque} {vehicule.modele}
                </h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-semibold border border-slate-700">
                  {vehicule.immatriculation}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {vehicule.type} · Année {vehicule.annee} · {vehicule.siteAffectation}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onCreateOTForVehicle(vehicule.id)}
              className="px-3 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Créer OT</span>
            </button>
            <button
              onClick={() => onEdit(vehicule)}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              Modifier
            </button>
            <button 
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="px-6 border-b border-slate-800 flex gap-4 bg-slate-900/40">
          <button
            onClick={() => setActiveTab('fiche')}
            className={`py-3 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'fiche' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Fiche & Caractéristiques
          </button>
          <button
            onClick={() => setActiveTab('reparations')}
            className={`py-3 text-xs font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'reparations' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Interventions & Réparations</span>
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
              {vehiculeRepairs.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('pieces')}
            className={`py-3 text-xs font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'pieces' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Pièces Remplacées</span>
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
              {partsConsumed.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('alertes')}
            className={`py-3 text-xs font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'alertes' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Alertes & Échéances</span>
            {vehiculeAlertes.length > 0 && (
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold">
                {vehiculeAlertes.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'fiche' && (
            <div className="space-y-6">
              {/* Odometer quick update box */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-slate-400">Relevé de compteur actuel</div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-white mt-1">
                    {vehicule.compteurActuel.toLocaleString()} <span className="text-sm text-amber-400 font-normal">{vehicule.compteurType}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Consommation moyenne : {vehicule.consommationMoyenne || 'N/C'}
                  </div>
                </div>

                {!isUpdatingMileage ? (
                  <button
                    onClick={() => {
                      setIsUpdatingMileage(true);
                      setNewMileage(String(vehicule.compteurActuel));
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    Mettre à jour le compteur
                  </button>
                ) : (
                  <form onSubmit={handleUpdateCompteurSubmit} className="flex items-center gap-2 self-start sm:self-auto">
                    <input
                      type="number"
                      required
                      min={vehicule.compteurActuel}
                      value={newMileage}
                      onChange={e => setNewMileage(e.target.value)}
                      placeholder={`Nouveau (${vehicule.compteurType})`}
                      className="w-36 bg-slate-900 border border-amber-500 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors cursor-pointer"
                    >
                      Valider
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsUpdatingMileage(false)}
                      className="px-2 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
                    >
                      Annuler
                    </button>
                  </form>
                )}
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-800">
                  <span className="text-slate-400 block mb-1">Statut d'exploitation</span>
                  <span className={`font-semibold ${
                    vehicule.statut === 'EN_SERVICE' ? 'text-emerald-400' :
                    vehicule.statut === 'EN_PANNE' ? 'text-rose-400' : 'text-amber-400'
                  }`}>
                    {vehicule.statut === 'EN_SERVICE' ? 'En Service (Actif)' :
                     vehicule.statut === 'EN_MAINTENANCE' ? 'En Maintenance' :
                     vehicule.statut === 'EN_PANNE' ? 'En Panne' : vehicule.statut}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-800">
                  <span className="text-slate-400 block mb-1">Conducteur / Opérateur</span>
                  <span className="text-slate-200 font-medium">{vehicule.conducteur || 'Non assigné'}</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-800">
                  <span className="text-slate-400 block mb-1">Énergie / Carburant</span>
                  <span className="text-slate-200 font-medium">{vehicule.carburant}</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-800">
                  <span className="text-slate-400 block mb-1">Prochain Contrôle (CT / VGP)</span>
                  <span className="font-mono text-slate-200">{new Date(vehicule.dateProchainControle).toLocaleDateString('fr-FR')}</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-800">
                  <span className="text-slate-400 block mb-1">Validité Assurance</span>
                  <span className="font-mono text-slate-200">{new Date(vehicule.dateExpirationAssurance).toLocaleDateString('fr-FR')}</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-800">
                  <span className="text-slate-400 block mb-1">Mise en service</span>
                  <span className="font-mono text-slate-200">{new Date(vehicule.dateMiseEnService).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>

              {/* Maintenance expense summary */}
              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800">
                <h3 className="text-xs font-semibold text-white mb-3">Synthèse Financière Entretien de l'Équipement</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block">Dépenses Pièces Détachées</span>
                    <span className="text-base font-bold font-mono text-slate-200">
                      {totalPartsCost.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Dépenses Main d'Œuvre</span>
                    <span className="text-base font-bold font-mono text-slate-200">
                      {totalLaborCost.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Coût Global de Maintenance</span>
                    <span className="text-base font-bold font-mono text-amber-400">
                      {formatDH(totalCost)}
                    </span>
                  </div>
                </div>
              </div>

              {vehicule.notes && (
                <div className="p-3 rounded-lg bg-slate-800/20 border border-slate-800/80 text-xs">
                  <span className="text-slate-400 block font-medium mb-1">Remarques & Équipements spécifiques :</span>
                  <p className="text-slate-300">{vehicule.notes}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reparations' && (
            <div className="space-y-4">
              {vehiculeRepairs.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  Aucun ordre de travail enregistré sur ce véhicule.
                </div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {vehiculeRepairs.map(rep => (
                    <div key={rep.id} className="py-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-amber-400 font-semibold">{rep.numeroOT}</span>
                          <span className="text-slate-500">·</span>
                          <span className="text-slate-200 font-semibold">{rep.titre}</span>
                          <span className="text-slate-500">·</span>
                          <span className="font-mono text-[11px] text-slate-400">{rep.dateDeclaration}</span>
                        </div>
                        <p className="text-slate-400 text-[11px]">{rep.description}</p>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span>Technicien : {rep.technicien}</span>
                          <span>·</span>
                          <span>Compteur relevé : {rep.compteurReleve} {vehicule.compteurType}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono font-bold text-slate-200">
                          {formatDH(rep.coutTotal)}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          (Pièces: {formatDH(rep.coutPieces)} · MO: {formatDH(rep.coutMainOeuvre)})
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'pieces' && (
            <div className="space-y-4">
              {partsConsumed.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  Aucune pièce de rechange n'a encore été consommée sur cet engin.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 pb-2">
                        <th className="py-2">Référence</th>
                        <th className="py-2">Désignation</th>
                        <th className="py-2 text-center">Quantité</th>
                        <th className="py-2 text-right">Prix Unitaire</th>
                        <th className="py-2 text-right">Sous-total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {partsConsumed.map((pc, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/30">
                          <td className="py-2 font-mono text-amber-400">{pc.reference}</td>
                          <td className="py-2 text-slate-200">{pc.designation}</td>
                          <td className="py-2 text-center font-mono font-semibold">{pc.quantite}</td>
                          <td className="py-2 text-right font-mono">{formatDH(pc.prixUnitaire)}</td>
                          <td className="py-2 text-right font-mono font-semibold text-slate-200">
                            {formatDH(pc.quantite * pc.prixUnitaire)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'alertes' && (
            <div className="space-y-3">
              {vehiculeAlertes.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500/50 mx-auto mb-2" />
                  Aucune alerte de maintenance en attente pour cet équipement.
                </div>
              ) : (
                vehiculeAlertes.map(alt => (
                  <div 
                    key={alt.id}
                    className="p-3 rounded-lg border border-slate-800 bg-slate-800/40 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          alt.severite === 'URGENT' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {alt.severite}
                        </span>
                        <span className="font-semibold text-white">{alt.titre}</span>
                      </div>
                      <p className="text-slate-400 text-[11px] mt-0.5">{alt.description}</p>
                      <p className="text-amber-400 font-medium text-[11px] mt-1">{alt.messageEcheance}</p>
                    </div>

                    <button
                      onClick={() => {
                        convertirAlerteEnOT(alt.id);
                        onClose();
                      }}
                      className="px-2.5 py-1 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded transition-colors whitespace-nowrap cursor-pointer"
                    >
                      Convertir en OT
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
