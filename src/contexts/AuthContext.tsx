import React, { createContext, useState, useEffect, useContext, useRef } from 'react'; // <-- Importe o useRef
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { Alert } from 'react-native';
import { navigate } from '../routes/RootNavigation';
import { Linking } from 'react-native';

type UserProfile = {
  name: string;
  email: string;
}

type AuthContextType = {
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<boolean>;
  clearRecoveryFlag: () => void;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  changePassword: async () => false,
  clearRecoveryFlag: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const isHandlingRecovery = useRef(false);

  useEffect(() => {
    async function fetchSessionAndProfile(currentSession: Session | null) {
      if (currentSession) {
        const { data: profileData } = await supabase
          .from('users')
          .select('name, email')
          .eq('id', currentSession.user.id)
          .single();
        setProfile(profileData);
      } else {
        setProfile(null);
      }
      setSession(currentSession);
      setLoading(false);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchSessionAndProfile(session);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange( 
      async (_event, session ) => {
        console.log("AUTH CONTEXT (onAuth): Evento recebido:", _event);

        if (isHandlingRecovery.current) {
          console.log("AUTH CONTEXT (onAuth): Ignorando evento, recuperação em andamento.");
          return;
        }
        
        fetchSessionAndProfile(session);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    
    const parseDataFromUrl = (url: string): { access_token: string; refresh_token: string; type: string | null } | null => {
      try {
        const hash = new URL(url).hash;
        const params = new URLSearchParams(hash.substring(1));
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        const type = params.get('type');
        if (access_token && refresh_token) {
          return { access_token, refresh_token, type };
        }
        return null;
      } catch (e) { return null; }
    };

    const processUrl = async (url: string) => {
      console.log("AUTH CONTEXT (Linking): Processando URL:", url);
      const data = parseDataFromUrl(url);

      if (data) {
        console.log("AUTH CONTEXT (Linking): Tokens encontrados. Tipo:", data.type);

        if (data.type === 'recovery') { 
          console.log("AUTH CONTEXT (Linking): Tipo 'recovery' detectado!");

          isHandlingRecovery.current = true;
          
          console.log("AUTH CONTEXT (Linking): Definindo sessão de recuperação...");
          const { error } = await supabase.auth.setSession({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
          });

          if (error) {
            console.error("AUTH CONTEXT (Linking): Erro ao definir sessão:", error);
          } else {
            console.log("AUTH CONTEXT (Linking): Sessão de recuperação definida, navegando...");
            navigate('ResetPasswordScreen');
          }

        } else {
          await supabase.auth.setSession({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
          });
        }
      } else {
        console.log("AUTH CONTEXT (Linking): Nenhum token válido encontrado no URL.");
      }
    };

    const subscription = Linking.addEventListener('url', (event) => {
      processUrl(event.url);
    });

    Linking.getInitialURL().then(url => {
      if (url) {
        processUrl(url);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function changePassword(newPassword: string): Promise<boolean>{
    if (newPassword.length < 6) {
        Alert.alert('Erro', 'A senha deve ter no mínimo 6 caracteres.');
        return false;
    }
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) {
        Alert.alert('Erro', 'Não foi possível atualizar a senha.');
        console.error(error);
        return false;
    } else {
        Alert.alert('Sucesso!', 'Sua senha foi alterada com sucesso.');
        return true;
    }
  }

  function clearRecoveryFlag() {
    isHandlingRecovery.current = false;
    console.log("AUTH CONTEXT: Sinalizador de recuperação limpo. Fluxo normal restaurado.");
  }

  return (
    <AuthContext.Provider value={{ session, profile, loading, signOut, changePassword, clearRecoveryFlag }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}