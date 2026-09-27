import React, { useState, useEffect } from 'react';
import { CRMStorageService } from './services/crmStorage';
import { User, Lead, Project } from './types/crm';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { MobileBottomNav } from './components/MobileView';
import { AuthView } from './components/AuthView';
import { DashboardView } from './components/DashboardView';
import { LeadsPipelineView } from './components/LeadsPipelineView';
import { ProjectAllocationView } from './components/ProjectAllocationView';
import { ProjectsManagementView } from './components/ProjectsManagementView';
import { CalendarView } from './components/CalendarView';
import { FollowUpRemindersView } from './components/FollowUpRemindersView';
import { CommunicationView } from './components/CommunicationView';
import { WonLedgerView } from './components/WonLedgerView';
import { TeamManagementView } from './components/TeamManagementView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { QuickActionsSpeedDial } from './components/QuickActionsSpeedDial';

// Modals
import { NewLeadModal } from './components/modals/NewLeadModal';
import { ImportLeadsModal } from './components/modals/ImportLeadsModal';
import { AllocateProjectModal } from './components/modals/AllocateProjectModal';
import { ScheduleVisitModal } from './components/modals/ScheduleVisitModal';
import { LogCallModal } from './components/modals/LogCallModal';
import { WhatsAppModal } from './components/modals/WhatsAppModal';
import { NewProjectModal } from './components/modals/NewProjectModal';
import { NewUserModal } from './components/modals/NewUserModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    return CRMStorageService.getCurrentUser();
  });
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [, setTick] = useState(0);

  // Modals state
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [isNewUserOpen, setIsNewUserOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);

  // Lead-specific modals
  const [activeLeadForAction, setActiveLeadForAction] = useState<Lead | null>(null);
  const [isScheduleVisitOpen, setIsScheduleVisitOpen] = useState(false);
  const [isLogCallOpen, setIsLogCallOpen] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [isAllocateProjectOpen, setIsAllocateProjectOpen] = useState(false);

  // Subscribe to storage changes
  useEffect(() => {
    const unsubscribe = CRMStorageService.subscribe(() => {
      setTick((t) => t + 1);
      const user = CRMStorageService.getCurrentUser();
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  if (!currentUser) {
    return <AuthView onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  const activeProjects = CRMStorageService.getActiveProjects();
  const allUsers = CRMStorageService.getUsers();
  const activeUsers = CRMStorageService.getActiveUsers();
  const setters = CRMStorageService.getSetters();
  const closers = CRMStorageService.getClosers();

  const handleLogout = () => {
    CRMStorageService.logout();
    setCurrentUser(null);
  };

  const handleSwitchUser = (user: User) => {
    CRMStorageService.setCurrentUser(user);
    setCurrentUser(user);
  };

  const handleScheduleVisit = (lead?: Lead) => {
    setActiveLeadForAction(lead || null);
    setIsScheduleVisitOpen(true);
  };

  const handleLogCall = (lead: Lead) => {
    setActiveLeadForAction(lead);
    setIsLogCallOpen(true);
  };

  const handleWhatsApp = (lead: Lead) => {
    setActiveLeadForAction(lead);
    setIsWhatsAppOpen(true);
  };

  const handleAllocateProject = (lead: Lead) => {
    setActiveLeadForAction(lead);
    setIsAllocateProjectOpen(true);
  };

  const handleEditProject = (proj: Project) => {
    setProjectToEdit(proj);
    setIsNewProjectOpen(true);
  };

  const handleEditUser = (user: User) => {
    setUserToEdit(user);
    setIsNewUserOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans text-slate-800 antialiased">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        currentUser={currentUser}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-6">
        {/* Top Header */}
        <Header
          currentUser={currentUser}
          onOpenNewLead={() => setIsNewLeadOpen(true)}
          onOpenImport={() => setIsImportOpen(true)}
          onOpenNewProject={() => {
            setProjectToEdit(null);
            setIsNewProjectOpen(true);
          }}
          onNavigateToFollowUps={() => setCurrentTab('followups')}
          onSelectLead={(lead) => {
            setCurrentTab('pipeline');
          }}
          onLogout={handleLogout}
          onSwitchUser={handleSwitchUser}
          allUsers={allUsers}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        {/* Tab View Container */}
        <main className="p-4 sm:p-6 max-w-7xl w-full mx-auto flex-1">
          {currentTab === 'dashboard' && (
            <DashboardView
              currentUser={currentUser}
              onOpenNewLead={() => setIsNewLeadOpen(true)}
              onOpenImport={() => setIsImportOpen(true)}
              onOpenNewProject={() => {
                setProjectToEdit(null);
                setIsNewProjectOpen(true);
              }}
              onNavigateTab={(t) => setCurrentTab(t)}
              onScheduleVisit={handleScheduleVisit}
              onLogCall={handleLogCall}
              onWhatsApp={handleWhatsApp}
            />
          )}

          {currentTab === 'pipeline' && (
            <LeadsPipelineView
              currentUser={currentUser}
              onOpenNewLead={() => setIsNewLeadOpen(true)}
              onOpenImport={() => setIsImportOpen(true)}
              onScheduleVisit={handleScheduleVisit}
              onLogCall={handleLogCall}
              onWhatsApp={handleWhatsApp}
              onAllocateProject={handleAllocateProject}
              activeProjects={activeProjects}
              activeUsers={activeUsers}
            />
          )}

          {currentTab === 'allocations' && (
            <ProjectAllocationView
              currentUser={currentUser}
              onAllocateNew={handleAllocateProject}
              onOpenNewLead={() => setIsNewLeadOpen(true)}
              activeProjects={activeProjects}
              activeUsers={activeUsers}
            />
          )}

          {currentTab === 'calendar' && (
            <CalendarView
              currentUser={currentUser}
              onOpenScheduleModal={() => handleScheduleVisit()}
            />
          )}

          {currentTab === 'followups' && (
            <FollowUpRemindersView
              currentUser={currentUser}
              onLogCall={handleLogCall}
              onWhatsApp={handleWhatsApp}
              onScheduleVisit={handleScheduleVisit}
            />
          )}

          {currentTab === 'communication' && (
            <CommunicationView
              currentUser={currentUser}
              onOpenNewLead={() => setIsNewLeadOpen(true)}
            />
          )}

          {currentTab === 'won-ledger' && (
            <WonLedgerView currentUser={currentUser} />
          )}

          {currentTab === 'projects' && (
            <ProjectsManagementView
              currentUser={currentUser}
              onOpenNewProject={() => {
                setProjectToEdit(null);
                setIsNewProjectOpen(true);
              }}
              onEditProject={handleEditProject}
            />
          )}

          {currentTab === 'team' && (
            <TeamManagementView
              currentUser={currentUser}
              onOpenNewUser={() => {
                setUserToEdit(null);
                setIsNewUserOpen(true);
              }}
              onEditUser={handleEditUser}
            />
          )}

          {currentTab === 'reports' && (
            <ReportsView
              currentUser={currentUser}
              activeProjects={activeProjects}
              activeUsers={activeUsers}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              currentUser={currentUser}
              onRefreshAll={() => setTick((t) => t + 1)}
            />
          )}
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          currentUser={currentUser}
          onOpenNewLead={() => setIsNewLeadOpen(true)}
          onOpenQuickCall={() => {
            const firstLead = CRMStorageService.getVisibleLeads(currentUser)[0];
            if (firstLead) handleLogCall(firstLead);
            else setIsNewLeadOpen(true);
          }}
          onOpenWhatsApp={() => {
            const firstLead = CRMStorageService.getVisibleLeads(currentUser)[0];
            if (firstLead) handleWhatsApp(firstLead);
            else setIsNewLeadOpen(true);
          }}
          onScheduleVisit={() => handleScheduleVisit()}
          onOpenImport={() => setIsImportOpen(true)}
        />
      </div>

      {/* Global Modals */}
      <NewLeadModal
        isOpen={isNewLeadOpen}
        onClose={() => setIsNewLeadOpen(false)}
        onLeadCreated={(lead) => {
          setIsNewLeadOpen(false);
        }}
        activeProjects={activeProjects}
        setters={setters}
        closers={closers}
        currentUser={currentUser}
      />

      <ImportLeadsModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportComplete={() => {
          setCurrentTab('pipeline');
        }}
        currentUser={currentUser}
      />

      {activeLeadForAction && (
        <>
          <AllocateProjectModal
            isOpen={isAllocateProjectOpen}
            onClose={() => {
              setIsAllocateProjectOpen(false);
              setActiveLeadForAction(null);
            }}
            lead={activeLeadForAction}
            onAllocated={() => {
              setIsAllocateProjectOpen(false);
              setActiveLeadForAction(null);
            }}
            activeProjects={activeProjects}
            setters={setters}
            closers={closers}
            currentUser={currentUser}
          />

          <LogCallModal
            isOpen={isLogCallOpen}
            onClose={() => {
              setIsLogCallOpen(false);
              setActiveLeadForAction(null);
            }}
            lead={activeLeadForAction}
            onCallLogged={() => {
              setIsLogCallOpen(false);
              setActiveLeadForAction(null);
            }}
            currentUser={currentUser}
          />

          <WhatsAppModal
            isOpen={isWhatsAppOpen}
            onClose={() => {
              setIsWhatsAppOpen(false);
              setActiveLeadForAction(null);
            }}
            lead={activeLeadForAction}
            activeProjects={activeProjects}
            currentUser={currentUser}
          />
        </>
      )}

      <ScheduleVisitModal
        isOpen={isScheduleVisitOpen}
        onClose={() => {
          setIsScheduleVisitOpen(false);
          setActiveLeadForAction(null);
        }}
        lead={activeLeadForAction}
        onVisitScheduled={() => {
          setIsScheduleVisitOpen(false);
          setActiveLeadForAction(null);
        }}
        activeProjects={activeProjects}
        activeUsers={activeUsers}
        currentUser={currentUser}
      />

      <NewProjectModal
        isOpen={isNewProjectOpen}
        onClose={() => {
          setIsNewProjectOpen(false);
          setProjectToEdit(null);
        }}
        projectToEdit={projectToEdit}
        onSaved={() => {
          setIsNewProjectOpen(false);
          setProjectToEdit(null);
        }}
      />

      <NewUserModal
        isOpen={isNewUserOpen}
        onClose={() => {
          setIsNewUserOpen(false);
          setUserToEdit(null);
        }}
        userToEdit={userToEdit}
        onSaved={() => {
          setIsNewUserOpen(false);
          setUserToEdit(null);
        }}
      />

      {/* Floating Speed Dial for Quick Actions (Mobile + Desktop) */}
      <QuickActionsSpeedDial
        currentUser={currentUser}
        onOpenNewLead={() => setIsNewLeadOpen(true)}
        onOpenImport={() => setIsImportOpen(true)}
        onOpenNewProject={() => {
          setProjectToEdit(null);
          setIsNewProjectOpen(true);
        }}
        onScheduleVisit={handleScheduleVisit}
        onLogCall={handleLogCall}
        onWhatsApp={handleWhatsApp}
      />
    </div>
  );
}
