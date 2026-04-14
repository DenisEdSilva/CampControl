import React, { useState } from 'react';
import { TextInput, Alert, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { StackScreenProps } from '@react-navigation/stack';
import { AuthRoutesParamList } from '../../routes/auth.routes';
import { theme } from '../../styles/theme';
import Logo from '../../../assets/logo.svg';
import Icon from 'react-native-vector-icons/Feather';

type Props = StackScreenProps<AuthRoutesParamList, 'SignUp'>;

export default function HandleSignUp({ navigation }: Props) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const LOGO_WIDTH = 300;
  const LOGO_ASPECT_RATIO = 1.48;
  const LOGO_HEIGHT = LOGO_WIDTH / LOGO_ASPECT_RATIO;

  function togglePasswordVisibility() {
    setIsPasswordVisible(!isPasswordVisible);
  }

  async function handleRegisterCamper() {
    if (!nome || !email || !password) {
      Alert.alert('Atenção', 'Por favor, preencha todos os campos.');
      return;
    }
    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (authError) {
      setLoading(false);
      Alert.alert('Erro no cadastro', authError.message.includes('unique constraint') ? 'Este e-mail já está em uso.' : authError.message);
      return;
    }

    if (!authData.user) {
      setLoading(false);
      Alert.alert('Erro', 'Não foi possível criar o usuário. Tente novamente.');
      return;
    }

    const { error: profileError } = await supabase
      .from('users')
      .insert([{
        id: authData.user.id,
        name: nome,
        email: email,
      }]);

    setLoading(false);
    if (profileError) {
      Alert.alert('Erro ao criar o perfil', profileError.message);
      return;
    } else {
      Alert.alert('Sucesso!', 'Conta criada com sucesso. Por favor, faça o login.');
      navigation.navigate('SignIn');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.header}>
            <Logo 
                width={LOGO_WIDTH}
                height={LOGO_HEIGHT}
                color={theme.colors.textPrimary}
            />
        </View>

        <View style={styles.form}>
            <Text style={styles.label}>Nome Completo</Text>
            <View style={styles.inputContainer}>
                <Icon name="user" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Seu nome completo" 
                    placeholderTextColor={theme.colors.textSecondary}
                    value={nome} 
                    onChangeText={setNome} 
                    autoCapitalize="words"
                />
            </View>

            <Text style={styles.label}>E-mail</Text>
            <View style={styles.inputContainer}>
                <Icon name="mail" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="seuemail@email.com" 
                    placeholderTextColor={theme.colors.textSecondary}
                    value={email} 
                    onChangeText={setEmail} 
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
            </View>

            <Text style={styles.label}>Senha</Text>
            <View style={styles.inputContainer}>
                <Icon name="lock" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Crie uma senha forte" 
                    placeholderTextColor={theme.colors.textSecondary}
                    value={password} 
                    onChangeText={setPassword} 
                    secureTextEntry={!isPasswordVisible} 
                />
                <TouchableOpacity onPress={togglePasswordVisibility} style={{ paddingHorizontal: theme.spacing.md }}>
                  <Icon 
                    name={isPasswordVisible ? "eye" : "eye-off"}
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
            </View>

            <TouchableOpacity 
                style={styles.buttonContainer}
                onPress={handleRegisterCamper}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color={theme.colors.textOnPrimary} />
                ) : (
                    <Text style={styles.buttonText}>Criar Conta</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity 
                style={styles.linkButton} 
                onPress={() => navigation.navigate('SignIn')}
            >
                <Text style={styles.linkText}>Já tem uma conta? <Text style={{fontWeight: 'bold'}}>Faça login</Text></Text>
            </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    width: '80%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  form: {
    width: '100%',
  },
  label: {
    ...theme.typography.body,
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm, 
    color: theme.colors.textPrimary,
  },
  inputContainer: {
    ...theme.cardStyle,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  inputIcon: {
    paddingHorizontal: theme.spacing.md,
  },
  input: { 
    flex: 1,
    height: 50,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  buttonContainer: {
    backgroundColor: theme.colors.textPrimary,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    width: '100%',
    marginTop: theme.spacing.md,
  },
  buttonText: {
    color: theme.colors.textOnPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: theme.spacing.lg,
  },
  linkText: {
    ...theme.typography.body,
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
});