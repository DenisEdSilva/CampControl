import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, ActivityIndicator } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function Dashboard() {
  const { signOut, session } = useAuth();
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserData() {
      if (session?.user) {
        const userId = session.user.id;

        const { data, error } = await supabase
          .from('usuarios')
          .select('name')
          .eq('id', userId)
          .single();

          console.log('Dados do usuário:', data);

        if (error) {
          console.error('Erro ao buscar dados do usuário:', error);
          signOut();
        } else if (data) {
          setUserName(data.name);
          setLoading(false);
        }
      }
    } 

    fetchUserData();
  }, [session, signOut]);
  
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }


  return (
    <View style={styles.container}>
      <Text style={styles.text}>Bem-vindo(a), {userName}!</Text>
      
      <Button 
        title="Sair (Logout)" 
        onPress={signOut} 
        color="#ff4757"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  text: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
    marginBottom: 20,
  },
});