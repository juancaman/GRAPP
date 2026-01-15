import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Camera, X, MapPin, Send } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase } from '../supabase/client';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet + React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper component for picking location
function LocationPicker({ position, setPosition }) {
    useMapEvents({
        click(e) {
            setPosition(e.latlng);
        },
    });

    return position ? <Marker position={position} draggable={true} eventHandlers={{
        dragend: (e) => setPosition(e.target.getLatLng())
    }} /> : null;
}

// Ensure map centers on user if they haven't picked yet
function MapRecenter({ position }) {
    const map = useMap();
    React.useEffect(() => {
        if (position) map.setView(position, 15);
    }, [position, map]);
    return null;
}

const CATEGORIES = [
    { id: 'Precios Bajos', label: 'Oferta', icon: '💰', color: 'var(--cat-precios)' },
    { id: 'Seguridad/Alerta', label: 'Alerta', icon: '⚠️', color: 'var(--cat-seguridad)' },
    { id: 'Servicios/Changas', label: 'Servicio', icon: '🛠️', color: 'var(--cat-servicios)' },
    { id: 'Basural/Pasto', label: 'Limpieza', icon: '🌱', color: 'var(--cat-basural)' }
];

// Basic moderation function
function containsBadWords(text) {
    if (!text) return false;
    const badWords = ['insulto1', 'insulto2', 'palabrota']; // Add actual bad words if needed
    return badWords.some(word => text.toLowerCase().includes(word));
}

export default function UploadForm({ isOpen, onClose }) {
    const { setPosts, selectedBarrio, user, createPost, userLocation } = useApp();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [location, setLocation] = useState(null);
    const [formData, setFormData] = useState({
        category: '',
        title: '',
        description: '',
        price: '',
        isAnonymous: false
    });

    const GR_CENTER = { lat: -34.6083, lng: -58.9392 };

    // Set initial location when opening
    React.useEffect(() => {
        if (isOpen && !location) {
            setLocation(userLocation || GR_CENTER);
        }
    }, [isOpen, userLocation]);

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validar que sea una imagen
            if (!file.type.startsWith('image/')) {
                alert('⚠️ Por favor, selecciona un archivo de imagen.');
                return;
            }

            // Validar tamaño (máximo 5MB)
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                alert('⚠️ La imagen es muy grande. Máximo 5MB.');
                return;
            }

            // Validar formato
            const allowedFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
            if (!allowedFormats.includes(file.type)) {
                alert('⚠️ Formato no soportado. Usa JPEG, PNG, WebP o GIF.');
                return;
            }

            console.log(`📸 Archivo seleccionado: ${file.name} (${(file.size / 1024).toFixed(2)}KB)`);
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async () => {
        // Validation
        if (!formData.category) {
            alert('Por favor, selecciona una categoría primero.');
            return;
        }
        if (!formData.title?.trim() || !formData.description?.trim()) {
            alert('Por favor, completa el título y la descripción.');
            return;
        }

        // Moderation check
        if (containsBadWords(formData.title) || containsBadWords(formData.description)) {
            alert('Tu publicación contiene lenguaje inapropiado y no puede ser publicada. Por favor, sé respetuoso.');
            return;
        }

        if (!user && !formData.isAnonymous) {
            alert('Debes iniciar sesión para publicar con tu nombre. O elige "Publicar de forma anónima".');
            return;
        }

        // FACE DETECTION CHECK - Block if faces detected
        console.log('[UploadForm] Face Detection Status:', {
            hasImageFile: !!imageFile,
            faceApiReady: window.faceApiReady,
            faceapiExists: !!window.faceapi,
            faceapiType: typeof window.faceapi
        });
        
        if (imageFile && window.faceApiReady && window.faceapi) {
            try {
                setLoading(true);
                console.log('🔍 Iniciando detección de rostros...');
                
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const img = new Image();
                img.crossOrigin = 'anonymous';
                
                // Load image into canvas
                const imageLoaded = await new Promise((resolve, reject) => {
                    img.onload = () => {
                        try {
                            canvas.width = img.width;
                            canvas.height = img.height;
                            ctx.drawImage(img, 0, 0);
                            console.log(`✅ Imagen cargada: ${img.width}x${img.height}px`);
                            resolve(true);
                        } catch (e) {
                            reject(e);
                        }
                    };
                    img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
                    img.src = previewUrl;
                });
                
                if (!imageLoaded) {
                    throw new Error('Imagen no cargada correctamente');
                }
                
                // Detect faces
                console.log('👁️ Analizando rostros...');
                const detections = await window.faceapi.detectAllFaces(canvas);
                console.log(`✓ Análisis completado: ${detections.length} rostro(s) detectado(s)`);
                
                if (detections.length > 0) {
                    setLoading(false);
                    alert('⚠️ IMAGEN RECHAZADA\n\nNo podemos publicar imágenes que contengan rostros de personas.\n\nRazón: Política de privacidad y protección de datos personales.\n\nPor favor, selecciona una imagen sin personas visibles.');
                    // Reset form completely
                    setFormData({
                        category: '',
                        title: '',
                        description: '',
                        price: '',
                        isAnonymous: false
                    });
                    setStep(1);
                    setImageFile(null);
                    setPreviewUrl(null);
                    setLocation(null);
                    console.log('❌ Publicación bloqueada: se detectaron rostros - formulario reseteado');
                    return;
                }
                
                console.log('✅ Análisis finalizado: sin rostros detectados. Procediendo...');
                setLoading(false);
            } catch (error) {
                console.error('❌ Error al procesar la imagen:', error);
                setLoading(false);
                alert('⚠️ Error al analizar la imagen. Por favor, intenta de nuevo o selecciona otra imagen.');
                return;
            }
        } else if (imageFile && !window.faceApiReady) {
            // Face API not loaded yet - show warning in console
            console.warn('[UploadForm] ⚠️ Face API NOT READY yet. Status:', {
                faceApiReady: window.faceApiReady,
                faceapiExists: !!window.faceapi,
                windowKeys: Object.keys(window).filter(k => k.includes('face') || k.includes('Face'))
            });
            alert('⚠️ Sistema de privacidad inicializándose... Por favor intenta de nuevo en unos segundos.');
            return;
        }

        // --- OPTIMISTIC UI START ---
        // Prepare final post data
        const postToCreate = {
            category: formData.category,
            title: formData.title.trim(),
            description: formData.description.trim(),
            price: formData.price ? parseFloat(formData.price) : null,
            is_anonymous: formData.isAnonymous,
            barrio: selectedBarrio === 'Todos los Barrios' ? 'Centro' : selectedBarrio,
            author: formData.isAnonymous ? 'Anónimo' : (user?.email?.split('@')[0] || 'Vecino'),
            user_id: user?.id || null,
            lat: location?.lat || GR_CENTER.lat,
            lng: location?.lng || GR_CENTER.lng
        };

        // Call background creator
        createPost(postToCreate, imageFile);

        // CLOSE INSTANTLY
        onClose();

        // Reset for next time (after close animation)
        setTimeout(() => {
            setFormData({
                category: '',
                title: '',
                description: '',
                price: '',
                isAnonymous: false
            });
            setStep(1);
            setImageFile(null);
            setPreviewUrl(null);
            setLoading(false);
            setLocation(null);
        }, 500);
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
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
                                    cursor: 'pointer',
                                    transition: 'transform 0.1s'
                                }}
                            >
                                <span style={{ fontSize: '2rem' }}>{cat.icon}</span>
                                <span style={{ fontWeight: 700 }}>{cat.label}</span>
                            </button>
                        ))}
                    </div>
                );
            case 2:
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                            Tocá el mapa o arrastrá el pin para marcar la ubicación exacta.
                        </div>
                        <div style={{ height: '300px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                            <MapContainer center={location || GR_CENTER} zoom={15} style={{ height: '100%', width: '100%' }}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <LocationPicker position={location} setPosition={setLocation} />
                                <MapRecenter position={location} />
                            </MapContainer>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => setStep(1)} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>Atrás</button>
                            <button onClick={() => setStep(3)} className="btn-primary" style={{ flex: 2, justifyContent: 'center' }}>Siguiente</button>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem',
                            backgroundColor: '#eff6ff',
                            borderRadius: '12px',
                            marginBottom: '0.5rem',
                            color: 'var(--primary)',
                            fontWeight: 600
                        }}>
                            <span>Publicando en:</span>
                            <span style={{
                                backgroundColor: 'white',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '999px',
                                fontSize: '0.85rem',
                                border: '1px solid #bfdbfe'
                            }}>
                                {CATEGORIES.find(c => c.id === formData.category)?.icon} {CATEGORIES.find(c => c.id === formData.category)?.label}
                            </span>
                            <button
                                onClick={() => setStep(1)}
                                style={{
                                    marginLeft: 'auto',
                                    border: 'none',
                                    background: 'none',
                                    color: 'var(--text-muted)',
                                    fontSize: '0.8rem',
                                    textDecoration: 'underline',
                                    cursor: 'pointer'
                                }}>
                                Cambiar
                            </button>
                        </div>

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
                                    height: '180px',
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
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', height: '80px' }}
                        />

                        {(formData.category === 'Precios Bajos' || formData.category === 'Servicios/Changas') && (
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

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => setStep(2)} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>Atrás</button>
                            <button
                                className="btn-primary"
                                style={{ flex: 2, justifyContent: 'center' }}
                                onClick={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? 'Subiendo...' : <><Send size={18} /> Publicar Ahora</>}
                            </button>
                        </div>
                    </div>
                );
            default:
                return null;
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

                {renderStep()}
            </div>
        </div>
    );
}
