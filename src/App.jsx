import { Routes, Route, BrowserRouter, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';

import { MainLayout } from './components/layout/MainLayout';

import { AuthPage } from './pages/Auth';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { CardDetailPage } from './pages/CardDetailPage';
import { CollectionPage } from './pages/CollectionPage';
import { DecksListPage } from './pages/DecksListPage';
import { DeckBuilderPage } from './pages/DeckBuilderPage';
import { PublicDeckPage } from './pages/PublicDeckPage';

const queryClient = new QueryClient();

const ProtectedLayout = () => {
  const { session } = useAuth();
  if (!session) {
    return <Navigate to="/auth" replace />;
  }
  return <MainLayout />;
};

const AuthRoutes = () => {
    const { session } = useAuth();
    if (session) {
        return <Navigate to="/" replace />;
    }
    return <AuthPage />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>

              <Route path="/public/decks/:deckId" element={<PublicDeckPage />} />
              <Route path="/auth" element={<AuthRoutes />} />

              <Route element={<ProtectedLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/collection" element={<CollectionPage />} />
                <Route path="/decks" element={<DecksListPage />} />
                <Route path="/decks/:deckId" element={<DeckBuilderPage />} />
                <Route path="/card/:set/:number" element={<CardDetailPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;