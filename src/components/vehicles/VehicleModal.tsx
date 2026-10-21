import React, { useState } from 'react';
import { X, Truck, Save } from 'lucide-react';
import { Vehicule, VehiculeType, CompteurType, VehiculeStatut, CarburantType } from '../../types/fleet';

interface VehicleModalProps {
  vehicule?: Vehicule | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Vehicule, 'id'>) => void;
}

export const VehicleModal: React.FC<VehicleModalProps> = ({
  vehicule,
  isOpen,
  onClose,
  onSave
}) => {
  const [code, setCode] = useState(vehicule?.code || '');
  const [immatriculation, setImmatriculation] = useState(vehicule?.immatriculation || '');
  const [marque, setMarque] = useState(vehicule?.marque || '');
  const [modele, setModele] = useState(vehicule?.modele || '');
  const [type, setType] = useState<VehiculeType>(vehicule?.type || 'UTILITAIRE');
  const [compteurType, setCompteurType] = useState<CompteurType>(vehicule?.compteurType || 'km');
  const [compteurActuel, setCompteurActuel] = useState<number>(vehicule?.compteurActuel || 0);
  const [annee, setAnnee] = useState<number>(vehicule?.annee || new Date().getFullYear());
  const [statut, setStatut] = useState<VehiculeStatut>(vehicule?.statut || 'EN_SERVICE');
  const [conducteur, setConducteur] = useState(vehicule?.conducteur || '');
  const [carburant, setCarburant] = useState<CarburantType>(vehicule?.carburant || 'DIESEL');
  const [consommationMoyenne, setConsommationMoyenne] = useState(vehicule?.consommationMoyenne || '');
  const [dateMiseEnService, setDateMiseEnService] = useState(vehicule?.dateMiseEnService || new Date().toISOString().split('T')[0]);
  const [dateProchainControle, setDateProchainControle] = useState(vehicule?.dateProchainControle || '');
  const [dateExpirationAssurance, setDateExpirationAssurance] = useState(vehicule?.dateExpirationAssurance || '');
  const [siteAffectation, setSiteAffectation] = useState(vehicule?.siteAffectation || 'Dépôt Central');
  const [notes, setNotes] = useState(vehicule?.notes || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      code: code.trim(),
      immatriculation: immatriculation.trim(),
      marque: marque.trim(),
      modele: modele.trim(),
      type,
      compteurType,
      compteurActuel: Number(compteurActuel),
      annee: Number(annee),
      statut,
      conducteur: conducteur.trim(),
      carburant,
      consommationMoyenne: consommationMoyenne.trim() || (compteurType === 'heures' ? '12 L/h' : '8.5 L/100km'),
      dateMiseEnService,
      dateProchainControle: dateProchainControle || '2027-10-01',
      dateExpirationAssurance: dateExpirationAssurance || '2027-12-31',
      siteAffectation: siteAffectation.trim(),
      notes: notes.trim()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-white">
              {vehicule ? `Modifier Véhicule / Engin [${vehicule.code}]` : 'Ajouter un Véhicule ou Engin au Parc'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Code Parc / Identifiant interne *</label>
              <input
                type="text"
                required
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="Ex: ENG-04 ou PL-12 ou UT-05"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Immatriculation ou N° Châssis *</label>
              <input
                type="text"
                required
                value={immatriculation}
                onChange={e => setImmatriculation(e.target.value)}
                placeholder="Ex: AA-123-BB ou CAT-320-S09"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Marque *</label>
              <input
                type="text"
                required
                value={marque}
                onChange={e => setMarque(e.target.value)}
                placeholder="Ex: Caterpillar, Renault..."
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Modèle & Motorisation *</label>
              <input
                type="text"
                required
                value={modele}
                onChange={e => setModele(e.target.value)}
                placeholder="Ex: 320 GC Pelle, Master 2.3..."
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Année de fabrication</label>
              <input
                type="number"
                min="1990"
                max="2030"
                value={annee}
                onChange={e => setAnnee(Number(e.target.value))}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Catégorie *</label>
              <select
                value={type}
                onChange={e => {
                  const newType = e.target.value as VehiculeType;
                  setType(newType);
                  if (newType === 'ENGIN') {
                    setCompteurType('heures');
                  } else {
                    setCompteurType('km');
                  }
                }}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="ENGIN">Engin de chantier (Pelle, Dumper, Chariot...)</option>
                <option value="POIDS_LOURD">Poids Lourd (Camion benne, Tracteur routier...)</option>
                <option value="UTILITAIRE">Utilitaire (Fourgonnette, Pick-up)</option>
                <option value="VL">Véhicule Léger (Berline de liaison)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Unité de Compteur *</label>
              <select
                value={compteurType}
                onChange={e => setCompteurType(e.target.value as CompteurType)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="km">Kilomètres (km)</option>
                <option value="heures">Heures moteur (h)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Compteur Actuel ({compteurType}) *</label>
              <input
                type="number"
                min="0"
                required
                value={compteurActuel}
                onChange={e => setCompteurActuel(Number(e.target.value))}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Statut Opérationnel *</label>
              <select
                value={statut}
                onChange={e => setStatut(e.target.value as VehiculeStatut)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="EN_SERVICE">En service (Opérationnel)</option>
                <option value="EN_MAINTENANCE">En maintenance</option>
                <option value="EN_PANNE">En panne</option>
                <option value="IMMOBILISE">Immobilisé</option>
                <option value="REFORME">Réformé / Vendu</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Carburant</label>
              <select
                value={carburant}
                onChange={e => setCarburant(e.target.value as CarburantType)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="DIESEL">Diesel / Gazole</option>
                <option value="ESSENCE">Essence SP95/98</option>
                <option value="ELECTRIQUE">Électrique</option>
                <option value="HYBRIDE">Hybride</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Site d'affectation</label>
              <input
                type="text"
                value={siteAffectation}
                onChange={e => setSiteAffectation(e.target.value)}
                placeholder="Ex: Chantier Carrière Nord"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Conducteur / Opérateur assigné</label>
              <input
                type="text"
                value={conducteur}
                onChange={e => setConducteur(e.target.value)}
                placeholder="Ex: Karim Mansouri (CACES R482)"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Consommation moyenne constatée</label>
              <input
                type="text"
                value={consommationMoyenne}
                onChange={e => setConsommationMoyenne(e.target.value)}
                placeholder="Ex: 14.5 L/h ou 8.9 L/100km"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Date prochain Contrôle Tech. / VGP</label>
              <input
                type="date"
                value={dateProchainControle}
                onChange={e => setDateProchainControle(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Date d'expiration Assurance</label>
              <input
                type="date"
                value={dateExpirationAssurance}
                onChange={e => setDateExpirationAssurance(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Notes & Spécifications techniques</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ex: Capacité benne, godet, accessoires spécifiques, dimensions..."
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Footer buttons */}
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
              <span>Enregistrer l'équipement</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
