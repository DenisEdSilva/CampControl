import React, { useState } from 'react';
import { TextInput, Alert, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { StackScreenProps } from '@react-navigation/stack';
import { AuthRoutesParamList } from '../../routes/auth.routes';
import { theme } from '../../styles/theme';
import Logo from '../../../assets/logo.svg';
import Icon from 'react-native-vector-icons/Feather';

type Props = StackScreenProps<AuthRoutesParamList, 'SignIn'>;

export default function SignIn({ navigation }: Props) {
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
      Alert.alert('Erro no login', 'E-mail ou senha inválidos. Tente novamente.');
    }
    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container}
      >
        <View style={styles.header}>
            <Logo 
                width={LOGO_WIDTH}
                height={LOGO_HEIGHT}
                color={theme.colors.textPrimary}
            />
        </View>

        <View style={styles.form}>
            <Text style={styles.label}>E-mail</Text>
            <View style={styles.inputContainer}>
              <Icon name="mail" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="email@email.com"
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
                placeholder="Sua senha"
                placeholderTextColor={theme.colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!isPasswordVisible}
              />
              <TouchableOpacity onPress={togglePasswordVisibility} style={styles.inputIcon}>
                <Icon 
                  onPress={togglePasswordVisibility}
                  name={isPasswordVisible ? "eye" : "eye-off"}
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
                style={styles.buttonContainer}
                onPress={handleSignIn}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color={theme.colors.textOnPrimary} />
                ) : (
                    <Text style={styles.buttonText}>Entrar</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity 
                style={styles.linkButton} 
                onPress={() => navigation.navigate('SignUp')}
            >
                <Text style={styles.linkText}>Não tem uma conta? <Text style={{fontWeight: 'bold'}}>Cadastre-se</Text></Text>
            </TouchableOpacity>
            <TouchableOpacity 
                style={styles.linkButton} 
                onPress={() => navigation.navigate('ForgotPasswordScreen')}
            >
                <Text style={styles.linkText}>Esqueceu a senha? <Text style={{fontWeight: 'bold'}}>Pressione aqui</Text></Text>
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