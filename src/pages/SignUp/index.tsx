import React, { useState } from 'react';
import { TextInput, Button, Alert, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabase';
import { StackScreenProps } from '@react-navigation/stack';
import { AuthRoutesParamList } from '../../routes/auth.routes';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = StackScreenProps<AuthRoutesParamList, 'SignUp'>;

function SignUpScreen({ navigation }: Props) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleRegisterCamper() {

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (authError) {
      Alert.alert('Erro no cadastro', authError.message);
      return;
    }

    if (!authData.user) {
      Alert.alert('Erro', 'Não foi possível criar o usuário. Tente novamente.');
      return;
    }

    const { error: profileError } = await supabase
      .from('users')
      .insert([{
        id: authData.user.id,
        name: nome,
        email: email,
      }]
    );

    if (profileError) {
      Alert.alert('Erro ao criar o usuário', profileError.message);
      return;
    } else {
      setNome('');
      setEmail('');
      setPassword('');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <TextInput 
        style={styles.input}
        placeholder="Informe seu nome" 
        value={nome} 
        onChangeText={setNome} 
      />
      
      <TextInput 
        style={styles.input}
        placeholder="seuemail@email.com" 
        value={email} 
        onChangeText={setEmail} 
      />

      <TextInput 
        style={styles.input}
        placeholder="Digite a sua senha" 
        value={password} 
        onChangeText={setPassword} 
        secureTextEntry={true} 
      />

      <Button 
        title="Criar conta" 
        onPress={handleRegisterCamper}
      />

      <TouchableOpacity 
        style={styles.linkButton} 
        onPress={() => navigation.navigate('SignIn')}
      >
        <Text style={styles.linkText}>Já tem uma conta? Faça login</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

export default SignUpScreen;

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