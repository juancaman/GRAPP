import React, { useState } from 'react';
import { supabase } from '../supabase/client';
import { useApp } from '../context/AppContext';
import { Camera, X, MapPin, Send } from 'lucide-react';

const CATEGORIES = [
    { id: 'Precios Bajos', label: 'Oferta', icon: '💰', color: 'var(--cat-precios)' },
    { id: 'Seguridad/Alerta', label: 'Alerta', icon: '⚠️', color: 'var(--cat-seguridad)' },
    { id: 'Servicios/Changas', label: 'Servicio', icon: '🛠️', color: 'var(--cat-servicios)' },
    { id: 'Basural/Pasto', label: 'Limpieza', icon: '🌱', color: 'var(--cat-basural)' }
];

export default function UploadForm({ isOpen, onClose }) {
    const { setPosts, selectedBarrio, user } = useApp();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [formData, setFormData] = useState({
        category: '',
        title: '',
        description: '',
        price: '',
        isAnonymous: false
    });

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async () => {
        if (!user && !formData.isAnonymous) {
            alert('Debes iniciar sesión para publicar con tu nombre. O elige "Publicar de forma anónima".');
            return;
        }

        setLoading(true);
        let imageUrl = null;

        try {
            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('posts')
                    .upload(fileName, imageFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('posts')
                    .getPublicUrl(fileName);

                imageUrl = publicUrl;
            }

            const newPost = {
                category: formData.category,
                title: formData.title,
                description: formData.description,
                price: formData.price,
                is_anonymous: formData.isAnonymous, // Fix: camelCase to snake_case
                barrio: selectedBarrio === 'Todos los Barrios' ? 'Centro' : selectedBarrio,
                votes: 0,
                author: formData.isAnonymous ? 'Anónimo' : (user?.email?.split('@')[0] || 'Vecino'),
                user_id: user?.id,
                image_url: imageUrl,
                lat: -34.6083 + (Math.random() - 0.5) * 0.01,
                lng: -58.9392 + (Math.random() - 0.5) * 0.01,
            };

            const { data, error } = await supabase
                .from('posts')
                .insert([newPost])
                .select(); // Important: Return the inserted row

            if (error) throw error;

            // Manually update state to show post immediately (in case Realtime is off)
            if (data && data.length > 0) {
                setPosts(prev => [data[0], ...prev]);
            }

            onClose();
            alert('¡Publicación creada con éxito!');
        } catch (error) {
            console.error('Error:', error);
            alert('Hubo un error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'flex-end'
        }}>
            <div className="glass-card animate-fade-in" style={{
                width: '100%',
                backgroundColor: 'white',
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                padding: '1.5rem',
                maxHeight: '90vh',
                overflowY: 'auto'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>¿Qué encontraste?</h2>
                    <button onClick={onClose} style={{ border: 'none', background: 'none' }}><X /></button>
                </div>

                {step === 1 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => { setFormData({ ...formData, category: cat.id }); setStep(2); }}
                                style={{
                                    padding: '1.5rem',
                                    borderRadius: '16px',
                                    border: '2px solid #f1f5f9',
                                    backgroundColor: '#f8fafc',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    cursor: 'pointer'
                                }}
                            >
                                <span style={{ fontSize: '2rem' }}>{cat.icon}</span>
                                <span style={{ fontWeight: 700 }}>{cat.label}</span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                id="file-upload"
                                style={{ display: 'none' }}
                            />
                            <label
                                htmlFor="file-upload"
                                style={{
                                    width: '100%',
                                    height: '200px',
                                    backgroundColor: '#f1f5f9',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--text-muted)',
                                    gap: '0.5rem',
                                    border: '2px dashed #cbd5e1',
                                    cursor: 'pointer',
                                    overflow: 'hidden',
                                    backgroundImage: previewUrl ? `url(${previewUrl})` : 'none',
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center'
                                }}
                            >
                                {!previewUrl && (
                                    <>
                                        <Camera size={32} />
                                        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Toca para subir foto</span>
                                    </>
                                )}
                            </label>
                            {previewUrl && (
                                <button
                                    onClick={() => { setPreviewUrl(null); setImageFile(null); }}
                                    style={{
                                        position: 'absolute',
                                        top: '0.5rem',
                                        right: '0.5rem',
                                        backgroundColor: 'rgba(0,0,0,0.5)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '50%',
                                        padding: '0.25rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        <input
                            type="text"
                            placeholder="Título (Ej: Oferta Asado)"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                        />

                        <textarea
                            placeholder="Describe lo que viste..."
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', height: '100px' }}
                        />

                        {formData.category === 'Precios Bajos' && (
                            <input
                                type="number"
                                placeholder="Precio (Opcional)"
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                            />
                        )}

                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={formData.isAnonymous}
                                onChange={e => setFormData({ ...formData, isAnonymous: e.target.checked })}
                            />
                            Publicar de forma anónima
                        </label>

                        <button
                            className="btn-primary"
                            style={{ justifyContent: 'center', marginTop: '1rem', padding: '1rem' }}
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? 'Subiendo...' : <><Send size={18} /> Publicar Ahora</>}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
