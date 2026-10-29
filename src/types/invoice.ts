export interface ScannedInvoiceItem {
  id: string;
  description: string;
  reference?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category?: string;
  matchedPieceId?: string; // ID of existing piece if reference or name matches
  matchedPieceName?: string;
}

export interface ScannedInvoice {
  id: string;
  vendor: string;
  invoiceNumber?: string;
  date: string;
  subtotalAmount?: number;
  taxAmount?: number;
  totalAmount: number;
  currency: string;
  category?: string;
  notes?: string;
  items: ScannedInvoiceItem[];
  filePreviewUrl?: string;
  scannedAt: string;
}
