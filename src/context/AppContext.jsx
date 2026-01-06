import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase/client';

const AppContext = createContext();

const MOCK_BARRIOS = [
  'Centro', 'Altos del Oeste', 'Bicentenario', 'Marabó',
  'Mi Rincón', 'Malvinas', 'Parque Joly', 'Güemes',
  'Los Aromos', 'San Bernardo', 'Parque Real',
  'Villa Vengochea', 'Agua de Oro', 'Las Latas'
];

export function AppProvider({ children }) {
  const [posts, setPosts] = useState([]);
  const [selectedBarrio, setSelectedBarrio] = useState('Todos los Barrios');
  const [userReputation, setUserReputation] = useState(0);
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);

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
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) console.error('Error fetching posts:', error);
      else setPosts(data || []);
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

    // DB update
    const post = posts.find(p => p.id === postId);
    if (post) {
      const { error } = await supabase
        .from('posts')
        .update({ votes: (post.votes || 0) + 1 })
        .eq('id', postId);

      if (error) console.error('Error updating vote:', error);
    }
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
    signOut
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
