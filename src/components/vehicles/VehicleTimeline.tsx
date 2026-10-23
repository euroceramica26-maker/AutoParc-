import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  Wrench, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  User, 
  Gauge, 
  Package, 
  DollarSign, 
  Filter, 
  Search, 
  ArrowUpDown, 
  Plus, 
  Download, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  Activity,
  History,
  FileSpreadsheet
} from 'lucide-react';
import { Vehicule, Reparation, TypeReparation, StatutReparation, PrioriteReparation } from '../../types/fleet';
import { formatDH } from '../../utils/formatters';
import { exportToExcel, exportToCSV } from '../../utils/exportUtils';

interface VehicleTimelineProps {
  vehicule: Vehicule;
  reparations: Reparation[];
  onCreateOT?: () => void;
  onSelectReparation?: (reparation: Reparation) => void;
}

export const VehicleTimeline: React.FC<VehicleTimelineProps> = ({
  vehicule,
  reparations,
  onCreateOT,
  onSelectReparation
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statutFilter, setStatutFilter] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [expandedRepairs, setExpandedRepairs] = useState<Record<string, boolean>>({});

  // Filtrer les réparations pour ce véhicule
  const vehicleRepairs = useMemo(() => {
    return reparations.filter(r => r.vehiculeId === vehicule.id);
  }, [reparations, vehicule.id]);

  // Filtrer et trier
  const filteredTimeline = useMemo(() => {
    return vehicleRepairs
      .filter(rep => {
        const matchesSearch = 
          rep.numeroOT.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rep.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rep.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rep.technicien.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (rep.remarques && rep.remarques.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (rep.piecesUtilisees && rep.piecesUtilisees.some(p => 
            p.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.reference.toLowerCase().includes(searchTerm.toLowerCase())
          ));

        const matchesType = typeFilter === 'ALL' || rep.type === typeFilter;
        const matchesStatut = statutFilter === 'ALL' || rep.statut === statutFilter;

        return matchesSearch && matchesType && matchesStatut;
      })
      .sort((a, b) => {
        const dateA = new Date(a.dateDeclaration).getTime();
        const dateB = new Date(b.dateDeclaration).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });
  }, [vehicleRepairs, searchTerm, typeFilter, statutFilter, sortOrder]);

  // Statistiques de l'historique
  const stats = useMemo(() => {
    const totalInterventions = vehicleRepairs.length;
    const terminees = vehicleRepairs.filter(r => r.statut === 'TERMINEE').length;
    const enCours = vehicleRepairs.filter(r => r.statut === 'EN_COURS' || r.statut === 'EN_ATTENTE_PIECES').length;
    const totalDepenses = vehicleRepairs.reduce((sum, r) => sum + r.coutTotal, 0);
    const totalPiecesCost = vehicleRepairs.reduce((sum, r) => sum + r.coutPieces, 0);
    const totalMOCost = vehicleRepairs.reduce((sum, r) => sum + r.coutMainOeuvre, 0);
    const totalPiecesCount = vehicleRepairs.reduce(
      (sum, r) => sum + (r.piecesUtilisees?.reduce((pSum, p) => pSum + p.quantite, 0) || 0), 
      0
    );

    // Dernière intervention réalisée
    const sortedByDate = [...vehicleRepairs].sort(
      (a, b) => new Date(b.dateDeclaration).getTime() - new Date(a.dateDeclaration).getTime()
    );
    const derniereIntervention = sortedByDate[0];

    return {
      totalInterventions,
      terminees,
      enCours,
      totalDepenses,
      totalPiecesCost,
      totalMOCost,
      totalPiecesCount,
      derniereIntervention
    };
  }, [vehicleRepairs]);

  const toggleExpand = (id: string) => {
    setExpandedRepairs(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getTypeStyle = (type: TypeReparation) => {
    switch (type) {
      case 'PREVENTIVE':
        return {
          label: 'Maintenance Préventive',
          badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
          dotBg: 'bg-blue-500',
          ringColor: 'ring-blue-500/30',
          icon: ShieldCheck
        };
      case 'CORRECTIVE':
        return {
          label: 'Maintenance Corrective',
          badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          dotBg: 'bg-amber-500',
          ringColor: 'ring-amber-500/30',
          icon: Wrench
        };
      case 'DEPANNAGE_URGENT':
        return {
          label: 'Dépannage Urgent',
          badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          dotBg: 'bg-rose-500',
          ringColor: 'ring-rose-500/30',
          icon: AlertTriangle
        };
      case 'CONTROLE_REGLEMENTAIRE':
        return {
          label: 'Contrôle Réglementaire / VGP',
          badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
          dotBg: 'bg-purple-500',
          ringColor: 'ring-purple-500/30',
          icon: CheckCircle2
        };
    }
  };

  const getStatutBadge = (statut: StatutReparation) => {
    switch (statut) {
      case 'TERMINEE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Terminée
          </span>
        );
      case 'EN_COURS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            En cours d'intervention
          </span>
        );
      case 'EN_ATTENTE_PIECES':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            En attente de pièces
          </span>
        );
      case 'PLANIFIEE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-700 text-slate-300 border border-slate-600">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Planifiée
          </span>
        );
      case 'ANNULEE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            Annulée
          </span>
        );
    }
  };

  const getPriorityBadge = (priorite: PrioriteReparation) => {
    if (priorite === 'URGENTE') {
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500 text-white uppercase tracking-wider">
          Urgent
        </span>
      );
    }
    if (priorite === 'HAUTE') {
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          Priorité Haute
        </span>
      );
    }
    return null;
  };

  // Exporter l'historique du véhicule
  const handleExportCarnetExcel = () => {
    const rows = vehicleRepairs.map(rep => ({
      'Code Matériel': vehicule.code,
      'Immatriculation': vehicule.immatriculation,
      'Marque': vehicule.marque,
      'Modèle': vehicule.modele,
      'N° OT': rep.numeroOT,
      'Type Intervention': getTypeStyle(rep.type).label,
      'Statut': rep.statut,
      'Priorité': rep.priorite,
      'Titre': rep.titre,
      'Description': rep.description,
      'Technicien': rep.technicien,
      'Date Déclaration': rep.dateDeclaration,
      'Date Réalisation': rep.dateRealisation || '',
      'Compteur Relevé': `${rep.compteurReleve} ${vehicule.compteurType}`,
      'Coût Pièces (DH)': rep.coutPieces,
      'Coût Main d\'œuvre (DH)': rep.coutMainOeuvre,
      'Coût Total (DH)': rep.coutTotal,
      'Pièces Remplacées': (rep.piecesUtilisees || []).map(p => `${p.reference} - ${p.designation} (x${p.quantite})`).join(' | '),
      'Remarques': rep.remarques || ''
    }));

    exportToExcel([
      {
        name: `Carnet_${vehicule.code}`,
        data: rows,
        colWidths: [
          { wch: 14 },
          { wch: 18 },
          { wch: 16 },
          { wch: 20 },
          { wch: 16 },
          { wch: 26 },
          { wch: 16 },
          { wch: 14 },
          { wch: 30 },
          { wch: 38 },
          { wch: 22 },
          { wch: 16 },
          { wch: 16 },
          { wch: 18 },
          { wch: 16 },
          { wch: 20 },
          { wch: 16 },
          { wch: 45 },
          { wch: 30 }
        ]
      }
    ], `carnet_entretien_${vehicule.code}_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportCarnetCSV = () => {
    const headers = [
      'Code_Materiel',
      'Immatriculation',
      'Numero_OT',
      'Type_Intervention',
      'Statut',
      'Titre',
      'Description',
      'Technicien',
      'Date_Declaration',
      'Date_Realisation',
      'Compteur_Releve',
      'Cout_Pieces_DH',
      'Cout_MO_DH',
      'Cout_Total_DH',
      'Pieces_Utilisees',
      'Remarques'
    ];

    const rows = vehicleRepairs.map(rep => [
      vehicule.code,
      vehicule.immatriculation,
      rep.numeroOT,
      rep.type,
      rep.statut,
      rep.titre,
      rep.description,
      rep.technicien,
      rep.dateDeclaration,
      rep.dateRealisation || '',
      `${rep.compteurReleve} ${vehicule.compteurType}`,
      rep.coutPieces.toFixed(2),
      rep.coutMainOeuvre.toFixed(2),
      rep.coutTotal.toFixed(2),
      (rep.piecesUtilisees || []).map(p => `${p.reference} (x${p.quantite})`).join('; '),
      rep.remarques || ''
    ]);

    exportToCSV(headers, rows, `carnet_entretien_${vehicule.code}_${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <div className="space-y-6">
      {/* Résumé KPI du carnet d'entretien */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
          <span className="text-[11px] text-slate-400 block mb-0.5">Total Interventions</span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-white">{stats.totalInterventions}</span>
            <span className="text-[10px] text-emerald-400">({stats.terminees} terminées)</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
          <span className="text-[11px] text-slate-400 block mb-0.5">Dépenses Cumulées</span>
          <span className="text-lg font-bold font-mono text-amber-400 truncate block">
            {formatDH(stats.totalDepenses)}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
          <span className="text-[11px] text-slate-400 block mb-0.5">Pièces Consommées</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-cyan-400">{stats.totalPiecesCount}</span>
            <span className="text-[10px] text-slate-400">unités ({formatDH(stats.totalPiecesCost)})</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
          <span className="text-[11px] text-slate-400 block mb-0.5">Dernière Opération</span>
          {stats.derniereIntervention ? (
            <div>
              <span className="text-xs font-semibold text-slate-200 block truncate">
                {stats.derniereIntervention.dateRealisation || stats.derniereIntervention.dateDeclaration}
              </span>
              <span className="text-[10px] text-slate-400 truncate block">
                {stats.derniereIntervention.compteurReleve} {vehicule.compteurType}
              </span>
            </div>
          ) : (
            <span className="text-xs text-slate-500">Aucune</span>
          )}
        </div>
      </div>

      {/* Barre d'outils et de filtrage */}
      <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        {/* Recherche */}
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Rechercher par N° OT, panne, pièces changées, intervenant..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Filtres déroulants */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="ALL">Tous les types</option>
            <option value="PREVENTIVE">Préventif</option>
            <option value="CORRECTIVE">Correctif</option>
            <option value="DEPANNAGE_URGENT">Dépannage urgent</option>
            <option value="CONTROLE_REGLEMENTAIRE">Contrôle VGP/CT</option>
          </select>

          <select
            value={statutFilter}
            onChange={e => setStatutFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="ALL">Tous statuts</option>
            <option value="TERMINEE">Terminée</option>
            <option value="EN_COURS">En cours</option>
            <option value="EN_ATTENTE_PIECES">En attente pièces</option>
            <option value="PLANIFIEE">Planifiée</option>
          </select>

          <button
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-700/70 border border-slate-700/80 rounded-lg text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
            title={sortOrder === 'desc' ? 'Plus récentes en premier' : 'Plus anciennes en premier'}
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
            <span>{sortOrder === 'desc' ? 'Récent' : 'Ancien'}</span>
          </button>

          {/* Boutons d'export carnet */}
          <div className="flex items-center gap-1 border-l border-slate-700/80 pl-2">
            <button
              onClick={handleExportCarnetExcel}
              className="p-1.5 bg-slate-900 hover:bg-slate-700/80 border border-slate-700/80 rounded-lg text-emerald-400 hover:text-emerald-300 cursor-pointer transition-colors"
              title="Exporter le carnet d'entretien en Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleExportCarnetCSV}
              className="p-1.5 bg-slate-900 hover:bg-slate-700/80 border border-slate-700/80 rounded-lg text-slate-300 hover:text-white cursor-pointer transition-colors"
              title="Exporter le carnet d'entretien en CSV"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Timeline Verticale */}
      {filteredTimeline.length === 0 ? (
        <div className="p-8 text-center rounded-xl bg-slate-800/20 border border-slate-800/80 space-y-3">
          <History className="w-10 h-10 text-slate-600 mx-auto" />
          <div className="text-sm font-semibold text-slate-300">
            {vehicleRepairs.length === 0 
              ? 'Aucun historique d\'intervention pour ce véhicule' 
              : 'Aucune intervention ne correspond aux filtres appliqués'}
          </div>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {vehicleRepairs.length === 0 
              ? 'Toutes les réparations, vidanges, révisions et contrôles techniques créés pour cet engin apparaîtront dans cette chronologie détaillée.' 
              : 'Essayez de réinitialiser vos termes de recherche ou vos filtres.'}
          </p>
          {onCreateOT && (
            <button
              onClick={onCreateOT}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Créer un Ordre de Travail</span>
            </button>
          )}
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 before:content-[''] before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-amber-500/80 before:via-slate-700 before:to-slate-800 space-y-6">
          {filteredTimeline.map((rep, index) => {
            const typeStyle = getTypeStyle(rep.type);
            const Icon = typeStyle.icon;
            const isExpanded = !!expandedRepairs[rep.id];
            const parts = rep.piecesUtilisees || [];

            return (
              <div key={rep.id} className="relative group">
                {/* Node icon sur la ligne de temps */}
                <div 
                  className={`absolute -left-6 sm:-left-8 top-1 w-6 h-6 sm:w-8 sm:h-8 rounded-full ${typeStyle.dotBg} text-slate-950 flex items-center justify-center shadow-lg ring-4 ${typeStyle.ringColor} transition-transform group-hover:scale-110`}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                </div>

                {/* Contenu de l'étape chronologique */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/90 hover:border-slate-700/90 transition-all p-4 shadow-sm hover:shadow-md space-y-3">
                  {/* Entête de l'intervention */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-xs">
                        {rep.numeroOT}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${typeStyle.badgeClass}`}>
                        {typeStyle.label}
                      </span>
                      {getStatutBadge(rep.statut)}
                      {getPriorityBadge(rep.priorite)}
                    </div>

                    {/* Date et relevé compteur */}
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <div className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{rep.dateRealisation || rep.dateDeclaration}</span>
                      </div>
                      <div className="flex items-center gap-1 font-mono text-slate-300">
                        <Gauge className="w-3.5 h-3.5 text-amber-500/80" />
                        <span>{rep.compteurReleve.toLocaleString()} {vehicule.compteurType}</span>
                      </div>
                    </div>
                  </div>

                  {/* Titre et description principale */}
                  <div>
                    <h3 className="text-sm font-semibold text-white group-hover:text-amber-400 transition-colors">
                      {rep.titre}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed whitespace-pre-line">
                      {rep.description}
                    </p>
                  </div>

                  {/* Intervenant & Dépenses financières */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 text-xs">
                    <div className="flex items-center gap-2 text-slate-400">
                      <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                        <User className="w-3 h-3" />
                      </div>
                      <span>Intervenant : <strong className="text-slate-200">{rep.technicien}</strong></span>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto font-mono">
                      <div className="text-[11px] text-slate-400">
                        <span>Pièces: {formatDH(rep.coutPieces)}</span>
                        <span className="mx-1.5">·</span>
                        <span>MO: {formatDH(rep.coutMainOeuvre)}</span>
                      </div>
                      <div className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-xs">
                        {formatDH(rep.coutTotal)}
                      </div>
                    </div>
                  </div>

                  {/* Bloc dépliable : Pièces de rechange et remarques */}
                  {(parts.length > 0 || rep.remarques) && (
                    <div className="pt-2 border-t border-slate-800/60">
                      <button
                        onClick={() => toggleExpand(rep.id)}
                        className="text-[11px] font-medium text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        <span>
                          {parts.length > 0 ? `${parts.length} pièce(s) remplacée(s)` : 'Détails complémentaires'}
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="mt-3 p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-3 text-xs">
                          {parts.length > 0 && (
                            <div>
                              <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-300 mb-2">
                                <Package className="w-3.5 h-3.5 text-amber-400" />
                                <span>Pièces détachées utilisées lors de cette intervention :</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {parts.map((p, pIdx) => (
                                  <div 
                                    key={pIdx} 
                                    className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between text-[11px]"
                                  >
                                    <div>
                                      <div className="font-semibold text-slate-200">{p.designation}</div>
                                      <div className="font-mono text-slate-500 text-[10px]">Réf: {p.reference}</div>
                                    </div>
                                    <div className="text-right font-mono">
                                      <span className="text-amber-400 font-bold">x{p.quantite}</span>
                                      <div className="text-slate-400 text-[10px]">{formatDH(p.prixUnitaire * p.quantite)}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {rep.remarques && (
                            <div className="text-[11px] text-slate-400 border-t border-slate-800/60 pt-2">
                              <span className="font-semibold text-slate-300">Observations atelier : </span>
                              <span>{rep.remarques}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
