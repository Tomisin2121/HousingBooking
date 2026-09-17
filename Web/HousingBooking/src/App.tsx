import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore, useFeedStore, useUIStore, useChatStore } from './store';
import { authApi, messagesApi } from './api';
import { AppSidebar, BottomNav, FeedColumn, FilterColumn, ListingDetailModal } from './layouts/MainLayout';
import { MapPanel } from './pages/map/MapPage';
import { ConversationList, ChatView } from './pages/chat/ChatPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { LoginPage, SignupPage, ForgotPasswordPage } from './pages/auth/AuthPages';
import { AdminPortal } from './pages/admin/AdminPortal';
import { AgentDashboard } from './pages/agent/AgentDashboard';
import type { Listing } from './types';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const logout = useAuthStore((s) => s.logout);
  const { setConversations, connectSocket, disconnectSocket } = useChatStore();

  // Restore a persisted session AND make sure the chat socket is wired up
  // (fresh login sets the user immediately, so we connect right away there too).
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    const connect = () => {
      connectSocket(token);
      messagesApi.conversations().then((cd) => {
        if (!cancelled) setConversations(cd.conversations || []);
      });
    };
    if (user) {
      if (!useChatStore.getState().connected) connect();
    } else {
      authApi.me()
        .then((d) => {
          if (cancelled) return;
          setAuth(token, d.user, d.agent);
          connect();
        })
        .catch(() => { if (!cancelled) logout(); });
    }
    return () => { cancelled = true; disconnectSocket(); };
  }, [token, user, setAuth, logout, connectSocket, disconnectSocket, setConversations]);

  if (!token) return <Navigate to="/login" replace />;
  if (!user) return <div className="flex items-center justify-center h-screen text-sm text-ink-soft">Loading...</div>;
  return <>{children}</>;
}

function WebApp() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const { disconnectSocket, setConversations, activeConvId } = useChatStore();
  const { activeTab, setActiveTab, rightPanelOpen, setRightPanel } = useUIStore();
  const { listings, selectedId } = useFeedStore();
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  const handleSelectListing = (id: string) => {
    const l = listings.find((x) => x.id === id);
    if (l) {
      setSelectedListing(l);
      useFeedStore.getState().select(id);
    }
  };

  const handleOpenChat = async (listingId: string) => {
    try {
      const { conversation } = await messagesApi.start(listingId);
      setSelectedListing(null);
      setActiveTab('chat');
      useChatStore.getState().selectConversation(conversation.id);
      const cd = await messagesApi.conversations();
      setConversations(cd.conversations || []);
    } catch {
      console.error('Could not start conversation');
    }
  };

  const handleLogout = () => {
    disconnectSocket();
    logout();
    navigate('/login');
  };

  const handleTab = (tab: 'feed' | 'map' | 'chat' | 'profile') => {
    setActiveTab(tab);
    setSelectedListing(null);
  };

  return (
    <div className="h-screen flex overflow-hidden bg-white pb-14 lg:pb-0">
      <AppSidebar onSelect={handleTab} onLogout={handleLogout} />

      <main className="flex-1 min-w-0 flex h-full">
        {activeTab === 'feed' && (
          <>
            <FeedColumn onSelectListing={handleSelectListing} onMessageListing={handleOpenChat} onOpenFilters={() => setRightPanel(true)} />
            <FilterColumn />
            {rightPanelOpen && (
              <div className="fixed inset-0 z-40 lg:hidden">
                <div className="absolute inset-0 bg-black/40" onClick={() => setRightPanel(false)} />
                <div className="absolute inset-y-0 right-0 w-[300px] max-w-[85vw] bg-white shadow-2xl animate-slide-in-right">
                  <FilterColumn onClose={() => setRightPanel(false)} />
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'map' && (
          <div className="flex-1 min-w-0 relative">
            <MapPanel listings={listings} selectedId={selectedId || null} onSelect={handleSelectListing} />
          </div>
        )}

        {activeTab === 'chat' && (
          <>
            <div className={`w-[380px] shrink-0 border-r border-line h-full ${activeConvId ? 'hidden lg:block' : ''}`}>
              <ConversationList />
            </div>
            <div className={`flex-1 min-w-0 h-full ${activeConvId ? '' : 'hidden lg:block'}`}>
              <ChatView />
            </div>
          </>
        )}

        {activeTab === 'profile' && (
          <div className="flex-1 min-w-0 h-full">
            <ProfilePage onLogout={handleLogout} />
          </div>
        )}
      </main>

      {selectedListing && (
        <ListingDetailModal
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
          onChat={handleOpenChat}
        />
      )}

      <BottomNav onSelect={handleTab} />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/admin/*" element={<ProtectedRoute><AdminPortal /></ProtectedRoute>} />
        <Route path="/agent/*" element={<ProtectedRoute><AgentDashboard /></ProtectedRoute>} />
        <Route path="/" element={<ProtectedRoute><WebApp /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}