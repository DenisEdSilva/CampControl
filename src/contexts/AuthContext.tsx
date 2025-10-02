import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

type UserProfile = {
  name: string;
  email: string;
}

type AuthContextType = {
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    async function fetchSessionAndProfile() {
      const { data: { session }} = await supabase.auth.getSession();
      setSession(session);

      if (session) {
        const { data: profileData } = await supabase
          .from('users')
          .select('name, email')
          .eq('id', session.user.id)
          .single();
        setProfile(profileData);  
      }

      setLoading(false);
    }

    fetchSessionAndProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange( 
      async (_event, session ) => {
        setSession(session);

        if (session) {
          const { data: profileData } = await supabase
            .from('users')
            .select('name, email')
            .eq('id', session.user.id)
            .single();
          setProfile(profileData);  
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ session, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}