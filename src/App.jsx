import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import Header from './components/Header';
import Feed from './components/Feed';
import MapView from './components/MapView';
import UploadForm from './components/UploadForm';
import { Plus, LayoutList, Map as MapIcon } from 'lucide-react';
import './styles/index.css';

function AppContent() {
  const [view, setView] = useState('feed');
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  return (
    <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <main style={{ flex: 1 }}>
        {view === 'feed' ? <Feed /> : <MapView />}
      </main>

      <div className="fab" onClick={() => setIsUploadOpen(true)}>
        <Plus size={32} />
      </div>

      <UploadForm isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />

      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(10px)',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        borderTop: '1px solid #e2e8f0',
        zIndex: 999,
        paddingBottom: '2rem' // Adjustment for some mobile devices
      }}>
        <button
          onClick={() => setView('feed')}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.75rem',
            fontWeight: view === 'feed' ? 700 : 500,
            color: view === 'feed' ? 'var(--primary)' : 'var(--text-muted)'
          }}
        >
          <LayoutList size={20} />
          Feed
        </button>
        <button
          onClick={() => setView('map')}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.75rem',
            fontWeight: view === 'map' ? 700 : 500,
            color: view === 'map' ? 'var(--primary)' : 'var(--text-muted)'
          }}
        >
          <MapIcon size={20} />
          Mapa
        </button>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

