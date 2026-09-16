import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore, useFeedStore, useUIStore, useChatStore } from './store';
import { authApi, messagesApi } from './api';
import { Sidebar, FeedPanel, ListingDetail } from './layouts/MainLayout';
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
  if (!token) return <Navigate to="/login" replace />;
  if (!user) return <div className="flex items-center justify-center h-screen text-sm text-ink-soft">Loading...</div>;
  return <>{children}</>;
}

function WebApp() {
  const navigate = useNavigate();
  const { user, agent, setAuth, token, logout } = useAuthStore();
  const { activeTab, setActiveTab, setRightPanel } = useUIStore();
  const { listings, selectedId } = useFeedStore();
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const { conversations, setConversations, connectSocket, disconnectSocket } = useChatStore();

  useEffect(() => {
    if (!token) return;
    authApi.me().then((d) => {
      setAuth(token, d.user, d.agent);
      connectSocket(token);
      messagesApi.conversations().then((cd) => setConversations(cd.conversations || []));
    }).catch(() => logout());
    return () => disconnectSocket();
  }, [token]);

  const handleSelectListing = (id: string) => {
    const l = listings.find((x) => x.id === id);
    if (l) setSelectedListing(l);
  };

  const handleOpenChat = async (listingId: string) => {
    try {
      const { conversation } = await messagesApi.start(listingId);
      setActiveTab('chat');
      useChatStore.getState().selectConversation(conversation.id);
      const cd = await messagesApi.conversations();
      setConversations(cd.conversations || []);
    } catch (err) {
      console.error('Could not start conversation');
    }
  };

  const handleLogout = () => {
    disconnectSocket();
    logout();
    navigate('/login');
  };

  // Determine right panel content
  const renderRightPanel = () => {
    switch (activeTab) {
      case 'feed':
        if (selectedListing) {
          return (
            <ListingDetail
              listing={selectedListing}
              onBack={() => setSelectedListing(null)}
              onChat={handleOpenChat}
            />
          );
        }
        return (
          <div className="flex-1 flex items-center justify-center text-ink-soft bg-surf h-full">
            <div className="text-center p-8">
              <Building2 size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm">Select a listing to see details</p>
            </div>
          </div>
        );
      case 'map':
        return <MapPanel listings={listings} selectedId={selectedId || selectedListing?.id || null} onSelect={handleSelectListing} />;
      case 'chat':
        return <ChatView />;
      case 'profile':
        return <ProfilePage onLogout={handleLogout} />;
      default:
        return null;
    }
  };

  // Determine sidebar content
  const renderSidebar = () => {
    switch (activeTab) {
      case 'feed':
        return <FeedPanel onSelectListing={handleSelectListing} />;
      case 'chat':
        return <ConversationList />;
      case 'map':
        return <FeedPanel onSelectListing={(id) => { handleSelectListing(id); }} />;
      case 'profile':
        return null;
      default:
        return null;
    }
  };

  const sidebarWidth = activeTab === 'profile' ? 0 : activeTab === 'map' ? 320 : activeTab === 'chat' ? 380 : 340;

  return (
    <div className="h-screen flex overflow-hidden bg-white">
      <Sidebar onSelect={(tab) => { setActiveTab(tab); setSelectedListing(null); }} />
      {/* Content panels */}
      <div className="flex-1 flex h-full min-w-0" style={{ width: `calc(100% - 64px)` }}>
        {/* Left sidebar (list or conversations) */}
        {activeTab !== 'profile' && (
          <div
            className="border-r border-line h-full shrink-0 flex flex-col"
            style={{ width: sidebarWidth }}
          >
            {renderSidebar()}
          </div>
        )}
        {/* Right content area */}
        <div className="flex-1 h-full min-w-0">
          {renderRightPanel()}
        </div>
      </div>
    </div>
  );
}

function Building2(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className || ''}>
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/>
      <path d="M9 22v-4h6v4"/>
      <path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/>
      <path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/>
      <path d="M8 10h.01"/><path d="M8 14h.01"/>
    </svg>
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