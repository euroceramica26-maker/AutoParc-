import { ScannedInvoice, ScannedInvoiceItem } from '../types/invoice';
import { PieceRechange } from '../types/fleet';

export const SAMPLE_INVOICES: { title: string; subtitle: string; invoice: ScannedInvoice }[] = [
  {
    title: 'Facture Filtration & Fluides - AutoDistribution Maroc',
    subtitle: 'Filtres à huile, filtres à gazole et liquide de refroidissement',
    invoice: {
      id: 'inv_sample_01',
      vendor: 'AutoDistribution Maroc SARL',
      invoiceNumber: 'FAC-2026-0892',
      date: new Date().toISOString().split('T')[0],
      subtotalAmount: 3850,
      taxAmount: 770,
      totalAmount: 4620,
      currency: 'DH',
      category: 'Pièces de rechange & Filtration',
      notes: 'Livraison express atelier central - Réf Bon de commande BC-4412',
      scannedAt: new Date().toISOString(),
      items: [
        {
          id: 'item_s1_1',
          description: 'Filtre à Huile Moteur Poids Lourd',
          reference: 'LF16015',
          quantity: 10,
          unitPrice: 120,
          totalPrice: 1200,
          category: 'Filtration'
        },
        {
          id: 'item_s1_2',
          description: 'Cartouche Filtre à Gazole Séparateur',
          reference: 'FS19732',
          quantity: 6,
          unitPrice: 210,
          totalPrice: 1260,
          category: 'Filtration'
        },
        {
          id: 'item_s1_3',
          description: 'Liquide de Refroidissement Organique 20L',
          reference: 'FLUID-REF-20L',
          quantity: 4,
          unitPrice: 347.5,
          totalPrice: 1390,
          category: 'Lubrifiants & Fluides'
        }
      ]
    }
  },
  {
    title: 'Facture Freinage & Révision Atelier - Bendix & Knorr Express',
    subtitle: 'Plaquettes de frein, disques ventilés et main d\'œuvre de montage',
    invoice: {
      id: 'inv_sample_02',
      vendor: 'Bendix & Knorr Truck Parts SARL',
      invoiceNumber: 'BK-5541-MA',
      date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
      subtotalAmount: 7200,
      taxAmount: 1440,
      totalAmount: 8640,
      currency: 'DH',
      category: 'Freinage & Révision Essieu',
      notes: 'Matériel homologué constructeur - Garantie pièces 12 mois',
      scannedAt: new Date().toISOString(),
      items: [
        {
          id: 'item_s2_1',
          description: 'Jeu de Plaquettes de Frein Avant PL Actros',
          reference: 'PLAQ-FR-02',
          quantity: 4,
          unitPrice: 650,
          totalPrice: 2600,
          category: 'Freinage'
        },
        {
          id: 'item_s2_2',
          description: 'Disque de Frein Ventilé Essieu Avant 430mm',
          reference: 'DISQ-430-VENT',
          quantity: 2,
          unitPrice: 1800,
          totalPrice: 3600,
          category: 'Freinage'
        },
        {
          id: 'item_s2_3',
          description: 'Forfait Main d\'œuvre Dépose & Repose Étriers',
          reference: 'MO-FREIN-01',
          quantity: 4,
          unitPrice: 250,
          totalPrice: 1000,
          category: 'Main d\'œuvre'
        }
      ]
    }
  },
  {
    title: 'Facture Pneumatiques & Valves - Michelin Poids Lourds Maroc',
    subtitle: 'Pneus 315/80 R22.5 et valves renforcées chantier',
    invoice: {
      id: 'inv_sample_03',
      vendor: 'Comptoir Marocain du Pneu (Michelin & Bridgestone)',
      invoiceNumber: 'CMP-2026-904',
      date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
      subtotalAmount: 18400,
      taxAmount: 3680,
      totalAmount: 22080,
      currency: 'DH',
      category: 'Pneumatique',
      notes: 'Pneus renforcés chantier carrière - Pression contrôlée à 9 bars',
      scannedAt: new Date().toISOString(),
      items: [
        {
          id: 'item_s3_1',
          description: 'Pneu Chantier Mixte 315/80 R22.5 X Works',
          reference: 'PNEU-315-80-22.5',
          quantity: 4,
          unitPrice: 4500,
          totalPrice: 18000,
          category: 'Pneumatique'
        },
        {
          id: 'item_s3_2',
          description: 'Valves métalliques blindées pour jantes acier',
          reference: 'VALV-MET-HP',
          quantity: 4,
          unitPrice: 100,
          totalPrice: 400,
          category: 'Pneumatique'
        }
      ]
    }
  }
];

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

export function matchItemsWithExistingPieces(
  items: ScannedInvoiceItem[],
  existingPieces: PieceRechange[]
): ScannedInvoiceItem[] {
  return items.map(item => {
    const itemRef = (item.reference || '').trim().toLowerCase();
    const itemDesc = (item.description || '').trim().toLowerCase();

    const matched = existingPieces.find(p => {
      const pRef = p.reference.toLowerCase();
      const pDesig = p.designation.toLowerCase();

      // Match exact or contains reference
      if (itemRef && (pRef === itemRef || pRef.includes(itemRef) || itemRef.includes(pRef))) {
        return true;
      }

      // Match designation keywords
      if (itemDesc && pDesig && (itemDesc.includes(pDesig) || pDesig.includes(itemDesc))) {
        return true;
      }

      return false;
    });

    if (matched) {
      return {
        ...item,
        matchedPieceId: matched.id,
        matchedPieceName: `${matched.reference} - ${matched.designation}`,
        category: item.category || matched.categorie
      };
    }

    return item;
  });
}

export async function scanInvoiceWithOCR(
  fileOrBase64: File | string,
  mimeType: string = 'image/jpeg',
  existingPieces: PieceRechange[] = []
): Promise<ScannedInvoice> {
  let base64String: string;
  let detectedMime = mimeType;

  if (typeof fileOrBase64 === 'string') {
    base64String = fileOrBase64;
  } else {
    base64String = await fileToBase64(fileOrBase64);
    detectedMime = fileOrBase64.type || mimeType;
  }

  const response = await fetch('/api/ocr-invoice', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageBase64: base64String,
      mimeType: detectedMime,
    }),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.error || `Erreur serveur lors de l'analyse OCR (${response.status})`);
  }

  const resJson = await response.json();
  if (!resJson.success || !resJson.data) {
    throw new Error(resJson.error || "L'analyse OCR n'a renvoyé aucun résultat structuré.");
  }

  const raw = resJson.data;

  const rawItems: any[] = Array.isArray(raw.items) ? raw.items : [];
  const mappedItems: ScannedInvoiceItem[] = rawItems.map((it, idx) => ({
    id: `scanned_item_${Date.now()}_${idx}`,
    description: String(it.description || 'Article sans désignation').trim(),
    reference: it.reference ? String(it.reference).trim() : undefined,
    quantity: Number(it.quantity) || 1,
    unitPrice: Number(it.unitPrice) || 0,
    totalPrice: Number(it.totalPrice) || (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0),
    category: it.category ? String(it.category).trim() : 'Autre',
  }));

  const matchedItems = matchItemsWithExistingPieces(mappedItems, existingPieces);

  const scannedInvoice: ScannedInvoice = {
    id: `inv_${Date.now()}`,
    vendor: String(raw.vendor || 'Fournisseur non identifié').trim(),
    invoiceNumber: raw.invoiceNumber ? String(raw.invoiceNumber).trim() : undefined,
    date: raw.date ? String(raw.date).trim() : new Date().toISOString().split('T')[0],
    subtotalAmount: typeof raw.subtotalAmount === 'number' ? raw.subtotalAmount : undefined,
    taxAmount: typeof raw.taxAmount === 'number' ? raw.taxAmount : undefined,
    totalAmount: typeof raw.totalAmount === 'number' ? raw.totalAmount : mappedItems.reduce((s, i) => s + i.totalPrice, 0),
    currency: String(raw.currency || 'DH').trim(),
    category: raw.category ? String(raw.category).trim() : 'Pièces & Maintenance',
    notes: raw.notes ? String(raw.notes).trim() : undefined,
    items: matchedItems,
    filePreviewUrl: base64String.startsWith('data:') ? base64String : undefined,
    scannedAt: new Date().toISOString(),
  };

  return scannedInvoice;
}
