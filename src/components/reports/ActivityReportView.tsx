import React, { useState } from 'react';
import { 
  BarChart3, 
  Printer, 
  Download, 
  Calendar, 
  TrendingUp, 
  Truck, 
  Wrench, 
  Layers, 
  DollarSign, 
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { useFleet } from '../../context/FleetContext';
import { formatDH } from '../../utils/formatters';

export const ActivityReportView: React.FC = () => {
  const { vehicules, pieces, reparations, mouvements, statsGlobales } = useFleet();
  const [periode, setPeriode] = useState<'MOIS' | 'TRIMESTRE' | 'ANNEE' | 'TOUT'>('MOIS');

  // Filtrer les interventions selon la période
  const filteredRepairs = reparations.filter(r => {
    if (periode === 'TOUT') return true;
    if (periode === 'MOIS') return r.dateDeclaration.startsWith('2026-10') || (r.dateRealisation && r.dateRealisation.startsWith('2026-10'));
    if (periode === 'TRIMESTRE') return r.dateDeclaration >= '2026-07-01';
    if (periode === 'ANNEE') return r.dateDeclaration.startsWith('2026');
    return true;
  });

  const totalDepenses = filteredRepairs.reduce((sum, r) => sum + r.coutTotal, 0);
  const totalPieces = filteredRepairs.reduce((sum, r) => sum + r.coutPieces, 0);
  const totalMO = filteredRepairs.reduce((sum, r) => sum + r.coutMainOeuvre, 0);
  const otTermines = filteredRepairs.filter(r => r.statut === 'TERMINEE').length;
  const otEnCours = filteredRepairs.filter(r => r.statut === 'EN_COURS' || r.statut === 'EN_ATTENTE_PIECES').length;

  // Calcul du coût par véhicule
  const coutsParVehicule = vehicules.map(v => {
    const vReps = filteredRepairs.filter(r => r.vehiculeId === v.id);
    const nbInterventions = vReps.length;
    const piecesCost = vReps.reduce((sum, r) => sum + r.coutPieces, 0);
    const moCost = vReps.reduce((sum, r) => sum + r.coutMainOeuvre, 0);
    const totalCost = piecesCost + moCost;

    return {
      vehicule: v,
      nbInterventions,
      piecesCost,
      moCost,
      totalCost
    };
  }).sort((a, b) => b.totalCost - a.totalCost);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['Code', 'Immatriculation', 'Marque', 'Modele', 'Type', 'Site', 'Compteur', 'Nb_Interventions', 'Cout_Pieces_DH', 'Cout_MO_DH', 'Cout_Total_DH'];
    const rows = coutsParVehicule.map(item => [
      `"${item.vehicule.code}"`,
      `"${item.vehicule.immatriculation}"`,
      `"${item.vehicule.marque}"`,
      `"${item.vehicule.modele}"`,
      `"${item.vehicule.type}"`,
      `"${item.vehicule.siteAffectation}"`,
      `"${item.vehicule.compteurActuel} ${item.vehicule.compteurType}"`,
      item.nbInterventions,
      item.piecesCost.toFixed(2),
      item.moCost.toFixed(2),
      item.totalCost.toFixed(2)
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rapport_activite_maintenance_${periode}_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPeriodeLabel = () => {
    switch (periode) {
      case 'MOIS': return 'Mois en cours (Octobre 2026)';
      case 'TRIMESTRE': return 'Dernier Trimestre (T3 - T4 2026)';
      case 'ANNEE': return 'Exercice Annuel 2026';
      case 'TOUT': return 'Historique Général Complet';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Rapport d'Activité & Analyse des Coûts du Parc
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Bilan d'exploitation, analyse financière des interventions, consommations de pièces et disponibilité du matériel (en Dirham Marocain).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-800/80 rounded-lg">
            {[
              { id: 'MOIS', label: 'Octobre' },
              { id: 'TRIMESTRE', label: 'Trimestre' },
              { id: 'ANNEE', label: 'Année 2026' },
              { id: 'TOUT', label: 'Tout' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setPeriode(tab.id as any)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  periode === tab.id
                    ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimer Rapport</span>
          </button>
        </div>
      </div>

      {/* Printable Report Wrapper */}
      <div className="printable-report space-y-6">
        {/* En-tête officiel du rapport */}
        <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-base">RAPPORT DE GESTION DE FLOTTE & MAINTENANCE</span>
              <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                {getPeriodeLabel()}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Édité le 21/10/2026 par le Service Matériel · AutoParc PRO Entreprise
            </p>
          </div>

          <div className="text-left sm:text-right text-xs">
            <div className="text-slate-400">Flotte sous gestion : <strong className="text-white font-mono">{vehicules.length} engins & véhicules</strong></div>
            <div className="text-slate-400">Taux de disponibilité actuel : <strong className="text-emerald-400 font-mono">{statsGlobales.tauxDisponibilite}%</strong></div>
          </div>
        </div>

        {/* Synthèse financière globale de la période en DH */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Dépenses Globales Maintenance</span>
            <span className="text-2xl font-bold font-mono text-amber-400">
              {formatDH(totalDepenses)}
            </span>
            <div className="text-[11px] text-slate-500 mt-2">
              {filteredRepairs.length} intervention(s) sur la période
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Coût Fournitures & Pièces</span>
            <span className="text-2xl font-bold font-mono text-slate-200">
              {formatDH(totalPieces)}
            </span>
            <div className="text-[11px] text-slate-500 mt-2">
              Soit {totalDepenses > 0 ? Math.round((totalPieces / totalDepenses) * 100) : 0}% du budget maintenance
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Coût Main d'Œuvre Atelier</span>
            <span className="text-2xl font-bold font-mono text-slate-200">
              {formatDH(totalMO)}
            </span>
            <div className="text-[11px] text-slate-500 mt-2">
              Soit {totalDepenses > 0 ? Math.round((totalMO / totalDepenses) * 100) : 0}% du budget maintenance
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">État d'Avancement des Travaux</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-emerald-400">{otTermines}</span>
              <span className="text-xs text-slate-400">clôturés / <strong className="text-blue-400">{otEnCours}</strong> en cours</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-2">
              Taux de clôture : {filteredRepairs.length > 0 ? Math.round((otTermines / filteredRepairs.length) * 100) : 100}%
            </div>
          </div>
        </div>

        {/* Tableau récapitulatif par véhicule */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="p-4 border-b border-slate-800 bg-slate-800/40 flex items-center justify-between">
            <h2 className="text-xs font-semibold text-white uppercase tracking-wider">
              Ventilation des Dépenses de Maintenance par Équipement & Engin (DH)
            </h2>
            <span className="text-xs text-slate-400">Classé par coût décroissant</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-3 px-4 font-medium">Code / Immat</th>
                  <th className="py-3 px-4 font-medium">Marque & Modèle</th>
                  <th className="py-3 px-4 font-medium">Catégorie</th>
                  <th className="py-3 px-4 font-medium">Compteur Actuel</th>
                  <th className="py-3 px-4 font-medium text-center">Nb OT</th>
                  <th className="py-3 px-4 font-medium text-right">Coût Pièces</th>
                  <th className="py-3 px-4 font-medium text-right">Coût Main d'Œuvre</th>
                  <th className="py-3 px-4 font-medium text-right">Total Maintenance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {coutsParVehicule.map(item => (
                  <tr key={item.vehicule.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-amber-400">{item.vehicule.code}</span>
                      <span className="text-slate-500 text-[11px] block font-mono">{item.vehicule.immatriculation}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{item.vehicule.marque} {item.vehicule.modele}</div>
                      <div className="text-[11px] text-slate-500">{item.vehicule.siteAffectation}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {item.vehicule.type}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-300">
                      {item.vehicule.compteurActuel.toLocaleString()} {item.vehicule.compteurType}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold">
                      <span className={item.nbInterventions > 0 ? 'text-white' : 'text-slate-600'}>
                        {item.nbInterventions}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-300">
                      {formatDH(item.piecesCost)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-300">
                      {formatDH(item.moCost)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-amber-400">
                      {formatDH(item.totalCost)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-700 bg-slate-800/50 font-bold text-white">
                  <td colSpan={4} className="py-3 px-4">TOTAL GÉNÉRAL PÉRIODE</td>
                  <td className="py-3 px-4 text-center font-mono">{filteredRepairs.length}</td>
                  <td className="py-3 px-4 text-right font-mono">{formatDH(totalPieces)}</td>
                  <td className="py-3 px-4 text-right font-mono">{formatDH(totalMO)}</td>
                  <td className="py-3 px-4 text-right font-mono text-amber-400 text-sm">
                    {formatDH(totalDepenses)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Détail des interventions clôturées ou en cours sur la période */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="p-4 border-b border-slate-800 bg-slate-800/40">
            <h2 className="text-xs font-semibold text-white uppercase tracking-wider">
              Journal Détaillé des Ordres de Travaux Traités sur la Période
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">N° OT</th>
                  <th className="py-2.5 px-4">Équipement</th>
                  <th className="py-2.5 px-4">Objet des Travaux</th>
                  <th className="py-2.5 px-4">Intervenant</th>
                  <th className="py-2.5 px-4">Statut</th>
                  <th className="py-2.5 px-4 text-right">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRepairs.map(rep => {
                  const v = vehicules.find(item => item.id === rep.vehiculeId);
                  return (
                    <tr key={rep.id} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-4 font-mono text-slate-400">{rep.dateDeclaration}</td>
                      <td className="py-2.5 px-4 font-mono text-amber-400 font-semibold">{rep.numeroOT}</td>
                      <td className="py-2.5 px-4 text-white font-medium">
                        {v ? `${v.code} (${v.immatriculation})` : 'N/C'}
                      </td>
                      <td className="py-2.5 px-4 text-slate-200">{rep.titre}</td>
                      <td className="py-2.5 px-4 text-slate-400">{rep.technicien}</td>
                      <td className="py-2.5 px-4 font-medium text-slate-300">{rep.statut}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-200">
                        {formatDH(rep.coutTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Visa direction pour document imprimé */}
        <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/60 grid grid-cols-2 gap-8 text-xs text-slate-400">
          <div>
            <p className="font-semibold text-slate-300 mb-12">Le Responsable Matériel & Logistique :</p>
            <div className="border-b border-slate-700 w-56"></div>
          </div>
          <div>
            <p className="font-semibold text-slate-300 mb-12">La Direction d'Exploitation :</p>
            <div className="border-b border-slate-700 w-56"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
