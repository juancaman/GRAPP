import React from 'react';
import { useApp } from '../context/AppContext';
import { ThumbsUp, Clock, MapPin, User, Flag, Share2, Trash2, MessageCircle, Send } from 'lucide-react';

function PostCard({ post }) {
    const { votePost, reportPost, user, deletePost, fetchComments, addComment } = useApp();
    const [showComments, setShowComments] = React.useState(false);
    const [comments, setComments] = React.useState([]);
    const [newComment, setNewComment] = React.useState('');
    const [loadingComments, setLoadingComments] = React.useState(false);

    // Robust authorship check
    const isAuthor = React.useMemo(() => {
        if (!user || !post.user_id) return false;
        // Compare as strings and handle potential nulls/undefined
        return user.id.toString() === post.user_id.toString();
    }, [user, post.user_id]);

    const handleReport = async () => {
        const reason = window.prompt('¿Por qué quieres reportar este aviso? (Spam, Inapropiado, Falso, etc.)');
        if (reason) {
            const { success } = await reportPost(post.id, reason);
            if (success) alert('¡Gracias! Hemos recibido tu reporte y lo revisaremos.');
            else alert('Hubo un error al enviar el reporte.');
        }
    };

    const handleShare = () => {
        const text = `¡Ey! Mira este aviso en General Rodríguez:\n\n*${post.title}*\n${post.description}\n\nUbicación: ${post.barrio}\n\nVer más en Yo Te Avisé.`;
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    const handleDelete = async () => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este aviso?')) {
            const { success } = await deletePost(post.id);
            if (!success) alert('Hubo un error al eliminar el aviso.');
        }
    };

    const toggleComments = async () => {
        if (!showComments) {
            setLoadingComments(true);
            const data = await fetchComments(post.id);
            setComments(data);
            setLoadingComments(false);
        }
        setShowComments(!showComments);
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        const { success } = await addComment(post.id, newComment);
        if (success) {
            setNewComment('');
            const data = await fetchComments(post.id);
            setComments(data);
        } else {
            alert('Error al agregar comentario. ¿Estás logueado?');
        }
    };

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
                    {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

                <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button
                        onClick={handleShare}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem' }}
                        title="Compartir en WhatsApp"
                    >
                        <Share2 size={16} />
                    </button>

                    <button
                        onClick={toggleComments}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: showComments ? 'var(--primary)' : 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                        }}
                    >
                        <MessageCircle size={16} />
                    </button>

                    <button
                        onClick={handleReport}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem' }}
                        title="Reportar"
                    >
                        <Flag size={16} />
                    </button>

                    {isAuthor && (
                        <button
                            onClick={handleDelete}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }}
                            title="Eliminar aviso"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            </div>

            {showComments && (
                <div style={{ marginTop: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                    <h4 style={{ fontSize: '0.85rem', marginBottom: '0.75rem', color: 'var(--text-main)' }}>Comentarios</h4>

                    <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1rem' }}>
                        {loadingComments ? (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cargando comentarios...</div>
                        ) : comments.length > 0 ? (
                            comments.map(c => (
                                <div key={c.id} style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                        <span style={{ fontWeight: 700, fontSize: '0.75rem' }}>{c.author_name}</span>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                            {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p style={{ fontSize: '0.8rem', margin: 0 }}>{c.content}</p>
                                </div>
                            ))
                        ) : (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>No hay comentarios aún. ¡Sé el primero!</div>
                        )}
                    </div>

                    <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            type="text"
                            placeholder="Añadir un comentario..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            style={{
                                flex: 1,
                                padding: '0.5rem 1rem',
                                borderRadius: '9999px',
                                border: '1px solid #e2e8f0',
                                fontSize: '0.8rem',
                                outline: 'none'
                            }}
                        />
                        <button
                            type="submit"
                            style={{
                                backgroundColor: 'var(--primary)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyCenter: 'center',
                                cursor: 'pointer'
                            }}
                        >
                            <Send size={14} style={{ marginLeft: '2px' }} />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}

export default function Feed() {
    const { posts, selectedBarrio, loading } = useApp();
    const [selectedCategory, setSelectedCategory] = React.useState('Todas');

    const filteredPosts = posts.filter(post => {
        const matchesBarrio = selectedBarrio === 'Todos los Barrios' || post.barrio === selectedBarrio;
        const matchesCategory = selectedCategory === 'Todas' ||
            (selectedCategory === 'Ofertas' && post.category === 'Precios Bajos') ||
            (selectedCategory === 'Alertas' && post.category === 'Seguridad/Alerta') ||
            (selectedCategory === 'Servicios' && post.category === 'Servicios/Changas');

        return matchesBarrio && matchesCategory;
    });

    return (
        <div style={{ padding: '0 1rem 5rem 1rem', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'none' }}>
                <button
                    onClick={() => setSelectedCategory('Todas')}
                    style={{
                        padding: '0.5rem 1.25rem',
                        borderRadius: '9999px',
                        border: selectedCategory === 'Todas' ? '2px solid var(--primary)' : '1px solid #e2e8f0',
                        backgroundColor: selectedCategory === 'Todas' ? 'var(--primary)' : 'white',
                        color: selectedCategory === 'Todas' ? 'white' : 'var(--text-main)',
                        whiteSpace: 'nowrap',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}>
                    Todas
                </button>
                {['Ofertas', 'Alertas', 'Servicios'].map(filter => (
                    <button
                        key={filter}
                        onClick={() => setSelectedCategory(filter)}
                        style={{
                            padding: '0.5rem 1.25rem',
                            borderRadius: '9999px',
                            border: selectedCategory === filter ? '2px solid var(--primary)' : '1px solid #e2e8f0',
                            backgroundColor: selectedCategory === filter ? '#eff6ff' : 'white',
                            color: selectedCategory === filter ? 'var(--primary)' : 'var(--text-main)',
                            whiteSpace: 'nowrap',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}>
                        {filter}
                    </button>
                ))}
            </div>

            {loading ? (
                // Skeleton Loader
                [1, 2, 3].map(i => (
                    <div key={i} className="glass-card" style={{ padding: '1rem', marginBottom: '1rem', opacity: 0.6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div style={{ width: '80px', height: '24px', backgroundColor: '#f1f5f9', borderRadius: '4px' }}></div>
                            <div style={{ width: '60px', height: '18px', backgroundColor: '#f1f5f9', borderRadius: '4px' }}></div>
                        </div>
                        <div style={{ width: '100%', height: '24px', backgroundColor: '#f1f5f9', borderRadius: '4px', marginBottom: '0.5rem' }}></div>
                        <div style={{ width: '70%', height: '18px', backgroundColor: '#f1f5f9', borderRadius: '4px', marginBottom: '1rem' }}></div>
                        <div style={{ width: '100%', height: '150px', backgroundColor: '#f1f5f9', borderRadius: '12px' }}></div>
                    </div>
                ))
            ) : filteredPosts.length > 0 ? (
                filteredPosts.map(post => <PostCard key={post.id} post={post} />)
            ) : (
                <div style={{
                    textAlign: 'center',
                    padding: '4rem 2rem',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1rem'
                }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#cbd5e1'
                    }}>
                        <MapPin size={40} />
                    </div>
                    <div>
                        <h3 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>No hay avisos aquí</h3>
                        <p style={{ fontSize: '0.9rem' }}>
                            {selectedBarrio === 'Todos los Barrios'
                                ? 'Aún no hay publicaciones. ¡Sé el primero en avisar a tus vecinos!'
                                : `Aún no hay avisos en ${selectedBarrio}.`}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
