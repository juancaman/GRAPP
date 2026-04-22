import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
const AppContext = createContext();
const MOCK_BARRIOS = [
  'Agua de Oro', 'Almirante Brown', 'Altos del Oeste', 'Bicentenario', 'Centro',
  'Dávila', 'El Casco', 'El Nacional', 'El Zorzal', 'Güemes', 'Juan José Sommer',
  'La Armonía', 'La Cinacina', 'La Fraternidad', 'La Posta', 'Las Latas',
  'Los Aromos', 'Los Naranjos', 'Los Paraísos', 'Los Troncos', 'Malvinas',
  'Marabó', 'Mi Rincón', 'Parque Granaderos', 'Parque Irigoyen', 'Parque Joly',
  'Parque La Argentina', 'Parque Orense', 'Parque Real', 'Parque Rivadavia',
  'Pico Rojo', 'Pueblo Nuevo', 'Raffo', 'San Bernardo', 'San Enrique',
  'San Fermín', 'San Martín', 'San Pedro', 'Santa Brígida', 'Solares del Oeste',
  'Villa Arrarás', 'Villa Vengochea', 'Vista Linda'
].sort();

export function AppProvider({ children }) {
  const [posts, setPosts] = useState([]);
  const [selectedBarrio, setSelectedBarrio] = useState('Todos los Barrios');
  const [userReputation, setUserReputation] = useState(0);
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [isGpsMode, setIsGpsMode] = useState(false);

  // Auth State Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Auth Functions
  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  // Fetch initial posts
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      // Date limit (30 days ago)
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - 30);

      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .gte('created_at', dateLimit.toISOString()) // Filter posts older than 30 days
        .order('created_at', { ascending: false });

      if (error) console.error('Error fetching posts:', error);
      else setPosts(data || []);
      setLoading(false);
    };

    fetchPosts();
  }, []);

  // Real-time subscription to new posts
  useEffect(() => {
    const channel = supabase
      .channel('public:posts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, (payload) => {
        setPosts((currentPosts) => [payload.new, ...currentPosts]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Geolocation Watcher
  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by your browser');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
      },
      (error) => {
        console.error('Error tracking location:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Logic for creating posts (Optimistic)
  // Ahora acepta un callback opcional para rechazo de imagen (por privacidad)
  const createPost = async (formData, imageFile, onImageRejected) => {
    const optimisticId = Date.now();
    const optimisticPost = {
      id: optimisticId,
      ...formData,
      votes: 0,
      created_at: new Date().toISOString(),
      is_optimistic: true // To handle UI states if needed
    };

    // 1. Add to state immediately
    setPosts(prev => [optimisticPost, ...prev]);

    // 2. Process in background
    const processUpload = async () => {
      try {
        let imageUrl = null;
        let fileName = null;
        
        if (imageFile) {
          const fileExt = imageFile.name.split('.').pop();
          const timestamp = Date.now();
          fileName = `${timestamp}.${fileExt}`;
          
          console.log(`📤 Subiendo imagen: ${fileName}`);
          
          const { error: uploadError } = await supabase.storage
            .from('posts')
            .upload(fileName, imageFile);

          if (uploadError) {
            console.error('❌ Error al subir imagen:', uploadError);
            throw uploadError;
          }
          
          const { data: { publicUrl } } = supabase.storage.from('posts').getPublicUrl(fileName);
          imageUrl = publicUrl;
          console.log(`✅ Imagen subida: ${imageUrl}`);
        }

        console.log(`💾 Insertando post en base de datos...`);
        
        const { data, error } = await supabase
          .from('posts')
          .insert([{ ...formData, image_url: imageUrl }])
          .select();

        if (error) {
          console.error('❌ Error al insertar post:', error);
          throw error;
        }

        console.log(`✅ Post creado con ID: ${data[0].id}`);

        // Replace optimistic post with real one
        setPosts(current =>
          current.map(p => p.id === optimisticId ? data[0] : p)
        );
      } catch (err) {
        // SIMULACIÓN: Forzar rechazo por rostro (elimina este bloque cuando termines de probar)
        if (typeof onImageRejected === 'function') {
          const simulateFace = false; // Cambia a false para desactivar la simulación
          if (simulateFace) {
            onImageRejected();
            return;
          }
        }
        console.error('❌ Error en carga de imagen:', err);
        // Remove optimistic post if it failed COMPLETELY
        setPosts(current => current.filter(p => p.id !== optimisticId));
        // Mostrar mensaje de error específico
        const errorMessage = err?.message?.includes('face') 
          ? '⚠️ Tu imagen fue rechazada por contener rostros. Por privacidad, no se permiten fotos con personas.'
          : err?.message?.includes('inappropriate')
          ? '⚠️ Tu imagen fue rechazada por contener contenido inapropiado.'
          : 'No se pudo subir tu aviso. Revisa tu conexión.';
        alert(errorMessage);
      }
    };

    processUpload(); // Don't await
    return { success: true };
  };

  // Logic for voting "Me sirve"
  const votePost = async (postId) => {
    // Optimistic update
    setPosts(currentPosts =>
      currentPosts.map(post => {
        if (post.id === postId) {
          return { ...post, votes: (post.votes || 0) + 1 };
        }
        return post;
      })
    );

    // Use RPC function for security (increment_votes)
    const { error } = await supabase.rpc('increment_votes', { post_id: postId });

    if (error) {
      console.error('Error voting:', error);
      // Rollback optimistic update
      setPosts(currentPosts =>
        currentPosts.map(post => {
          if (post.id === postId) {
            return { ...post, votes: (post.votes || 0) - 1 };
          }
          return post;
        })
      );
    }
  };

  const reportPost = async (postId, reason) => {
    const { error } = await supabase
      .from('reports')
      .insert([
        {
          post_id: postId,
          reason,
          reporter_id: user?.id
        }
      ]);

    if (error) {
      console.error('Error reporting post:', error);
      return { success: false, error };
    }
    return { success: true };
  };

  // Logic for deleting posts
  const deletePost = async (postId) => {
    // Optimistic update
    setPosts(currentPosts => currentPosts.filter(post => post.id !== postId));

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) {
      console.error('Error deleting post:', error);
      // Rollback is complex here without re-fetching, 
      // but usually delete succeeds for authors.
      return { success: false, error };
    }
    return { success: true };
  };

  // Logic for comments
  const fetchComments = async (postId) => {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
    return data;
  };

  const addComment = async (postId, content) => {
    if (!user) return { success: false, error: 'Must be logged in' };

    const { error } = await supabase
      .from('comments')
      .insert([
        {
          post_id: postId,
          user_id: user.id,
          author_name: user.email.split('@')[0], // Fallback author name
          content
        }
      ]);

    if (error) {
      console.error('Error adding comment:', error);
      return { success: false, error };
    }
    return { success: true };
  };

  const value = {
    posts,
    setPosts,
    barrios: MOCK_BARRIOS,
    selectedBarrio,
    setSelectedBarrio,
    userReputation,
    votePost,
    session,
    user,
    signUp,
    signIn,
    signOut,
    loading,
    reportPost,
    userLocation,
    isGpsMode,
    setIsGpsMode,
    deletePost,
    fetchComments,
    addComment,
    createPost
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;

}

export const useApp = () => useContext(AppContext);
