import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Client GoogleGenAI avec en-tête User-Agent standard
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Endpoint OCR pour analyse de factures de pièces & réparations
app.post('/api/ocr-invoice', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ 
        success: false, 
        error: 'Aucune image ou document transmis (imageBase64 requis).' 
      });
    }

    const base64Data = imageBase64.replace(/^data:[^;]+;base64,/, '');

    const prompt = `Tu es un assistant expert en gestion de parc automobile, engins TP et maintenance de flotte.
Analyse cette facture, bon de livraison ou reçu d'achat (pièces détachées, entretien, pneumatique, réparations).
Extrais avec une rigueur absolue toutes les informations utiles sous forme JSON structuré :
- Fournisseur / Établissement (vendor)
- Numéro de facture / Bon de livraison (invoiceNumber)
- Date de facture (date, format YYYY-MM-DD idéalement)
- Montant Total TTC (totalAmount, nombre)
- Montant Total HT (subtotalAmount, nombre si visible)
- Montant TVA (taxAmount, nombre si visible)
- Devise (currency, par défaut 'DH' ou 'EUR')
- Catégorie principale (category, ex: "Pièces de rechange", "Entretien mécanique", "Pneumatiques", "Lubrifiants", "Carrosserie")
- Remarques ou mentions utiles (notes)
- Liste détaillée des articles / prestations (items) :
    - description : intitulé clair et précis de la pièce ou intervention
    - reference : code pièce ou référence OEM / constructeur si visible (ex: "LF16015", "W940/25", "1109AY")
    - quantity : quantité facturée (nombre)
    - unitPrice : prix unitaire HT ou TTC selon facture (nombre)
    - totalPrice : prix total de la ligne (nombre)
    - category : suggestion parmi (Filtration, Freinage, Moteur, Hydraulique, Électricité, Pneumatique, Lubrifiants & Fluides, Transmission, Main d'œuvre, Consommables, Autre)

Assure-toi que les montants et quantités sont des nombres exacts. Si un montant HT n'est pas explicite, déduis-le ou laisse subtotalAmount égal à totalAmount.`;

    const modelsToTry = ['gemini-3.8-flash', 'gemini-flash-latest'];
    let lastError: any = null;
    let response: any = null;

    for (const model of modelsToTry) {
      try {
        response = await ai.models.generateContent({
          model,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType,
                    data: base64Data,
                  },
                },
                {
                  text: prompt,
                },
              ],
            },
          ],
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                vendor: { type: Type.STRING },
                invoiceNumber: { type: Type.STRING },
                date: { type: Type.STRING },
                totalAmount: { type: Type.NUMBER },
                subtotalAmount: { type: Type.NUMBER },
                taxAmount: { type: Type.NUMBER },
                currency: { type: Type.STRING },
                category: { type: Type.STRING },
                notes: { type: Type.STRING },
                items: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      description: { type: Type.STRING },
                      reference: { type: Type.STRING },
                      quantity: { type: Type.NUMBER },
                      unitPrice: { type: Type.NUMBER },
                      totalPrice: { type: Type.NUMBER },
                      category: { type: Type.STRING },
                    },
                    required: ['description', 'quantity', 'unitPrice', 'totalPrice'],
                  },
                },
              },
              required: ['vendor', 'totalAmount', 'items'],
            },
          },
        });
        if (response) break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Modèle ${model} indisponible, tentative de secours...`);
      }
    }

    if (!response) {
      throw lastError || new Error('Les modèles IA sont temporairement occupés.');
    }

    const rawText = response.text || '{}';
    let parsedData = {};
    try {
      parsedData = JSON.parse(rawText);
    } catch {
      parsedData = {
        vendor: 'Fournisseur Inconnu',
        date: new Date().toISOString().split('T')[0],
        totalAmount: 0,
        currency: 'DH',
        items: [],
      };
    }

    return res.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    console.error('Erreur OCR Facture:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Erreur lors de l\'analyse de la facture par IA.',
    });
  }
});

// Middlewares Vite pour le développement ou fichiers statiques en production
if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(port, '0.0.0.0', () => {
  console.log(`AutoParc Pro Server listening on http://0.0.0.0:${port}`);
});
