import React, { useState } from 'react';
import { X, CalendarCheck2, Save, Gauge, Calendar } from 'lucide-react';
import { AlerteMaintenance, TypeDeclencheur } from '../../types/fleet';
import { useFleet } from '../../context/FleetContext';

interface NewAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewAlertModal: React.FC<NewAlertModalProps> = ({
  isOpen,
  onClose
}) => {
  const { vehicules, addAlerte } = useFleet();

  const [vehiculeId, setVehiculeId] = useState(vehicules[0]?.id || '');
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [typeDeclencheur, setTypeDeclencheur] = useState<TypeDeclencheur>('COMPTEUR');

  // Si compteur
  const [intervalleCompteur, setIntervalleCompteur] = useState<number>(15000);
  const [dernierCompteurFait, setDernierCompteurFait] = useState<number>(0);

  // Si calendrier
  const [dateEcheance, setDateEcheance] = useState('');

  if (!isOpen) return null;

  const currentVehicule = vehicules.find(v => v.id === vehiculeId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Omit<AlerteMaintenance, 'id' | 'severite' | 'messageEcheance' | 'estTraitee'> = {
      vehiculeId,
      titre: titre.trim(),
      description: description.trim(),
      typeDeclencheur,
      intervalleCompteur: typeDeclencheur === 'COMPTEUR' ? Number(intervalleCompteur) : undefined,
      dernierCompteurFait: typeDeclencheur === 'COMPTEUR' ? Number(dernierCompteurFait) : undefined,
      compteurEcheance: typeDeclencheur === 'COMPTEUR' ? (Number(dernierCompteurFait) + Number(intervalleCompteur)) : undefined,
      dateEcheance: typeDeclencheur === 'CALENDRIER' ? dateEcheance : undefined
    };

    addAlerte(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <CalendarCheck2 className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-white">
              Programmer une Échéance de Maintenance
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Véhicule ou Engin *</label>
            <select
              required
              value={vehiculeId}
              onChange={e => {
                setVehiculeId(e.target.value);
                const v = vehicules.find(item => item.id === e.target.value);
                if (v) {
                  setDernierCompteurFait(v.compteurActuel);
                  setIntervalleCompteur(v.compteurType === 'heures' ? 250 : 15000);
                }
              }}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              {vehicules.map(v => (
                <option key={v.id} value={v.id}>
                  [{v.code}] {v.marque} {v.modele} ({v.compteurActuel} {v.compteurType})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Intitulé de l'entretien préventif *</label>
            <input
              type="text"
              required
              value={titre}
              onChange={e => setTitre(e.target.value)}
              placeholder="Ex: Vidange moteur + filtre gazole, Contrôle semestriel VGP..."
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Description des opérations à réaliser</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Spécifications huile préconisée, points de graissage, contrôles sécurité..."
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Déclencheur : Compteur vs Calendrier */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-3">
            <span className="text-slate-400 font-medium block">Type de déclencheur de l'alerte *</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTypeDeclencheur('COMPTEUR')}
                className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 font-medium cursor-pointer transition-colors ${
                  typeDeclencheur === 'COMPTEUR'
                    ? 'bg-amber-500 text-slate-950 font-semibold'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Gauge className="w-3.5 h-3.5" />
                <span>Par Compteur ({currentVehicule?.compteurType || 'km'})</span>
              </button>
              <button
                type="button"
                onClick={() => setTypeDeclencheur('CALENDRIER')}
                className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 font-medium cursor-pointer transition-colors ${
                  typeDeclencheur === 'CALENDRIER'
                    ? 'bg-amber-500 text-slate-950 font-semibold'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Par Date Calendaire</span>
              </button>
            </div>

            {typeDeclencheur === 'COMPTEUR' ? (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-slate-400 mb-1">Dernier compteur réalisé ({currentVehicule?.compteurType || 'km'})</label>
                  <input
                    type="number"
                    min="0"
                    value={dernierCompteurFait}
                    onChange={e => setDernierCompteurFait(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Intervalle ({currentVehicule?.compteurType || 'km'})</label>
                  <input
                    type="number"
                    min="1"
                    value={intervalleCompteur}
                    onChange={e => setIntervalleCompteur(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono focus:outline-none"
                  />
                </div>
                <div className="col-span-2 text-[11px] text-slate-500">
                  Échéance calculée à : <strong className="text-amber-400 font-mono">{Number(dernierCompteurFait) + Number(intervalleCompteur)} {currentVehicule?.compteurType}</strong>
                </div>
              </div>
            ) : (
              <div className="pt-2">
                <label className="block text-slate-400 mb-1">Date d'échéance programmée *</label>
                <input
                  type="date"
                  required
                  value={dateEcheance}
                  onChange={e => setDateEcheance(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none"
                />
              </div>
            )}
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
              <span>Activer l'alerte périodique</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
