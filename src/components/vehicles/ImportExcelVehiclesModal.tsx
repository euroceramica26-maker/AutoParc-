import React, { useState, useRef } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  Check, 
  AlertCircle, 
  Truck, 
  CheckCircle2,
  FileDown,
  Gauge,
  Calendar,
  Layers
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  Vehicule, 
  VehiculeType, 
  CompteurType, 
  VehiculeStatut, 
  CarburantType 
} from '../../types/fleet';
import { useFleet } from '../../context/FleetContext';

interface ImportExcelVehiclesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedVehicleRow {
  code: string;
  immatriculation: string;
  marque: string;
  modele: string;
  type: VehiculeType;
  compteurType: CompteurType;
  compteurActuel: number;
  annee: number;
  statut: VehiculeStatut;
  conducteur: string;
  carburant: CarburantType;
  consommationMoyenne: string;
  siteAffectation: string;
  dateMiseEnService: string;
  dateProchainControle: string;
  dateExpirationAssurance: string;
  notes?: string;
  isValid: boolean;
  error?: string;
}

const VALID_TYPES: VehiculeType[] = ['ENGIN', 'POIDS_LOURD', 'UTILITAIRE', 'VL'];
const VALID_STATUTS: VehiculeStatut[] = ['EN_SERVICE', 'EN_MAINTENANCE', 'EN_PANNE', 'IMMOBILISE', 'REFORME'];
const VALID_CARBURANTS: CarburantType[] = ['DIESEL', 'ESSENCE', 'ELECTRIQUE', 'HYBRIDE'];

export const ImportExcelVehiclesModal: React.FC<ImportExcelVehiclesModalProps> = ({
  isOpen,
  onClose
}) => {
  const { importVehiculesFromExcel } = useFleet();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedVehicleRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  // Télécharger le modèle Excel modèle prêt à l'emploi
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        Code_Parc: 'ENG-001',
        Immatriculation_Ou_Serie: 'CAT0320GC202391',
        Marque: 'Caterpillar',
        Modele: '320 GC (Pelle Chenilles 22T)',
        Type_Equipement: 'ENGIN',
        Type_Compteur: 'heures',
        Compteur_Actuel: 3450,
        Annee: 2022,
        Statut: 'EN_SERVICE',
        Conducteur_Affecte: 'Brahim Oumansour',
        Carburant: 'DIESEL',
        Consommation_Moyenne: '17.5 L/h',
        Site_Affectation: 'Chantier Carrière Ouarzazate',
        Date_Mise_En_Service: '2022-04-15',
        Prochain_Controle_VGP: '2026-11-20',
        Expiration_Assurance: '2027-03-31',
        Notes: 'Godet 1.2m3 renforcé - Entretien 250h régulier'
      },
      {
        Code_Parc: 'CAM-004',
        Immatriculation_Ou_Serie: '48291-B-26',
        Marque: 'Mercedes-Benz',
        Modele: 'Actros 2645 6x4 Benne',
        Type_Equipement: 'POIDS_LOURD',
        Type_Compteur: 'km',
        Compteur_Actuel: 142800,
        Annee: 2021,
        Statut: 'EN_SERVICE',
        Conducteur_Affecte: 'Mohamed Tazi',
        Carburant: 'DIESEL',
        Consommation_Moyenne: '34.2 L/100km',
        Site_Affectation: 'Plateforme Logistique Casablanca',
        Date_Mise_En_Service: '2021-06-10',
        Prochain_Controle_VGP: '2026-12-05',
        Expiration_Assurance: '2027-05-15',
        Notes: 'Contrôle tachy et limiteur à jour'
      },
      {
        Code_Parc: 'ENG-005',
        Immatriculation_Ou_Serie: 'KOM-WA380-771',
        Marque: 'Komatsu',
        Modele: 'WA380-6 (Chargeuse sur pneus)',
        Type_Equipement: 'ENGIN',
        Type_Compteur: 'heures',
        Compteur_Actuel: 5120,
        Annee: 2020,
        Statut: 'EN_MAINTENANCE',
        Conducteur_Affecte: 'Yassine Belhaj',
        Carburant: 'DIESEL',
        Consommation_Moyenne: '19.0 L/h',
        Site_Affectation: 'Centrale à Béton Tanger',
        Date_Mise_En_Service: '2020-09-18',
        Prochain_Controle_VGP: '2026-10-30',
        Expiration_Assurance: '2027-01-10',
        Notes: 'Vérins de godet révisés'
      },
      {
        Code_Parc: 'UTI-012',
        Immatriculation_Ou_Serie: '11902-A-01',
        Marque: 'Renault',
        Modele: 'Master III DCI 150 Atelier Mobile',
        Type_Equipement: 'UTILITAIRE',
        Type_Compteur: 'km',
        Compteur_Actuel: 89300,
        Annee: 2022,
        Statut: 'EN_SERVICE',
        Conducteur_Affecte: 'Equipe Dépannage Parc',
        Carburant: 'DIESEL',
        Consommation_Moyenne: '9.4 L/100km',
        Site_Affectation: 'Atelier Central Rabat',
        Date_Mise_En_Service: '2022-01-20',
        Prochain_Controle_VGP: '2027-01-15',
        Expiration_Assurance: '2027-02-28',
        Notes: 'Équipé compresseur et groupe électrogène embarqué'
      },
      {
        Code_Parc: 'VL-008',
        Immatriculation_Ou_Serie: '76543-D-26',
        Marque: 'Dacia',
        Modele: 'Duster 1.5 dCi 4x4 Prestige',
        Type_Equipement: 'VL',
        Type_Compteur: 'km',
        Compteur_Actuel: 58400,
        Annee: 2023,
        Statut: 'EN_SERVICE',
        Conducteur_Affecte: 'Karim Alaoui (Chef de Projet)',
        Carburant: 'DIESEL',
        Consommation_Moyenne: '6.2 L/100km',
        Site_Affectation: 'Direction Régionale Marrakech',
        Date_Mise_En_Service: '2023-03-01',
        Prochain_Controle_VGP: '2028-03-01',
        Expiration_Assurance: '2027-06-30',
        Notes: 'Véhicule de liaison chantier tout-terrain'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);

    // Ajuster largeurs de colonnes pour une belle lisibilité
    worksheet['!cols'] = [
      { wch: 14 }, // Code_Parc
      { wch: 26 }, // Immatriculation_Ou_Serie
      { wch: 18 }, // Marque
      { wch: 32 }, // Modele
      { wch: 16 }, // Type_Equipement
      { wch: 14 }, // Type_Compteur
      { wch: 16 }, // Compteur_Actuel
      { wch: 10 }, // Annee
      { wch: 16 }, // Statut
      { wch: 28 }, // Conducteur_Affecte
      { wch: 14 }, // Carburant
      { wch: 22 }, // Consommation_Moyenne
      { wch: 30 }, // Site_Affectation
      { wch: 20 }, // Date_Mise_En_Service
      { wch: 22 }, // Prochain_Controle_VGP
      { wch: 22 }, // Expiration_Assurance
      { wch: 35 }  // Notes
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Flotte_Vehicules_Engins');
    XLSX.writeFile(workbook, 'Modele_Import_Vehicules_Engins_AutoParc.xlsx');
  };

  const cleanHeader = (key: string): string => {
    return key
      .toLowerCase()
      .trim()
      .replace(/[_\s\-\.\/]/g, '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setParseError(null);
    setImportSuccessCount(null);
    setIsProcessing(true);

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          throw new Error("Le fichier Excel ne contient aucune feuille de calcul.");
        }

        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          throw new Error("Le fichier est vide ou n'a pas pu être lu.");
        }

        const todayStr = new Date().toISOString().split('T')[0];
        const inSixMonths = new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0];
        const inOneYear = new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0];

        const rows: ParsedVehicleRow[] = rawJson.map((row, idx) => {
          // Normalisation des clés du row
          const map: Record<string, any> = {};
          Object.keys(row).forEach(k => {
            map[cleanHeader(k)] = row[k];
          });

          // Trouver les champs avec tolérance
          const codeVal = String(
            map['codeparc'] || 
            map['code'] || 
            map['numparc'] || 
            map['ref'] || 
            map['reference'] || 
            `VH-${idx + 1}`
          ).trim();

          const immatVal = String(
            map['immatriculationouserie'] || 
            map['immatriculation'] || 
            map['matricule'] || 
            map['serie'] || 
            map['numeroserie'] || 
            map['numserie'] || 
            map['chassis'] || 
            map['vin'] || 
            ''
          ).trim();

          const marqueVal = String(map['marque'] || map['constructeur'] || map['brand'] || 'Inconnue').trim();
          const modeleVal = String(map['modele'] || map['model'] || map['typecommercial'] || '').trim();

          // Type d'équipement
          const rawType = String(map['typeequipement'] || map['type'] || map['categorie'] || '').trim().toUpperCase();
          let type: VehiculeType = 'UTILITAIRE';
          if (rawType.includes('ENGIN') || rawType.includes('PELLE') || rawType.includes('CHARGEUSE') || rawType.includes('NIVELEUSE') || rawType.includes('COMPACTEUR')) {
            type = 'ENGIN';
          } else if (rawType.includes('LOURD') || rawType.includes('CAMION') || rawType.includes('TRACTEUR') || rawType.includes('PL') || rawType.includes('POIDS_LOURD')) {
            type = 'POIDS_LOURD';
          } else if (rawType.includes('LEGER') || rawType.includes('VL') || rawType.includes('VOITURE') || rawType.includes('BERLINE')) {
            type = 'VL';
          } else if (rawType.includes('UTILITAIRE') || rawType.includes('FOURGON') || rawType.includes('PICKUP')) {
            type = 'UTILITAIRE';
          } else if (VALID_TYPES.includes(rawType as VehiculeType)) {
            type = rawType as VehiculeType;
          } else if (codeVal.toUpperCase().startsWith('ENG') || marqueVal.toLowerCase().includes('caterpillar') || marqueVal.toLowerCase().includes('komatsu')) {
            type = 'ENGIN';
          }

          // Type de compteur
          const rawCompteurType = String(map['typecompteur'] || map['compteurtype'] || map['unitecompteur'] || '').toLowerCase();
          let compteurType: CompteurType = type === 'ENGIN' ? 'heures' : 'km';
          if (rawCompteurType.includes('heure') || rawCompteurType === 'h') {
            compteurType = 'heures';
          } else if (rawCompteurType.includes('km') || rawCompteurType.includes('kilo')) {
            compteurType = 'km';
          }

          // Compteur actuel
          const rawCompteur = Number(String(map['compteuractuel'] || map['compteur'] || map['kilometrage'] || map['heures'] || 0).replace(/[^0-9.]/g, ''));
          const compteurActuel = isNaN(rawCompteur) ? 0 : Math.max(0, rawCompteur);

          // Année
          const rawAnnee = Number(String(map['annee'] || map['year'] || new Date().getFullYear()).replace(/[^0-9]/g, ''));
          const annee = isNaN(rawAnnee) || rawAnnee < 1980 || rawAnnee > 2035 ? new Date().getFullYear() : rawAnnee;

          // Statut
          const rawStatut = String(map['statut'] || map['etat'] || map['status'] || 'EN_SERVICE').trim().toUpperCase();
          let statut: VehiculeStatut = 'EN_SERVICE';
          if (rawStatut.includes('MAINTENANCE') || rawStatut.includes('ENTRETIEN') || rawStatut.includes('ATELIER')) {
            statut = 'EN_MAINTENANCE';
          } else if (rawStatut.includes('PANNE') || rawStatut.includes('ARRET')) {
            statut = 'EN_PANNE';
          } else if (rawStatut.includes('IMMOBILISE')) {
            statut = 'IMMOBILISE';
          } else if (rawStatut.includes('REFORME') || rawStatut.includes('REBUTE')) {
            statut = 'REFORME';
          } else if (VALID_STATUTS.includes(rawStatut as VehiculeStatut)) {
            statut = rawStatut as VehiculeStatut;
          }

          // Conducteur
          const conducteur = String(map['conducteuraffecte'] || map['conducteur'] || map['operateur'] || map['chauffeur'] || map['pilote'] || 'Non affecté').trim();

          // Carburant
          const rawCarb = String(map['carburant'] || map['energie'] || 'DIESEL').trim().toUpperCase();
          let carburant: CarburantType = 'DIESEL';
          if (rawCarb.includes('ESSENCE')) carburant = 'ESSENCE';
          else if (rawCarb.includes('ELEC')) carburant = 'ELECTRIQUE';
          else if (rawCarb.includes('HYBRID')) carburant = 'HYBRIDE';
          else if (VALID_CARBURANTS.includes(rawCarb as CarburantType)) carburant = rawCarb as CarburantType;

          // Consommation Moyenne
          const consommationMoyenne = String(
            map['consommationmoyenne'] || 
            map['consommation'] || 
            (compteurType === 'heures' ? '18 L/h' : '10 L/100km')
          ).trim();

          // Site
          const siteAffectation = String(map['siteaffectation'] || map['site'] || map['depot'] || map['affectation'] || map['base'] || 'Base Principale').trim();

          // Dates
          const parseDate = (val: any, fallback: string): string => {
            if (!val) return fallback;
            if (typeof val === 'number') {
              // Date Excel numérique
              const dateObj = XLSX.SSF.parse_date_code(val);
              if (dateObj) {
                const y = dateObj.y;
                const m = String(dateObj.m).padStart(2, '0');
                const d = String(dateObj.d).padStart(2, '0');
                return `${y}-${m}-${d}`;
              }
            }
            const s = String(val).trim();
            if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
            if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
              const parts = s.split('/');
              return `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
            return fallback;
          };

          const dateMiseEnService = parseDate(map['datemiseenservice'] || map['miseenservice'] || map['dateachat'], todayStr);
          const dateProchainControle = parseDate(map['prochaincontrolevgp'] || map['prochaincontrole'] || map['vgp'] || map['controletechnique'] || map['ct'], inSixMonths);
          const dateExpirationAssurance = parseDate(map['expirationassurance'] || map['assurance'] || map['dateassurance'], inOneYear);

          const notes = String(map['notes'] || map['observations'] || map['remarques'] || '').trim();

          // Validation
          let isValid = true;
          let error = '';

          if (!codeVal && !immatVal) {
            isValid = false;
            error = 'Le code parc ou le numéro de série/immatriculation est requis.';
          } else if (!modeleVal && !marqueVal) {
            isValid = false;
            error = 'La marque ou le modèle de l\'engin doit être précisé.';
          }

          return {
            code: codeVal,
            immatriculation: immatVal || codeVal,
            marque: marqueVal,
            modele: modeleVal || 'Équipement non spécifié',
            type,
            compteurType,
            compteurActuel,
            annee,
            statut,
            conducteur: conducteur || 'Non affecté',
            carburant,
            consommationMoyenne,
            siteAffectation,
            dateMiseEnService,
            dateProchainControle,
            dateExpirationAssurance,
            notes: notes || undefined,
            isValid,
            error
          };
        });

        setParsedRows(rows);
      } catch (err: any) {
        setParseError(err.message || "Erreur lors du traitement du fichier. Vérifiez le format.");
      } finally {
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setParseError("Impossible de lire le fichier sélectionné.");
      setIsProcessing(false);
    };

    reader.readAsArrayBuffer(file);
  };

  const handleExecuteImport = () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) return;

    const dataToImport = validRows.map(r => ({
      code: r.code,
      immatriculation: r.immatriculation,
      marque: r.marque,
      modele: r.modele,
      type: r.type,
      compteurType: r.compteurType,
      compteurActuel: r.compteurActuel,
      annee: r.annee,
      statut: r.statut,
      conducteur: r.conducteur,
      carburant: r.carburant,
      consommationMoyenne: r.consommationMoyenne,
      siteAffectation: r.siteAffectation,
      dateMiseEnService: r.dateMiseEnService,
      dateProchainControle: r.dateProchainControle,
      dateExpirationAssurance: r.dateExpirationAssurance,
      notes: r.notes
    }));

    const count = importVehiculesFromExcel(dataToImport);
    setImportSuccessCount(count);
  };

  const validCount = parsedRows.filter(r => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Importer la liste des véhicules & engins (Excel / CSV)</span>
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  .xlsx / .csv
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Intégrez rapidement vos engins de chantier, camions et véhicules légers depuis un tableur.
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Success Banner */}
          {importSuccessCount !== null ? (
            <div className="p-6 rounded-xl bg-emerald-950/40 border border-emerald-700/50 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Importation réussie avec succès !</h3>
                <p className="text-sm text-emerald-300 mt-1">
                  <span className="font-bold font-mono text-white text-base">{importSuccessCount}</span> équipements et engins ont été ajoutés à votre parc.
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  Toutes les fiches véhicules, compteurs horaires/kilométriques, alertes et échéances ont été enregistrés.
                </p>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors cursor-pointer shadow-md"
                >
                  Voir les véhicules dans le Parc
                </button>
                <button
                  onClick={() => {
                    setImportSuccessCount(null);
                    setParsedRows([]);
                    setFileName(null);
                  }}
                  className="px-4 py-2.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  Importer un autre fichier
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Instructions & Template download card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
                    <Layers className="w-4 h-4" />
                    <span>Instructions de mise en forme</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Votre fichier Excel doit comporter des colonnes identifiables : <span className="text-white font-mono font-medium">Code_Parc</span>, <span className="text-white font-mono font-medium">Immatriculation / N° Série</span>, <span className="text-white font-mono font-medium">Marque</span>, <span className="text-white font-mono font-medium">Modele</span>, <span className="text-white font-mono font-medium">Type_Equipement</span> (ENGIN, POIDS_LOURD, UTILITAIRE, VL), et <span className="text-white font-mono font-medium">Compteur_Actuel</span>.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    💡 Les engins TP (pelles, chargeuses) adoptent automatiquement un compteur en <span className="text-amber-400 font-medium">heures</span>, tandis que les véhicules routiers adoptent les <span className="text-amber-400 font-medium">km</span>.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-xs font-semibold text-emerald-300 block mb-1">
                      Fichier Modèle Excel Prêt
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Téléchargez le gabarit pré-rempli avec des exemples concrets (engins TP, camions, utilitaires).
                    </p>
                  </div>

                  <button
                    onClick={handleDownloadTemplate}
                    className="w-full px-3 py-2 text-xs font-semibold text-emerald-300 hover:text-white bg-emerald-900/50 hover:bg-emerald-800/70 border border-emerald-700/60 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <FileDown className="w-4 h-4 text-emerald-400" />
                    <span>Télécharger Modèle .xlsx</span>
                  </button>
                </div>
              </div>

              {/* Upload Drop Zone */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors ${
                  fileName 
                    ? 'border-emerald-500/50 bg-emerald-950/10' 
                    : 'border-slate-700 hover:border-slate-500 bg-slate-800/20 hover:bg-slate-800/40'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                
                <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                  {isProcessing ? (
                    <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  ) : fileName ? (
                    <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <Upload className="w-6 h-6 text-slate-400" />
                  )}
                </div>

                <div className="text-center">
                  {fileName ? (
                    <div>
                      <p className="text-sm font-semibold text-emerald-400 flex items-center justify-center gap-1.5">
                        <Check className="w-4 h-4" />
                        <span>Fichier chargé : {fileName}</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Cliquez pour changer de fichier Excel ou CSV
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-slate-200">
                        Cliquez pour sélectionner votre fichier <span className="text-amber-400 font-semibold">.xlsx</span> ou <span className="text-amber-400 font-semibold">.csv</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Glissez-déposez ou cliquez ici pour parcourir vos documents
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Parse Error */}
              {parseError && (
                <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block mb-0.5">Erreur de lecture du fichier</span>
                    <span>{parseError}</span>
                  </div>
                </div>
              )}

              {/* Data Preview Section */}
              {parsedRows.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        Aperçu des données détectées
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                        {parsedRows.length} lignes
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium">
                        ✓ {validCount} valides
                      </span>
                      {invalidCount > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-400 font-medium">
                          ⚠ {invalidCount} à corriger
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Preview Table */}
                  <div className="rounded-lg border border-slate-800 bg-slate-950/60 overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-900 sticky top-0 border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3">État</th>
                          <th className="py-2.5 px-3">Code</th>
                          <th className="py-2.5 px-3">Immatriculation / Série</th>
                          <th className="py-2.5 px-3">Marque & Modèle</th>
                          <th className="py-2.5 px-3">Type</th>
                          <th className="py-2.5 px-3 text-right">Compteur</th>
                          <th className="py-2.5 px-3">Site</th>
                          <th className="py-2.5 px-3">Conducteur</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {parsedRows.map((row, idx) => (
                          <tr key={idx} className={row.isValid ? 'hover:bg-slate-900/40' : 'bg-rose-950/20'}>
                            <td className="py-2 px-3">
                              {row.isValid ? (
                                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                                  <Check className="w-3.5 h-3.5" />
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] text-rose-400" title={row.error}>
                                  <AlertCircle className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 font-mono font-bold text-amber-400 whitespace-nowrap">
                              {row.code}
                            </td>
                            <td className="py-2 px-3 font-mono text-slate-200 whitespace-nowrap">
                              {row.immatriculation}
                            </td>
                            <td className="py-2 px-3 font-medium text-white max-w-[200px] truncate">
                              <span className="text-slate-400">{row.marque}</span> {row.modele}
                            </td>
                            <td className="py-2 px-3 whitespace-nowrap">
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                                {row.type}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-white whitespace-nowrap">
                              {row.compteurActuel.toLocaleString('fr-FR')} {row.compteurType}
                            </td>
                            <td className="py-2 px-3 text-slate-300 whitespace-nowrap">
                              {row.siteAffectation}
                            </td>
                            <td className="py-2 px-3 text-slate-400 whitespace-nowrap">
                              {row.conducteur}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/90">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Fermer
          </button>

          {importSuccessCount === null && (
            <button
              onClick={handleExecuteImport}
              disabled={validCount === 0}
              className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
                validCount > 0 
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20' 
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>Importer {validCount} équipement{validCount > 1 ? 's' : ''} dans le Parc</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
