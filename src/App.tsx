import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle } from 'lucide-react';
import { FleetProvider, useFleet } from './context/FleetContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { VehiclesView } from './components/vehicles/VehiclesView';
import { VehicleModal } from './components/vehicles/VehicleModal';
import { VehicleDetailModal } from './components/vehicles/VehicleDetailModal';
import { ImportExcelVehiclesModal } from './components/vehicles/ImportExcelVehiclesModal';
import { PartsView } from './components/parts/PartsView';
import { PartModal } from './components/parts/PartModal';
import { RestockModal } from './components/parts/RestockModal';
import { ImportExcelPartsModal } from './components/parts/ImportExcelPartsModal';
import { RepairsView } from './components/repairs/RepairsView';
import { RepairModal } from './components/repairs/RepairModal';
import { RepairDetailModal } from './components/repairs/RepairDetailModal';
import { MaintenanceAlertsView } from './components/maintenance/MaintenanceAlertsView';
import { NewAlertModal } from './components/maintenance/NewAlertModal';
import { ActivityReportView } from './components/reports/ActivityReportView';
import { UsersView } from './components/users/UsersView';
import { UserModal } from './components/users/UserModal';
import { GoogleDriveView } from './components/drive/GoogleDriveView';
import { LoginModal } from './components/auth/LoginModal';
import { SystemDataModal } from './components/common/SystemDataModal';
import { InvoiceScannerModal } from './components/invoices/InvoiceScannerModal';
import { Vehicule, PieceRechange, Reparation, FleetUser } from './types/fleet';
import { ScannedInvoice } from './types/invoice';

function FleetApp() {
  const { 
    currentUser,
    vehicules,
    addVehicule, 
    updateVehicule, 
    addPiece, 
    updatePiece, 
    addReparation, 
    updateReparation,
    addUser,
    updateUser
  } = useFleet();

  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isInvoiceScannerOpen, setIsInvoiceScannerOpen] = useState(false);

  // Redirection automatique si un utilisateur non-admin tente d'accéder au module Utilisateurs
  useEffect(() => {
    if (currentUser && currentUser.role !== 'ADMIN' && currentTab === 'utilisateurs') {
      setCurrentTab('dashboard');
    }
  }, [currentUser, currentTab]);

  // Modals state
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicule, setEditingVehicule] = useState<Vehicule | null>(null);
  const [detailedVehicule, setDetailedVehicule] = useState<Vehicule | null>(null);
  const [isImportVehiclesOpen, setIsImportVehiclesOpen] = useState(false);

  const [isPartModalOpen, setIsPartModalOpen] = useState(false);
  const [editingPiece, setEditingPiece] = useState<PieceRechange | null>(null);
  const [restockPiece, setRestockPiece] = useState<PieceRechange | null>(null);
  const [isImportExcelOpen, setIsImportExcelOpen] = useState(false);

  const [isRepairModalOpen, setIsRepairModalOpen] = useState(false);
  const [editingReparation, setEditingReparation] = useState<Reparation | null>(null);
  const [detailedReparation, setDetailedReparation] = useState<Reparation | null>(null);
  const [preselectedVehiculeId, setPreselectedVehiculeId] = useState<string | undefined>(undefined);

  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [isSystemModalOpen, setIsSystemModalOpen] = useState(false);

  // User management & auth modal state
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<FleetUser | null>(null);

  // Handlers pour Véhicules
  const handleOpenNewVehicule = () => {
    setEditingVehicule(null);
    setIsVehicleModalOpen(true);
  };

  const handleOpenEditVehicule = (v: Vehicule) => {
    setEditingVehicule(v);
    setIsVehicleModalOpen(true);
  };

  const handleSaveVehicule = (data: Omit<Vehicule, 'id'>) => {
    if (editingVehicule) {
      updateVehicule(editingVehicule.id, data);
    } else {
      addVehicule(data);
    }
  };

  // Handlers pour Pièces
  const handleOpenNewPiece = () => {
    setEditingPiece(null);
    setIsPartModalOpen(true);
  };

  const handleOpenEditPiece = (p: PieceRechange) => {
    setEditingPiece(p);
    setIsPartModalOpen(true);
  };

  const handleSavePiece = (data: Omit<PieceRechange, 'id'>) => {
    if (editingPiece) {
      updatePiece(editingPiece.id, data);
    } else {
      addPiece(data);
    }
  };

  // Handlers pour Ordres de Travail / Réparations
  const handleOpenNewOT = (vehiculeId?: string) => {
    setEditingReparation(null);
    setPreselectedVehiculeId(vehiculeId);
    setIsRepairModalOpen(true);
  };

  const handleOpenEditOT = (r: Reparation) => {
    setEditingReparation(r);
    setPreselectedVehiculeId(r.vehiculeId);
    setIsRepairModalOpen(true);
  };

  const handleSaveOT = (data: Omit<Reparation, 'id' | 'numeroOT' | 'coutPieces' | 'coutTotal'>) => {
    if (editingReparation) {
      updateReparation(editingReparation.id, data);
    } else {
      addReparation(data);
    }
  };

  // Handler pour convertir une facture scannée en Ordre de Travail (OT)
  const handleApplyInvoiceToOT = (invoice: ScannedInvoice, vehiculeId?: string) => {
    const targetVehiculeId = vehiculeId || (vehicules[0]?.id || '');
    const v = vehicules.find(item => item.id === targetVehiculeId);
    
    const prefilledPieces = invoice.items
      .filter(item => !item.category?.toLowerCase().includes('main d\'œuvre'))
      .map(item => ({
        pieceId: item.matchedPieceId || `temp_${Date.now()}_${Math.random()}`,
        reference: item.reference || 'REF-SCAN',
        designation: item.description,
        quantite: Number(item.quantity) || 1,
        prixUnitaire: Number(item.unitPrice) || 0,
        prixTotal: Number(item.totalPrice) || 0
      }));

    const laborItem = invoice.items.find(item => 
      item.category?.toLowerCase().includes('main d\'œuvre') ||
      item.description.toLowerCase().includes('main d\'oeuvre') ||
      item.description.toLowerCase().includes('pose') ||
      item.description.toLowerCase().includes('forfait')
    );

    const laborCost = laborItem ? Number(laborItem.totalPrice) : 150;
    const piecesCost = prefilledPieces.reduce((sum, p) => sum + p.prixTotal, 0);

    const dummyReparation: Reparation = {
      id: '',
      numeroOT: '',
      vehiculeId: targetVehiculeId,
      titre: `Entretien suite Facture ${invoice.invoiceNumber || 'sans n°'} (${invoice.vendor})`,
      description: `Prestation & pièces selon facture ${invoice.invoiceNumber || ''} de ${invoice.vendor} du ${invoice.date}.\n${invoice.notes || ''}`.trim(),
      type: 'CORRECTIVE',
      priorite: 'NORMALE',
      statut: 'PLANIFIEE',
      technicien: invoice.vendor || 'Atelier Externe',
      dateDeclaration: invoice.date || new Date().toISOString().split('T')[0],
      datePrevue: invoice.date || new Date().toISOString().split('T')[0],
      compteurReleve: v?.compteurActuel || 0,
      piecesUtilisees: prefilledPieces,
      coutPieces: piecesCost,
      coutMainOeuvre: laborCost,
      coutTotal: piecesCost + laborCost,
      remarques: `Facture scannée OCR : ${invoice.vendor} (Total : ${invoice.totalAmount} ${invoice.currency})`
    };

    setEditingReparation(dummyReparation);
    setPreselectedVehiculeId(targetVehiculeId);
    setCurrentTab('reparations');
    setIsRepairModalOpen(true);
  };

  // Handlers pour Utilisateurs
  const handleOpenNewUser = () => {
    setEditingUser(null);
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (user: FleetUser) => {
    setEditingUser(user);
    setIsUserModalOpen(true);
  };

  const handleSaveUser = (data: Omit<FleetUser, 'id' | 'dateCreation'>) => {
    if (editingUser) {
      updateUser(editingUser.id, data);
    } else {
      addUser(data);
    }
  };

  if (!currentUser) {
    return <LoginModal isOpen={true} isGate={true} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar with 3 zones */}
      <Header
        currentTab={currentTab}
        onOpenNewOT={() => handleOpenNewOT()}
        onOpenNewVehicule={handleOpenNewVehicule}
        onOpenSystemModal={() => setIsSystemModalOpen(true)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onSelectTab={setCurrentTab}
        onOpenScanInvoice={() => setIsInvoiceScannerOpen(true)}
      />

      {/* Workspace Area: Sidebar + Main Content Viewport */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
        />

        {/* Main Viewport Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              onSelectTab={setCurrentTab}
              onOpenNewOT={() => handleOpenNewOT()}
              onOpenNewVehicule={handleOpenNewVehicule}
              onOpenRestockPiece={p => setRestockPiece(p)}
              onViewVehiculeDetail={v => setDetailedVehicule(v)}
              onOpenScanInvoice={() => setIsInvoiceScannerOpen(true)}
            />
          )}

          {currentTab === 'vehicules' && (
            <VehiclesView
              onOpenAddModal={handleOpenNewVehicule}
              onOpenEditModal={handleOpenEditVehicule}
              onOpenDetailModal={v => setDetailedVehicule(v)}
              onCreateOTForVehicle={vId => handleOpenNewOT(vId)}
              onOpenImportExcel={() => setIsImportVehiclesOpen(true)}
            />
          )}

          {currentTab === 'pieces' && (
            <PartsView
              onOpenAddModal={handleOpenNewPiece}
              onOpenEditModal={handleOpenEditPiece}
              onOpenRestockModal={p => setRestockPiece(p)}
              onOpenImportExcel={() => setIsImportExcelOpen(true)}
              onOpenScanInvoice={() => setIsInvoiceScannerOpen(true)}
            />
          )}

          {currentTab === 'reparations' && (
            <RepairsView
              onOpenAddModal={() => handleOpenNewOT()}
              onOpenEditModal={handleOpenEditOT}
              onOpenDetailModal={r => setDetailedReparation(r)}
              onOpenScanInvoice={() => setIsInvoiceScannerOpen(true)}
            />
          )}

          {currentTab === 'maintenance' && (
            <MaintenanceAlertsView
              onOpenNewAlertModal={() => setIsAlertModalOpen(true)}
              onNavigateToOT={() => setCurrentTab('reparations')}
            />
          )}

          {currentTab === 'drive' && (
            <GoogleDriveView />
          )}

          {currentTab === 'rapports' && (
            <ActivityReportView />
          )}

          {currentTab === 'utilisateurs' && (
            currentUser?.role === 'ADMIN' ? (
              <UsersView 
                onOpenAddUser={handleOpenNewUser}
                onOpenEditUser={handleOpenEditUser}
              />
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[55vh] text-center p-8 bg-slate-900/40 border border-slate-800 rounded-2xl">
                <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mb-4">
                  <Shield className="w-8 h-8" />
                </div>
                <h2 className="text-base font-bold text-white mb-2">
                  Accès Restreint au Compte Administrateur
                </h2>
                <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
                  Le module de gestion des utilisateurs et des droits d'accès est strictement réservé au compte Administrateur. Votre profil actuel ({currentUser?.nom} - {currentUser?.role}) ne dispose pas des droits nécessaires.
                </p>
                <button
                  onClick={() => setCurrentTab('dashboard')}
                  className="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors cursor-pointer shadow-sm"
                >
                  Retourner au Tableau de Bord
                </button>
              </div>
            )
          )}
        </main>
      </div>

      {/* Global Modals */}
      <VehicleModal
        vehicule={editingVehicule}
        isOpen={isVehicleModalOpen}
        onClose={() => {
          setIsVehicleModalOpen(false);
          setEditingVehicule(null);
        }}
        onSave={handleSaveVehicule}
      />

      <VehicleDetailModal
        vehicule={detailedVehicule}
        isOpen={!!detailedVehicule}
        onClose={() => setDetailedVehicule(null)}
        onEdit={v => {
          setDetailedVehicule(null);
          handleOpenEditVehicule(v);
        }}
        onCreateOTForVehicle={vId => {
          setDetailedVehicule(null);
          handleOpenNewOT(vId);
        }}
      />

      <ImportExcelVehiclesModal
        isOpen={isImportVehiclesOpen}
        onClose={() => setIsImportVehiclesOpen(false)}
      />

      <PartModal
        piece={editingPiece}
        isOpen={isPartModalOpen}
        onClose={() => {
          setIsPartModalOpen(false);
          setEditingPiece(null);
        }}
        onSave={handleSavePiece}
      />

      <RestockModal
        piece={restockPiece}
        isOpen={!!restockPiece}
        onClose={() => setRestockPiece(null)}
      />

      <ImportExcelPartsModal
        isOpen={isImportExcelOpen}
        onClose={() => setIsImportExcelOpen(false)}
      />

      <RepairModal
        reparation={editingReparation}
        defaultVehiculeId={preselectedVehiculeId}
        isOpen={isRepairModalOpen}
        onClose={() => {
          setIsRepairModalOpen(false);
          setEditingReparation(null);
          setPreselectedVehiculeId(undefined);
        }}
        onSave={handleSaveOT}
      />

      <RepairDetailModal
        reparation={detailedReparation}
        isOpen={!!detailedReparation}
        onClose={() => setDetailedReparation(null)}
        onEdit={r => {
          setDetailedReparation(null);
          handleOpenEditOT(r);
        }}
      />

      <NewAlertModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
      />

      <UserModal
        user={editingUser}
        isOpen={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false);
          setEditingUser(null);
        }}
        onSave={handleSaveUser}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      <SystemDataModal
        isOpen={isSystemModalOpen}
        onClose={() => setIsSystemModalOpen(false)}
      />

      {/* Modal Scanner Facture OCR IA */}
      <InvoiceScannerModal
        isOpen={isInvoiceScannerOpen}
        onClose={() => setIsInvoiceScannerOpen(false)}
        onApplyToOT={handleApplyInvoiceToOT}
      />
    </div>
  );
}

export default function App() {
  return (
    <FleetProvider>
      <FleetApp />
    </FleetProvider>
  );
}
