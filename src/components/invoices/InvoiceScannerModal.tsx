import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Camera, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Wrench, 
  Plus, 
  Trash2, 
  Edit3, 
  Building2, 
  Calendar, 
  DollarSign, 
  ArrowRight,
  RefreshCw,
  FileSpreadsheet,
  Check
} from 'lucide-react';
import { useFleet } from '../../context/FleetContext';
import { ScannedInvoice, ScannedInvoiceItem } from '../../types/invoice';
import { scanInvoiceWithOCR, SAMPLE_INVOICES, matchItemsWithExistingPieces } from '../../services/ocrService';
import { formatDH } from '../../utils/formatters';
import { CategoriePiece } from '../../types/fleet';

interface InvoiceScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyToOT?: (invoice: ScannedInvoice, vehiculeId?: string) => void;
}

export const InvoiceScannerModal: React.FC<InvoiceScannerModalProps> = ({
  isOpen,
  onClose,
  onApplyToOT
}) => {
  const { pieces, addPiece, reapprovisionnerPiece, vehicules, currentUser } = useFleet();

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scannedData, setScannedData] = useState<ScannedInvoice | null>(null);
  
  // Post-scan target selection
  const [targetAction, setTargetAction] = useState<'stock' | 'reparation' | null>(null);
  const [selectedVehiculeId, setSelectedVehiculeId] = useState<string>(vehicules[0]?.id || '');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setScanError(null);
    setSuccessNotice(null);

    // Create preview URL
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    // Run OCR directly
    await processFileOCR(selectedFile);
  };

  const processFileOCR = async (fileToScan: File) => {
    setIsScanning(true);
    setScanError(null);

    try {
      const result = await scanInvoiceWithOCR(fileToScan, fileToScan.type, pieces);
      setScannedData(result);
      if (result.filePreviewUrl) {
        setPreviewUrl(result.filePreviewUrl);
      }
    } catch (err: any) {
      console.error('Erreur OCR:', err);
      setScanError(err.message || 'Impossible d\'analyser la facture. Veuillez vérifier le fichier.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSelectSample = (sample: typeof SAMPLE_INVOICES[0]) => {
    setFile(null);
    setPreviewUrl(null);
    setScanError(null);
    setSuccessNotice(null);
    setIsScanning(true);

    setTimeout(() => {
      const matched = {
        ...sample.invoice,
        items: matchItemsWithExistingPieces(sample.invoice.items, pieces)
      };
      setScannedData(matched);
      setIsScanning(false);
    }, 600);
  };

  const handleUpdateItem = (index: number, field: keyof ScannedInvoiceItem, value: any) => {
    if (!scannedData) return;
    const updated = [...scannedData.items];
    const current = { ...updated[index], [field]: value };
    
    // Recalculate line total if price or qty changed
    if (field === 'quantity' || field === 'unitPrice') {
      current.totalPrice = Number(current.quantity || 0) * Number(current.unitPrice || 0);
    }

    updated[index] = current;
    
    // Recalculate total
    const newTotal = updated.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

    setScannedData({
      ...scannedData,
      items: updated,
      totalAmount: newTotal
    });
  };

  const handleDeleteItem = (index: number) => {
    if (!scannedData) return;
    const updated = scannedData.items.filter((_, i) => i !== index);
    const newTotal = updated.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    setScannedData({
      ...scannedData,
      items: updated,
      totalAmount: newTotal
    });
  };

  const handleAddItem = () => {
    if (!scannedData) return;
    const newItem: ScannedInvoiceItem = {
      id: `manual_item_${Date.now()}`,
      description: 'Nouvelle pièce / prestation',
      reference: 'REF-MANUELLE',
      quantity: 1,
      unitPrice: 100,
      totalPrice: 100,
      category: 'Filtration'
    };
    const updated = [...scannedData.items, newItem];
    setScannedData({
      ...scannedData,
      items: updated,
      totalAmount: scannedData.totalAmount + 100
    });
  };

  // ACTION 1: Intégrer les pièces scannées directement dans le stock
  const handleCommitToStock = () => {
    if (!scannedData || scannedData.items.length === 0) return;

    let updatedCount = 0;
    let addedCount = 0;

    scannedData.items.forEach(item => {
      // Check if it matches existing part
      const matched = pieces.find(p => 
        (item.reference && p.reference.toLowerCase() === item.reference.toLowerCase()) ||
        (item.matchedPieceId && p.id === item.matchedPieceId)
      );

      if (matched) {
        // Restock existing piece
        reapprovisionnerPiece(
          matched.id,
          Number(item.quantity) || 1,
          `Facture ${scannedData.invoiceNumber || 'sans n°'} - ${scannedData.vendor}`,
          currentUser?.nom || 'OCR Facture'
        );
        updatedCount++;
      } else {
        // Add new piece to inventory
        addPiece({
          reference: item.reference || `REF-${Math.floor(1000 + Math.random() * 9000)}`,
          designation: item.description,
          categorie: (item.category as CategoriePiece) || 'Filtration',
          stockActuel: Number(item.quantity) || 1,
          stockMin: Math.max(2, Math.floor((Number(item.quantity) || 1) / 2)),
          prixUnitaire: Number(item.unitPrice) || 0,
          emplacement: 'Rayon Réception / Atelier',
          fournisseur: scannedData.vendor,
          compatibilites: ['Tous modèles'],
          dateDernierAppro: scannedData.date || new Date().toISOString().split('T')[0]
        });
        addedCount++;
      }
    });

    setSuccessNotice(
      `Stock mis à jour avec succès ! ${updatedCount} pièce(s) réapprovisionnée(s) et ${addedCount} nouvelle(s) référence(s) créée(s) à partir de la facture ${scannedData.invoiceNumber || ''}.`
    );
  };

  // ACTION 2: Transférer vers un Ordre de Travail
  const handleCommitToOT = () => {
    if (!scannedData) return;
    if (onApplyToOT) {
      onApplyToOT(scannedData, selectedVehiculeId);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Scanner Facture & Bon d'Achat (OCR IA)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Gemini OCR
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Numérisez vos factures fournisseurs, pièces détachées et devis pour injection automatique dans le parc.
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* Upload Drop Zone & Actions if not scanned yet */}
          {!scannedData && !isScanning && (
            <div className="space-y-6">
              {/* Drag & Drop Area */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-amber-500/80 rounded-2xl p-8 text-center bg-slate-800/20 hover:bg-slate-800/40 transition-all cursor-pointer group"
              >
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="hidden" 
                />
                <input 
                  ref={cameraInputRef}
                  type="file" 
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden" 
                />

                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mx-auto mb-3 group-hover:scale-105 transition-transform">
                  <Upload className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">
                  Glissez-déposez une facture ou cliquez pour parcourir
                </h3>
                <p className="text-slate-400 max-w-md mx-auto text-xs leading-relaxed">
                  Prend en charge les photos de factures papier, reçus, bons de livraison ou PDF (JPEG, PNG, WEBP, PDF).
                </p>

                <div className="mt-4 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      cameraInputRef.current?.click();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  >
                    <Camera className="w-4 h-4 text-amber-400" />
                    <span>Prendre en photo (Appareil)</span>
                  </button>
                </div>
              </div>

              {/* Sample Presets to test OCR instantly */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-amber-500" />
                  <span className="font-semibold text-white uppercase text-[11px] tracking-wider">
                    Ou essayez avec une facture pré-configurée
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {SAMPLE_INVOICES.map((sample, idx) => (
                    <div 
                      key={idx}
                      onClick={() => handleSelectSample(sample)}
                      className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-amber-500/40 hover:bg-slate-800/70 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          {sample.invoice.invoiceNumber}
                        </span>
                        <span className="font-bold text-white">
                          {formatDH(sample.invoice.totalAmount)}
                        </span>
                      </div>
                      <div className="font-semibold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                        {sample.title}
                      </div>
                      <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {sample.subtitle}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Loading / Scanning animation */}
          {isScanning && (
            <div className="py-14 text-center space-y-4">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 rounded-2xl border-2 border-amber-500/30 animate-pulse" />
                <div className="absolute inset-0 rounded-2xl border-t-2 border-amber-500 animate-spin" />
                <div className="w-full h-full flex items-center justify-center text-amber-400">
                  <Sparkles className="w-8 h-8 animate-bounce" />
                </div>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Analyse OCR en cours par IA...</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Extraction du fournisseur, date, articles, références OEM, quantités et montants HT/TTC.
                </p>
              </div>
            </div>
          )}

          {/* Error display */}
          {scanError && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold block">Erreur lors de la numérisation</span>
                <p className="text-xs">{scanError}</p>
                <button
                  onClick={() => {
                    setScanError(null);
                    setScannedData(null);
                  }}
                  className="mt-2 text-xs text-amber-400 hover:underline cursor-pointer"
                >
                  Essayer un autre fichier ou un exemple
                </button>
              </div>
            </div>
          )}

          {/* Scanned Data Results View */}
          {scannedData && !isScanning && (
            <div className="space-y-5">
              
              {/* Success Notification Banner */}
              {successNotice && (
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-start gap-3 text-emerald-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-bold block text-sm">Opération effectuée avec succès</span>
                    <p className="text-xs mt-0.5">{successNotice}</p>
                  </div>
                </div>
              )}

              {/* Invoice Metadata Header Cards */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* Fournisseur */}
                <div>
                  <label className="text-slate-400 block text-[11px] font-medium mb-1 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Fournisseur / Garage</span>
                  </label>
                  <input 
                    type="text" 
                    value={scannedData.vendor}
                    onChange={e => setScannedData({ ...scannedData, vendor: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-semibold text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* N° Facture */}
                <div>
                  <label className="text-slate-400 block text-[11px] font-medium mb-1 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>N° Facture / Bon</span>
                  </label>
                  <input 
                    type="text" 
                    value={scannedData.invoiceNumber || ''}
                    onChange={e => setScannedData({ ...scannedData, invoiceNumber: e.target.value })}
                    placeholder="Ex: FAC-2026-001"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-amber-400 font-mono font-bold text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="text-slate-400 block text-[11px] font-medium mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>Date Facturation</span>
                  </label>
                  <input 
                    type="date" 
                    value={scannedData.date}
                    onChange={e => setScannedData({ ...scannedData, date: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Montant Total */}
                <div>
                  <label className="text-slate-400 block text-[11px] font-medium mb-1 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Montant Total ({scannedData.currency})</span>
                  </label>
                  <div className="font-mono font-bold text-emerald-400 text-sm bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5">
                    {formatDH(scannedData.totalAmount)}
                  </div>
                </div>
              </div>

              {/* Items Table Extracted */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs uppercase tracking-wider">
                      Lignes & Pièces Détectées ({scannedData.items.length})
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Vérifiez et ajustez les quantités et prix avant validation.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-slate-700"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter une ligne</span>
                  </button>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-800/40 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3 font-medium">Désignation / Article</th>
                          <th className="py-2.5 px-3 font-medium">Référence OEM</th>
                          <th className="py-2.5 px-3 font-medium">Catégorie</th>
                          <th className="py-2.5 px-3 font-medium text-right w-20">Qté</th>
                          <th className="py-2.5 px-3 font-medium text-right w-24">P.U ({scannedData.currency})</th>
                          <th className="py-2.5 px-3 font-medium text-right w-28">Total ({scannedData.currency})</th>
                          <th className="py-2.5 px-3 font-medium text-center w-12">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {scannedData.items.map((item, idx) => (
                          <tr key={item.id} className="hover:bg-slate-800/30">
                            {/* Description & Match Notice */}
                            <td className="py-2.5 px-3">
                              <input 
                                type="text"
                                value={item.description}
                                onChange={e => handleUpdateItem(idx, 'description', e.target.value)}
                                className="w-full bg-transparent border-b border-transparent hover:border-slate-700 focus:border-amber-500 text-white font-medium focus:outline-none"
                              />
                              {item.matchedPieceName && (
                                <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-400">
                                  <Check className="w-3 h-3" />
                                  <span>Correspondance stock : {item.matchedPieceName}</span>
                                </div>
                              )}
                            </td>

                            {/* Reference */}
                            <td className="py-2.5 px-3">
                              <input 
                                type="text"
                                value={item.reference || ''}
                                onChange={e => handleUpdateItem(idx, 'reference', e.target.value)}
                                placeholder="Réf OEM..."
                                className="w-full bg-transparent border-b border-transparent hover:border-slate-700 focus:border-amber-500 font-mono text-amber-400 font-semibold focus:outline-none"
                              />
                            </td>

                            {/* Category */}
                            <td className="py-2.5 px-3">
                              <select
                                value={item.category || 'Filtration'}
                                onChange={e => handleUpdateItem(idx, 'category', e.target.value)}
                                className="bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] text-slate-300 focus:outline-none focus:border-amber-500"
                              >
                                <option value="Filtration">Filtration</option>
                                <option value="Freinage">Freinage</option>
                                <option value="Moteur">Moteur</option>
                                <option value="Hydraulique">Hydraulique</option>
                                <option value="Électricité">Électricité</option>
                                <option value="Pneumatique">Pneumatique</option>
                                <option value="Lubrifiants & Fluides">Lubrifiants</option>
                                <option value="Transmission">Transmission</option>
                                <option value="Main d'œuvre">Main d'œuvre</option>
                                <option value="Consommables">Consommables</option>
                              </select>
                            </td>

                            {/* Quantity */}
                            <td className="py-2.5 px-3 text-right">
                              <input 
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={e => handleUpdateItem(idx, 'quantity', Number(e.target.value))}
                                className="w-16 bg-slate-800/80 border border-slate-700 rounded px-1.5 py-0.5 text-right text-white font-mono focus:outline-none focus:border-amber-500"
                              />
                            </td>

                            {/* Unit Price */}
                            <td className="py-2.5 px-3 text-right">
                              <input 
                                type="number"
                                step="0.5"
                                value={item.unitPrice}
                                onChange={e => handleUpdateItem(idx, 'unitPrice', Number(e.target.value))}
                                className="w-20 bg-slate-800/80 border border-slate-700 rounded px-1.5 py-0.5 text-right text-white font-mono focus:outline-none focus:border-amber-500"
                              />
                            </td>

                            {/* Line Total */}
                            <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-200">
                              {formatDH(item.totalPrice)}
                            </td>

                            {/* Delete */}
                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(idx)}
                                className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                                title="Supprimer la ligne"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Action Choices: Stock vs Work Order */}
              <div className="p-4 rounded-xl bg-slate-800/20 border border-slate-800 space-y-3">
                <div className="font-semibold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-500" />
                  <span>Comment souhaitez-vous imputer cette facture scannée ?</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Option 1: Entrée en stock */}
                  <div 
                    onClick={() => setTargetAction('stock')}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      targetAction === 'stock'
                        ? 'bg-amber-500/10 border-amber-500/50'
                        : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-white mb-1">
                      <input 
                        type="radio" 
                        name="targetAction" 
                        checked={targetAction === 'stock'} 
                        onChange={() => setTargetAction('stock')} 
                        className="text-amber-500"
                      />
                      <span>Réapprovisionner le Magasin / Stock</span>
                    </div>
                    <p className="text-slate-400 text-[11px] pl-5 leading-relaxed">
                      Incrémente le stock pour les pièces existantes ou crée de nouvelles fiches de pièces détachées avec les prix unitaires extraits.
                    </p>
                  </div>

                  {/* Option 2: Imputer à un OT */}
                  <div 
                    onClick={() => setTargetAction('reparation')}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      targetAction === 'reparation'
                        ? 'bg-amber-500/10 border-amber-500/50'
                        : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-white mb-1">
                      <input 
                        type="radio" 
                        name="targetAction" 
                        checked={targetAction === 'reparation'} 
                        onChange={() => setTargetAction('reparation')} 
                        className="text-amber-500"
                      />
                      <span>Créer un Ordre de Travail (OT) Réparation</span>
                    </div>
                    <p className="text-slate-400 text-[11px] pl-5 leading-relaxed">
                      Crée une intervention liée à un engin / véhicule avec les pièces et la main d'œuvre de la facture imputées à son dossier d'entretien.
                    </p>

                    {targetAction === 'reparation' && (
                      <div className="mt-3 pl-5">
                        <label className="block text-[11px] text-slate-300 font-medium mb-1">
                          Sélectionner le matériel concerné :
                        </label>
                        <select
                          value={selectedVehiculeId}
                          onChange={e => setSelectedVehiculeId(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                        >
                          {vehicules.map(v => (
                            <option key={v.id} value={v.id}>
                              {v.immatriculation} - {v.marque} {v.modele} ({v.siteAffectation})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div>
            {scannedData && (
              <button
                type="button"
                onClick={() => {
                  setScannedData(null);
                  setSuccessNotice(null);
                  setFile(null);
                  setPreviewUrl(null);
                }}
                className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Scanner une autre facture</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Fermer
            </button>

            {scannedData && targetAction === 'stock' && (
              <button
                type="button"
                onClick={handleCommitToStock}
                className="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Layers className="w-4 h-4" />
                <span>Valider l'entrée en stock</span>
              </button>
            )}

            {scannedData && targetAction === 'reparation' && (
              <button
                type="button"
                onClick={handleCommitToOT}
                className="px-4 py-2 text-xs font-semibold bg-blue-500 hover:bg-blue-400 text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Wrench className="w-4 h-4" />
                <span>Créer l'Ordre de Travail</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
