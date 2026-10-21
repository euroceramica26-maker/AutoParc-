import React, { useState } from 'react';
import { 
  Truck, 
  Search, 
  Plus, 
  Filter, 
  Gauge, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  Edit2, 
  Trash2,
  Wrench,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useFleet } from '../../context/FleetContext';
import { Vehicule, VehiculeType, VehiculeStatut } from '../../types/fleet';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';

interface VehiclesViewProps {
  onOpenAddModal: () => void;
  onOpenEditModal: (vehicule: Vehicule) => void;
  onOpenDetailModal: (vehicule: Vehicule) => void;
  onCreateOTForVehicle: (vehiculeId: string) => void;
  onOpenImportExcel: () => void;
}

export const VehiclesView: React.FC<VehiclesViewProps> = ({
  onOpenAddModal,
  onOpenEditModal,
  onOpenDetailModal,
  onCreateOTForVehicle,
  onOpenImportExcel
}) => {
  const { vehicules, deleteVehicule, updateCompteur } = useFleet();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatut, setSelectedStatut] = useState<string>('ALL');
  const [vehiculeToDelete, setVehiculeToDelete] = useState<Vehicule | null>(null);
  const [editingCompteurId, setEditingCompteurId] = useState<string | null>(null);
  const [compteurInputValue, setCompteurInputValue] = useState<string>('');

  // Filtering
  const filteredVehicules = vehicules.filter(v => {
    const matchesSearch = 
      v.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.immatriculation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.marque.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.modele.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.conducteur.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.siteAffectation.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = selectedType === 'ALL' || v.type === selectedType;
    const matchesStatut = selectedStatut === 'ALL' || v.statut === selectedStatut;

    return matchesSearch && matchesType && matchesStatut;
  });

  const handleSaveQuickCompteur = (id: string) => {
    const val = Number(compteurInputValue);
    if (!isNaN(val) && val > 0) {
      updateCompteur(id, val);
      setEditingCompteurId(null);
      setCompteurInputValue('');
    }
  };

  const getStatusBadge = (statut: VehiculeStatut) => {
    switch (statut) {
      case 'EN_SERVICE':
        return <span className="text-emerald-400 font-medium">En service</span>;
      case 'EN_MAINTENANCE':
        return <span className="text-amber-400 font-medium">En maintenance</span>;
      case 'EN_PANNE':
        return <span className="text-rose-400 font-medium">En panne</span>;
      case 'IMMOBILISE':
        return <span className="text-purple-400 font-medium">Immobilisé</span>;
      case 'REFORME':
        return <span className="text-slate-500 font-medium">Réformé</span>;
    }
  };

  const getStatutLabel = (st: VehiculeStatut) => {
    switch (st) {
      case 'EN_SERVICE': return 'En service';
      case 'EN_MAINTENANCE': return 'En maintenance';
      case 'EN_PANNE': return 'En panne';
      case 'IMMOBILISE': return 'Immobilisé';
      case 'REFORME': return 'Réformé';
    }
  };

  const getTypeLabel = (t: VehiculeType) => {
    switch (t) {
      case 'ENGIN': return 'Engin de chantier TP';
      case 'POIDS_LOURD': return 'Poids Lourd';
      case 'UTILITAIRE': return 'Utilitaire';
      case 'VL': return 'Véhicule Léger';
    }
  };

  const handleExportExcel = () => {
    const listToExport = filteredVehicules.length > 0 ? filteredVehicules : vehicules;
    const excelRows = listToExport.map(v => ({
      'Code Parc': v.code,
      'Immatriculation / N° Série': v.immatriculation,
      'Marque': v.marque,
      'Modèle': v.modele,
      'Type Équipement': getTypeLabel(v.type),
      'Catégorie': v.type,
      'Unité Compteur': v.compteurType,
      'Compteur Actuel': v.compteurActuel,
      'Année': v.annee,
      'Statut Opérationnel': getStatutLabel(v.statut),
      'Conducteur / Opérateur': v.conducteur,
      'Carburant': v.carburant,
      'Consommation Moyenne': v.consommationMoyenne,
      'Site d\'affectation': v.siteAffectation,
      'Date Mise en Service': v.dateMiseEnService,
      'Prochain Contrôle / VGP': v.dateProchainControle,
      'Échéance Assurance': v.dateExpirationAssurance,
      'Observations': v.notes || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    worksheet['!cols'] = [
      { wch: 14 },
      { wch: 24 },
      { wch: 18 },
      { wch: 30 },
      { wch: 24 },
      { wch: 16 },
      { wch: 14 },
      { wch: 16 },
      { wch: 10 },
      { wch: 20 },
      { wch: 26 },
      { wch: 14 },
      { wch: 22 },
      { wch: 28 },
      { wch: 20 },
      { wch: 22 },
      { wch: 20 },
      { wch: 35 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Parc_Vehicules_Engins');
    XLSX.writeFile(workbook, `parc_vehicules_engins_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportCSV = () => {
    const listToExport = filteredVehicules.length > 0 ? filteredVehicules : vehicules;
    const headers = [
      'Code_Parc',
      'Immatriculation_Serie',
      'Marque',
      'Modele',
      'Type',
      'Compteur_Actuel',
      'Unite_Compteur',
      'Annee',
      'Statut',
      'Conducteur',
      'Carburant',
      'Consommation',
      'Site_Affectation',
      'Date_Mise_Service',
      'Prochain_Controle_VGP',
      'Echeance_Assurance',
      'Notes'
    ];

    const rows = listToExport.map(v => [
      `"${v.code.replace(/"/g, '""')}"`,
      `"${v.immatriculation.replace(/"/g, '""')}"`,
      `"${v.marque.replace(/"/g, '""')}"`,
      `"${v.modele.replace(/"/g, '""')}"`,
      `"${v.type}"`,
      v.compteurActuel,
      `"${v.compteurType}"`,
      v.annee,
      `"${v.statut}"`,
      `"${v.conducteur.replace(/"/g, '""')}"`,
      `"${v.carburant}"`,
      `"${v.consommationMoyenne.replace(/"/g, '""')}"`,
      `"${v.siteAffectation.replace(/"/g, '""')}"`,
      `"${v.dateMiseEnService}"`,
      `"${v.dateProchainControle}"`,
      `"${v.dateExpirationAssurance}"`,
      `"${(v.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `parc_vehicules_engins_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Gestion du Parc Véhicules & Engins
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Inventaire de la flotte ({vehicules.length} unités répertoriées), suivi des compteurs et état opérationnel.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenImportExcel}
            className="px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:text-white bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-700/60 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Importer la liste d'engins et véhicules depuis un fichier Excel (.xlsx / .csv)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Importer Excel</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Exporter l'inventaire en fichier Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Exporter l'inventaire au format CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ajouter un équipement</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Rechercher par immatriculation, code parc, marque, conducteur, site..."
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Type filter tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-800/80 rounded-lg overflow-x-auto">
            {[
              { id: 'ALL', label: 'Tous' },
              { id: 'ENGIN', label: 'Engins' },
              { id: 'POIDS_LOURD', label: 'Poids Lourds' },
              { id: 'UTILITAIRE', label: 'Utilitaires' },
              { id: 'VL', label: 'Véhicules légers' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedType(tab.id)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  selectedType === tab.id
                    ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Statut filter */}
          <div className="w-full md:w-44">
            <select
              value={selectedStatut}
              onChange={e => setSelectedStatut(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="ALL">Tous statuts</option>
              <option value="EN_SERVICE">En service</option>
              <option value="EN_MAINTENANCE">En maintenance</option>
              <option value="EN_PANNE">En panne</option>
              <option value="IMMOBILISE">Immobilisé</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table View */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/40 text-slate-400">
                <th className="py-3 px-4 font-medium">Code & Immat</th>
                <th className="py-3 px-4 font-medium">Marque & Modèle</th>
                <th className="py-3 px-4 font-medium">Type</th>
                <th className="py-3 px-4 font-medium">Compteur Actuel</th>
                <th className="py-3 px-4 font-medium">Statut</th>
                <th className="py-3 px-4 font-medium">Conducteur / Site</th>
                <th className="py-3 px-4 font-medium">Prochain CT/VGP</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredVehicules.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Aucun véhicule ou engin ne correspond aux critères de recherche.
                  </td>
                </tr>
              ) : (
                filteredVehicules.map(vehicule => {
                  const isEditingCompteur = editingCompteurId === vehicule.id;

                  return (
                    <tr key={vehicule.id} className="hover:bg-slate-800/30 transition-colors">
                      {/* Code & Immatriculation */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onOpenDetailModal(vehicule)}
                            className="font-mono font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer text-left"
                          >
                            {vehicule.code}
                          </button>
                          <span className="font-mono text-[11px] text-slate-400 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700/80">
                            {vehicule.immatriculation}
                          </span>
                        </div>
                      </td>

                      {/* Marque & Modèle */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => onOpenDetailModal(vehicule)}
                          className="text-left group cursor-pointer block"
                        >
                          <div className="font-semibold text-white group-hover:text-amber-400 transition-colors">
                            {vehicule.marque} {vehicule.modele}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Année {vehicule.annee} · {vehicule.carburant}
                          </div>
                        </button>
                      </td>

                      {/* Type */}
                      <td className="py-3 px-4">
                        <span className="text-slate-300 font-medium">
                          {vehicule.type === 'ENGIN' ? 'Engin TP' :
                           vehicule.type === 'POIDS_LOURD' ? 'Poids Lourd' :
                           vehicule.type === 'UTILITAIRE' ? 'Utilitaire' : 'VL'}
                        </span>
                      </td>

                      {/* Compteur avec mise à jour rapide */}
                      <td className="py-3 px-4">
                        {isEditingCompteur ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min={vehicule.compteurActuel}
                              value={compteurInputValue}
                              onChange={e => setCompteurInputValue(e.target.value)}
                              className="w-24 bg-slate-950 border border-amber-500 rounded px-1.5 py-1 text-xs text-white font-mono focus:outline-none"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveQuickCompteur(vehicule.id)}
                              className="px-1.5 py-1 text-[11px] bg-amber-500 text-slate-950 rounded font-semibold hover:bg-amber-400 cursor-pointer"
                            >
                              OK
                            </button>
                            <button
                              onClick={() => setEditingCompteurId(null)}
                              className="px-1 py-1 text-[11px] text-slate-400 hover:text-white cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-mono tabular-nums font-semibold text-white">
                              {vehicule.compteurActuel.toLocaleString()} {vehicule.compteurType}
                            </span>
                            <button
                              onClick={() => {
                                setEditingCompteurId(vehicule.id);
                                setCompteurInputValue(String(vehicule.compteurActuel));
                              }}
                              className="text-slate-500 hover:text-amber-400 transition-colors cursor-pointer"
                              title="Relever nouveau kilométrage/heures"
                            >
                              <Gauge className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Statut */}
                      <td className="py-3 px-4">
                        {getStatusBadge(vehicule.statut)}
                      </td>

                      {/* Conducteur / Site */}
                      <td className="py-3 px-4">
                        <div className="text-slate-300 truncate max-w-[150px]">{vehicule.conducteur || 'Non assigné'}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[150px]">{vehicule.siteAffectation}</div>
                      </td>

                      {/* Prochain CT */}
                      <td className="py-3 px-4">
                        <span className="font-mono tabular-nums text-slate-300">
                          {new Date(vehicule.dateProchainControle).toLocaleDateString('fr-FR')}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onCreateOTForVehicle(vehicule.id)}
                            className="p-1.5 text-slate-400 hover:text-amber-400 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Créer un Ordre de Travail"
                          >
                            <Wrench className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onOpenDetailModal(vehicule)}
                            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Fiche détaillée"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onOpenEditModal(vehicule)}
                            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Modifier"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setVehiculeToDelete(vehicule)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Supprimer"
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

      {/* Modal confirmation suppression véhicule */}
      <ConfirmDeleteModal
        isOpen={!!vehiculeToDelete}
        title="Supprimer l'équipement"
        message={`Confirmez-vous la suppression définitive du matériel [${vehiculeToDelete?.code}] ${vehiculeToDelete?.marque} ${vehiculeToDelete?.modele} (${vehiculeToDelete?.immatriculation}) du parc ?`}
        itemDetails={vehiculeToDelete ? `Compteur : ${vehiculeToDelete.compteurActuel} ${vehiculeToDelete.compteurType} · Affectation : ${vehiculeToDelete.siteAffectation}` : undefined}
        onConfirm={() => {
          if (vehiculeToDelete) {
            deleteVehicule(vehiculeToDelete.id);
            setVehiculeToDelete(null);
          }
        }}
        onCancel={() => setVehiculeToDelete(null)}
      />
    </div>
  );
};
