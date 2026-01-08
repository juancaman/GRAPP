import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useApp } from '../context/AppContext';
import L from 'leaflet';
import { ThumbsUp, Navigation } from 'lucide-react';
import { useMap } from 'react-leaflet';

// Marker Icons setup
const getIcon = (category) => {
    let color = '#2563eb';
    if (category === 'Precios Bajos') color = '#10b981';
    if (category === 'Seguridad/Alerta') color = '#ef4444';
    if (category === 'Servicios/Changas') color = '#3b82f6';

    return L.divIcon({
        html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        className: 'custom-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });
};

// Helper component for centering the map
function MapResizer({ center, isGpsMode }) {
    const map = useMap();
    React.useEffect(() => {
        if (isGpsMode && center) {
            map.setView([center.lat, center.lng], map.getZoom());
        }
    }, [center, isGpsMode, map]);
    return null;
}

export default function MapView() {
    const { posts, selectedBarrio, votePost, reportPost, loading, userLocation, isGpsMode, setIsGpsMode } = useApp();
    const center = [-34.6083, -58.9392]; // General Rodríguez center

    const handleReport = async (postId) => {
        const reason = window.prompt('¿Por qué quieres reportar este aviso?');
        if (reason) {
            const { success } = await reportPost(postId, reason);
            if (success) alert('¡Gracias! Hemos recibido tu reporte.');
            else alert('Error al enviar el reporte.');
        }
    };

    const filteredPosts = posts.filter(post =>
        selectedBarrio === 'Todos los Barrios' || post.barrio === selectedBarrio
    );

    if (loading) {
        return (
            <div style={{
                height: 'calc(100vh - 140px)',
                width: '100%',
                borderRadius: '20px',
                marginTop: '1rem',
                backgroundColor: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '1rem',
                color: 'var(--text-muted)'
            }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    border: '4px solid #e2e8f0',
                    borderTop: '4px solid var(--primary)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }}></div>
                <span>Cargando mapa...</span>
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div style={{ height: 'calc(100vh - 140px)', width: '100%', borderRadius: '20px', overflow: 'hidden', marginTop: '1rem' }}>
            <MapContainer center={center} zoom={14} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                <MapResizer center={userLocation} isGpsMode={isGpsMode} />

                {userLocation && (
                    <Marker
                        position={[userLocation.lat, userLocation.lng]}
                        icon={L.divIcon({
                            html: `<div class="user-location-marker"></div>`,
                            className: 'custom-marker',
                            iconSize: [20, 20],
                            iconAnchor: [10, 10]
                        })}
                    >
                        <Popup>
                            <div style={{ padding: '0.25rem' }}>Estás aquí</div>
                        </Popup>
                    </Marker>
                )}
                {filteredPosts.map(post => (
                    <Marker key={post.id} position={[post.lat, post.lng]} icon={getIcon(post.category)}>
                        <Popup>
                            <div style={{ padding: '0.5rem', minWidth: '150px' }}>
                                <span className={`category-badge ${post.category === 'Precios Bajos' ? 'badge-prices' : post.category === 'Seguridad/Alerta' ? 'badge-security' : 'badge-services'}`} style={{ fontSize: '0.6rem' }}>
                                    {post.category}
                                </span>
                                <h4 style={{ margin: '0.5rem 0 0.25rem 0' }}>{post.title}</h4>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{post.description}</p>
                                {post.price && <div style={{ fontWeight: 800, color: 'var(--cat-precios)', margin: '0.5rem 0' }}>${post.price}</div>}

                                <button
                                    onClick={() => votePost(post.id)}
                                    style={{
                                        width: '100%',
                                        marginTop: '0.5rem',
                                        padding: '0.4rem',
                                        borderRadius: '8px',
                                        border: 'none',
                                        backgroundColor: 'var(--primary)',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.25rem',
                                        fontSize: '0.7rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <ThumbsUp size={12} /> {post.votes} Me sirve
                                </button>

                                <button
                                    onClick={() => handleReport(post.id)}
                                    style={{
                                        width: '100%',
                                        marginTop: '0.25rem',
                                        padding: '0.4rem',
                                        borderRadius: '8px',
                                        border: '1px solid #f1f5f9',
                                        backgroundColor: 'white',
                                        color: 'var(--text-muted)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.25rem',
                                        fontSize: '0.65rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Reportar
                                </button>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {/* GPS Toggle Button */}
            <button
                onClick={() => setIsGpsMode(!isGpsMode)}
                style={{
                    position: 'absolute',
                    bottom: '8rem',
                    right: '1.5rem',
                    width: '50px',
                    height: '50px',
                    borderRadius: '16px',
                    backgroundColor: isGpsMode ? 'var(--primary)' : 'white',
                    color: isGpsMode ? 'white' : 'var(--text-main)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    border: 'none',
                    zIndex: 1000,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                }}
                title={isGpsMode ? "Desactivar seguimiento" : "Activar seguimiento GPS"}
            >
                <Navigation size={24} style={{ transform: isGpsMode ? 'rotate(45deg)' : 'none' }} />
            </button>
        </div>
    );
}
