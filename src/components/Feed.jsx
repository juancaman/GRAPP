import React from 'react';
import { useApp } from '../context/AppContext';
import { ThumbsUp, Clock, MapPin, User } from 'lucide-react';

function PostCard({ post }) {
    const { votePost } = useApp();

    const getBadgeClass = (cat) => {
        switch (cat) {
            case 'Precios Bajos': return 'badge-prices';
            case 'Seguridad/Alerta': return 'badge-security';
            case 'Servicios/Changas': return 'badge-services';
            default: return 'badge-trash';
        }
    };

    return (
        <div className="glass-card animate-fade-in" style={{ padding: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span className={`category-badge ${getBadgeClass(post.category)}`}>
                    {post.category}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <Clock size={14} />
                    {new Date(post.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>

            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{post.title}</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{post.description}</p>

            {post.image_url && (
                <div style={{ marginBottom: '1rem', borderRadius: '12px', overflow: 'hidden' }}>
                    <img
                        src={post.image_url}
                        alt={post.title}
                        style={{ width: '100%', height: 'auto', display: 'block' }}
                    />
                </div>
            )}

            {post.price && (
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--cat-precios)', marginBottom: '1rem' }}>
                    ${post.price}
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                    <div style={{ padding: '4px', backgroundColor: '#f1f5f9', borderRadius: '50%' }}>
                        <User size={14} />
                    </div>
                    <span style={{ fontWeight: 600 }}>{post.is_anonymous ? 'Anónimo' : post.author}</span>
                    <span style={{ color: 'var(--text-muted)' }}>• {post.barrio}</span>
                </div>

                <button
                    onClick={() => votePost(post.id)}
                    className="btn-primary"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', gap: '0.4rem' }}
                >
                    <ThumbsUp size={14} />
                    {post.votes} Me sirve
                </button>
            </div>
        </div>
    );
}

export default function Feed() {
    const { posts, selectedBarrio } = useApp();

    const filteredPosts = posts.filter(post =>
        selectedBarrio === 'Todos los Barrios' || post.barrio === selectedBarrio
    );

    return (
        <div style={{ padding: '0 1rem 5rem 1rem', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {['Ofertas', 'Alertas', 'Servicios'].map(filter => (
                    <button key={filter} style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '9999px',
                        border: '1px solid #e2e8f0',
                        backgroundColor: 'white',
                        whiteSpace: 'nowrap',
                        fontSize: '0.85rem',
                        fontWeight: 600
                    }}>
                        {filter}
                    </button>
                ))}
            </div>

            {filteredPosts.length > 0 ? (
                filteredPosts.map(post => <PostCard key={post.id} post={post} />)
            ) : (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No hay publicaciones en este barrio todavía.
                </div>
            )}
        </div>
    );
}
