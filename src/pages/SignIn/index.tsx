import React, { useState } from 'react';
import { TextInput, Button, Alert, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabase';
import { StackScreenProps } from '@react-navigation/stack';
import { AuthRoutesParamList } from '../../routes/auth.routes';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = StackScreenProps<AuthRoutesParamList, 'SignIn'>;

export default function SignIn({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    if (!email || !password) {
      Alert.alert('Atenção', 'Por favor, preencha e-mail e senha.');
      return;
    }
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      Alert.alert('Erro no login', error.message);
    }
    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <TextInput
        style={styles.input}
        placeholder="email@email.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Sua senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={true}
      />
      <Button 
        title={loading ? 'Entrando...' : 'Entrar'} 
        onPress={handleSignIn} 
        disabled={loading} 
      />

      <TouchableOpacity 
        style={styles.linkButton} 
        onPress={() => navigation.navigate('SignUp')}
      >
        <Text style={styles.linkText}>Não tem uma conta? Cadastre-se</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  input: {
    height: 50,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  linkButton: {
    marginTop: 16,
  },
  linkText: {
    textAlign: 'center',
    color: '#007BFF',
    fontSize: 16,
  },
});