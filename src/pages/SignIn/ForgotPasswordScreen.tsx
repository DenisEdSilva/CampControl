import React, { useState } from 'react';
import { TextInput, Alert, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { StackScreenProps } from '@react-navigation/stack';
import { AuthRoutesParamList } from '../../routes/auth.routes';
import { theme } from '../../styles/theme';
import Logo from '../../../assets/logo.svg';
import Icon from 'react-native-vector-icons/Feather';

type Props = StackScreenProps<AuthRoutesParamList, 'ForgotPasswordScreen'>;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const LOGO_WIDTH = 300;
  const LOGO_ASPECT_RATIO = 1.48;
  const LOGO_HEIGHT = LOGO_WIDTH / LOGO_ASPECT_RATIO;

  async function handleSendResetLink() {
    if (!email) {
      Alert.alert('Atenção', 'Por favor, insira seu e-mail para enviarmos o link.');
      return;
    } 

    setLoading(true);
    const redirectTo = 'com.denis.campcontrol://reset-password'; 

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo,
    });

    setLoading(false);

    if (error) {
      console.error('Erro ao redefinir senha:', error);
      Alert.alert('Erro', 'Não foi possível enviar o e-mail de redefinição. Verifique se o e-mail está correto e tente novamente.');
    } else {
      Alert.alert(
        'Verifique seu e-mail', 
        `Enviamos um link de redefinição de senha para ${email}.`
      );
      navigation.goBack();
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior="height"
      >
        <View style={styles.header}>
          <Logo 
            width={LOGO_WIDTH}
            height={LOGO_HEIGHT}
            color={theme.colors.textPrimary}
          />
        </View>

        <View style={styles.form}>
          <Text style={styles.title}>Esqueceu a senha?</Text>
          <Text style={styles.instructions}>
            Não se preocupe. Insira seu e-mail abaixo e enviaremos um link para você criar uma nova senha.
          </Text>

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

          <TouchableOpacity 
            style={styles.buttonContainer}
            onPress={handleSendResetLink}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.textOnPrimary} />
            ) : (
              <Text style={styles.buttonText}>Enviar Link de Recuperação</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.linkButton} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.linkText}>Lembrou a senha? <Text style={{fontWeight: 'bold'}}>Voltar ao Login</Text></Text>
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
  title: {
    ...theme.typography.header,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    fontSize: 24,
  },
  instructions: {
    ...theme.typography.body,
    textAlign: 'center',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
    fontSize: 16,
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