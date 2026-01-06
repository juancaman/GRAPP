import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useApp } from '../context/AppContext';
import L from 'leaflet';

// Fix for leaflet default icon issue in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function MapView() {
    const { posts, selectedBarrio } = useApp();

    // Center of General Rodríguez
    const center = [-34.6083, -58.9392];

    const filteredPosts = posts.filter(post =>
        selectedBarrio === 'Todos los Barrios' || post.barrio === selectedBarrio
    );

    return (
        <div style={{ height: 'calc(100vh - 160px)', width: '100%' }}>
            <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {filteredPosts.map(post => (
                    <Marker key={post.id} position={[post.lat, post.lng]}>
                        <Popup>
                            <div style={{ padding: '0.5rem' }}>
                                <h4 style={{ margin: 0 }}>{post.title}</h4>
                                <p style={{ margin: '0.25rem 0', fontSize: '0.8rem' }}>{post.description}</p>
                                <span className="category-badge badge-prices">{post.category}</span>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
