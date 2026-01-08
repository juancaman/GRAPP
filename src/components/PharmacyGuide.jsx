import React from 'react';
import { Pill, MapPin, ExternalLink, Clock, Search } from 'lucide-react';

const PHARMACIES = [
    { name: 'ANASTASI', address: '2 de Abril 850', distance: 'Centro' },
    { name: 'FRANCO', address: 'Avenida Italia 800', distance: 'Centro' },
    { name: 'UNO', address: 'Ruta 28 y Los Naranjos', distance: 'Periferia' },
    { name: 'GASPARETTO', address: 'Bernardo de Irigoyen 302', distance: 'Centro' },
    { name: 'ASTE', address: 'Int. Manny 835', distance: 'Centro' },
    { name: 'MITRE', address: 'Mitre 110', distance: 'Centro' },
    { name: 'GERARDI', address: 'Av. España 116', distance: 'Centro' },
];

export default function PharmacyGuide() {
    return (
        <div style={{ padding: '0 1rem 5rem 1rem', maxWidth: '600px', margin: '0 auto' }}>
            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ padding: '0.75rem', backgroundColor: '#10b981', borderRadius: '12px', color: 'white' }}>
                        <Pill size={24} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Guía de Farmacias</h2>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Farmacias locales y turnos</p>
                    </div>
                </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
                <a
                    href="https://farmap.com.ar/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                    style={{
                        width: '100%',
                        justifyContent: 'center',
                        backgroundColor: '#10b981',
                        padding: '1rem',
                        marginBottom: '0.5rem'
                    }}
                >
                    <Clock size={20} />
                    Ver Farmacias de Turno HOY
                    <ExternalLink size={16} />
                </a>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                    Los turnos rotan diariamente. Verificá siempre antes de ir.
                </p>
            </div>

            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                Farmacias Registradas
            </h3>

            <div style={{ display: 'grid', gap: '0.75rem' }}>
                {PHARMACIES.map((farma, idx) => (
                    <div key={idx} className="glass-card" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <div style={{ color: '#10b981' }}>
                                <MapPin size={20} />
                            </div>
                            <div>
                                <div style={{ fontWeight: 700 }}>{farma.name}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{farma.address}</div>
                            </div>
                        </div>
                        <a
                            href={`https://www.google.com/maps/search/?api=1&query=Farmacia+${farma.name}+General+Rodriguez`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'var(--text-muted)', padding: '0.5rem' }}
                        >
                            <ExternalLink size={18} />
                        </a>
                    </div>
                ))}
            </div>
        </div>
    );
}
