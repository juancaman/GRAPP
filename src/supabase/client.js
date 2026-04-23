// import { createClient } from '@supabase/supabase-js';

// const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Inicialización de Supabase comentada por migración a Neon.
// export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Objeto mock temporal para evitar errores de importación en AppContext.jsx y otros archivos.
export const supabase = {
  auth: {
    getSession: async () => ({ data: { session: null } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signUp: async () => ({ data: null, error: null }),
    signInWithPassword: async () => ({ data: null, error: null }),
    signOut: async () => ({ error: null }),
  },
  from: () => ({
    select: () => ({ order: () => ({ limit: async () => ({ data: [], error: null }) }) }),
    insert: async () => ({ error: null }),
    update: async () => ({ error: null }),
    delete: async () => ({ error: null }),
  }),
  channel: () => ({
    on: () => ({ subscribe: () => {} }),
  }),
  removeChannel: () => {},
  storage: {
    from: () => ({
      upload: async () => ({ error: null }),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
    }),
  },
  rpc: async () => ({ error: null })
};
