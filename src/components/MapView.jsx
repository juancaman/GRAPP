import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useApp } from '../context/AppContext';
import L from 'leaflet';
import { ThumbsUp } from 'lucide-react';

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

export default function MapView() {
    const { posts, selectedBarrio, votePost } = useApp();
    const center = [-34.6083, -58.9392]; // General Rodríguez center

    const filteredPosts = posts.filter(post =>
        selectedBarrio === 'Todos los Barrios' || post.barrio === selectedBarrio
    );

    return (
        <div style={{ height: 'calc(100vh - 140px)', width: '100%', borderRadius: '20px', overflow: 'hidden', marginTop: '1rem' }}>
            <MapContainer center={center} zoom={14} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
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
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
