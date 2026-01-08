import React from 'react';
import { Phone, Shield, Flame, Ambulance, Info } from 'lucide-react';

const PHONES = [
    {
        category: 'Emergencias',
        icon: <Flame className="text-red-500" />,
        items: [
            { name: 'Bomberos Voluntarios', number: '100', secondary: '(0237) 484-2222' },
            { name: 'SAME (Ambulancia)', number: '107', secondary: '(0237) 403-6434' },
            { name: 'Emergencias Policía', number: '911', secondary: '' },
        ]
    },
    {
        category: 'Seguridad Local',
        icon: <Shield className="text-blue-500" />,
        items: [
            { name: 'COM (Monitoreo)', number: '0800-666-1907', secondary: '(0237) 403-6434' },
            { name: 'Comisaría 1ra', number: '(0237) 484-3398', secondary: '' },
            { name: 'Comisaría 2da', number: '(0237) 484-1521', secondary: '' },
            { name: 'Comisaría de la Mujer', number: '(0237) 485-0245', secondary: '' },
        ]
    }
];

export default function UsefulPhones() {
    return (
        <div style={{ padding: '0 1rem 5rem 1rem', maxWidth: '600px', margin: '0 auto' }}>
            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ padding: '0.75rem', backgroundColor: 'var(--primary)', borderRadius: '12px', color: 'white' }}>
                        <Phone size={24} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Teléfonos Útiles</h2>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Gral. Rodríguez, Buenos Aires</p>
                    </div>
                </div>
            </div>

            {PHONES.map((group, idx) => (
                <div key={idx} style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {group.icon}
                        {group.category}
                    </h3>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {group.items.map((phone, pIdx) => (
                            <div key={pIdx} className="glass-card" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{phone.name}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{phone.number}</div>
                                    {phone.secondary && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', opacity: 0.8 }}>{phone.secondary}</div>}
                                </div>
                                <a
                                    href={`tel:${phone.number.replace(/[^0-9]/g, '')}`}
                                    style={{
                                        backgroundColor: 'var(--primary)',
                                        color: 'white',
                                        width: '44px',
                                        height: '44px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)',
                                        textDecoration: 'none'
                                    }}
                                >
                                    <Phone size={20} />
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            <div style={{
                padding: '1rem',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                border: '1px dashed #cbd5e1',
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-start'
            }}>
                <Info size={18} style={{ color: 'var(--primary)', marginTop: '2px' }} />
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    En caso de emergencia con riesgo de vida, el número nacional prioritario es siempre el <b>911</b> o el <b>107</b>.
                </p>
            </div>
        </div>
    );
}
