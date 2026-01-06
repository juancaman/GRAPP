import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MapPin, Search, User, LogOut } from 'lucide-react';
import AuthModal from './AuthModal';

export default function Header() {
    const { barrios, selectedBarrio, setSelectedBarrio, user, signOut } = useApp();
    const [isAuthOpen, setIsAuthOpen] = useState(false);

    return (
        <>
            <header className="glass-card" style={{
                position: 'sticky',
                top: '1rem',
                margin: '1rem',
                zIndex: 100,
                padding: '1rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                    }}>
                        <MapPin size={24} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1 }}>
                            Rodríguez <span style={{ color: 'var(--primary)' }}>Conecta</span>
                        </h1>
                        {user && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Hola, {user.email.split('@')[0]}</span>}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, justifyContent: 'flex-end' }}>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
                        <select
                            value={selectedBarrio}
                            onChange={(e) => setSelectedBarrio(e.target.value)}
                            style={{
                                padding: '0.6rem 1rem 0.6rem 2.5rem',
                                borderRadius: '9999px',
                                border: '1px solid #e2e8f0',
                                backgroundColor: 'white',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                                appearance: 'none',
                                outline: 'none',
                                maxWidth: '140px',
                                textOverflow: 'ellipsis'
                            }}
                        >
                            <option>Todos los Barrios</option>
                            {barrios.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>

                    {user ? (
                        <button
                            onClick={signOut}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.6rem 1rem',
                                borderRadius: '9999px',
                                border: '1px solid #e2e8f0',
                                backgroundColor: '#fecaca',
                                color: '#ef4444',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            <LogOut size={16} />
                            <span className="hide-mobile">Salir</span>
                        </button>
                    ) : (
                        <button
                            onClick={() => setIsAuthOpen(true)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.6rem 1rem',
                                borderRadius: '9999px',
                                border: 'none',
                                backgroundColor: 'var(--primary)',
                                color: 'white',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
                            }}
                        >
                            <User size={16} />
                            <span>Ingresar</span>
                        </button>
                    )}
                </div>
            </header>
            <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
        </>
    );
}
