import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import Header from './components/Header';
import Feed from './components/Feed';
import MapView from './components/MapView';
import UploadForm from './components/UploadForm';
import UsefulPhones from './components/UsefulPhones';
import PharmacyGuide from './components/PharmacyGuide';
import { Plus, LayoutList, Map as MapIcon, Phone, Pill } from 'lucide-react';
import './styles/index.css';

function AppContent() {
  const [view, setView] = useState('feed');
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Load Face API on app mount
  React.useEffect(() => {
    const loadFaceApi = async () => {
      try {
        // Load TensorFlow.js
        const tfScript = document.createElement('script');
        tfScript.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.20.0';
        tfScript.async = true;
        document.head.appendChild(tfScript);

        // Load face-api.js
        const faceApiScript = document.createElement('script');
        faceApiScript.src = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.js';
        faceApiScript.async = true;
        
        faceApiScript.onload = async () => {
          try {
            console.log('[Face API] Loading models...');
            const MODEL_URL = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights/';
            
            await Promise.all([
              window.faceapi.nets.faceDetectionNet.loadFromUri(MODEL_URL),
              window.faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
              window.faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
              window.faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
              window.faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL)
            ]);
            
            window.faceApiReady = true;
            console.log('✅ Face API initialized successfully');
          } catch (error) {
            console.error('❌ Face API init error:', error);
            window.faceApiReady = false;
          }
        };

        document.head.appendChild(faceApiScript);
      } catch (error) {
        console.error('Error loading Face API:', error);
      }
    };

    loadFaceApi();
  }, []);

  return (
    <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <main style={{ flex: 1 }}>
        {view === 'feed' && <Feed />}
        {view === 'map' && <MapView />}
        {view === 'phones' && <UsefulPhones />}
        {view === 'pharmacies' && <PharmacyGuide />}
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
          Publicar
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
            fontSize: '0.7rem',
            fontWeight: view === 'map' ? 700 : 500,
            color: view === 'map' ? 'var(--primary)' : 'var(--text-muted)'
          }}
        >
          <MapIcon size={18} />
          Mapa
        </button>
        <button
          onClick={() => setView('phones')}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.7rem',
            fontWeight: view === 'phones' ? 700 : 500,
            color: view === 'phones' ? 'var(--primary)' : 'var(--text-muted)'
          }}
        >
          <Phone size={18} />
          Teléfonos
        </button>
        <button
          onClick={() => setView('pharmacies')}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.7rem',
            fontWeight: view === 'pharmacies' ? 700 : 500,
            color: view === 'pharmacies' ? 'var(--primary)' : 'var(--text-muted)'
          }}
        >
          <Pill size={18} />
          Farmacias
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
