import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import { WaitingScreen } from './components/WaitingScreen.tsx';
import { Navigation, NavigationView } from './components/Navigation.tsx';
import { DashboardOverview } from './components/DashboardOverview.tsx';
import { VeylorFlow } from './components/VeylorFlow.tsx';
import { ProjectsView } from './components/ProjectsView.tsx';
import { UpdatesView } from './components/UpdatesView.tsx';
import { TeamManagement } from './components/TeamManagement.tsx';
import { CodeStudio } from './components/CodeStudio.tsx';
import { Messenger } from './components/Messenger.tsx';
import { DocumentationView } from './components/DocumentationView.tsx';
import { SystemDiagnostics } from './components/SystemDiagnostics.tsx';
import { Shield } from 'lucide-react';

function AppContent() {
  const { user, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<NavigationView>('dashboard');
  const [snippetForChat, setSnippetForChat] = useState<{ code: string; language: string; name: string } | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center font-black text-xl text-white shadow-xl shadow-indigo-600/30 animate-pulse">
          V
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
          <Shield className="w-4 h-4 animate-spin" />
          Проверка прав закрытого контура Veylor Labs...
        </div>
      </div>
    );
  }

  // 1. Unauthenticated Visitor: Public Landing Page Only
  if (!user) {
    return <LandingPage />;
  }

  // 2. Authenticated user without team membership: Strictly "Ожидание приглашения"
  if (user.status !== 'active_member' || !user.role) {
    return <WaitingScreen />;
  }

  // 3. Active Team Member or Owner: Internal Veylor Labs Space
  return (
    <Navigation
      currentView={currentView}
      onNavigate={(view) => {
        // Enforce owner role check for team management and diagnostics tabs
        if ((view === 'team' || view === 'diagnostics') && user.role !== 'owner') {
          setCurrentView('dashboard');
          return;
        }
        setCurrentView(view);
      }}
    >
      {currentView === 'dashboard' && <DashboardOverview onNavigate={setCurrentView} />}
      {currentView === 'projects' && <ProjectsView onNavigateToCode={() => setCurrentView('code')} />}
      {currentView === 'code' && (
        <CodeStudio
          onShareToChat={(snippet) => {
            setSnippetForChat(snippet);
            setCurrentView('chat');
          }}
        />
      )}
      {currentView === 'chat' && (
        <Messenger
          initialCodeSnippet={snippetForChat}
          onOpenCodeInStudio={() => {
            setCurrentView('code');
          }}
          onNavigateToTeam={() => {
            setCurrentView('team');
          }}
        />
      )}
      {currentView === 'flow' && <VeylorFlow />}
      {currentView === 'docs' && <DocumentationView />}
      {currentView === 'updates' && <UpdatesView />}
      {currentView === 'team' && (
        user.role === 'owner' ? <TeamManagement /> : <DashboardOverview onNavigate={setCurrentView} />
      )}
      {currentView === 'diagnostics' && (
        user.role === 'owner' ? <SystemDiagnostics /> : <DashboardOverview onNavigate={setCurrentView} />
      )}
    </Navigation>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
