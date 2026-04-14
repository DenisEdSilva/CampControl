import React, { useState } from 'react';
import { TextInput, Alert, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { StackScreenProps } from '@react-navigation/stack';
import { AuthRoutesParamList } from '../../routes/auth.routes';
import { theme } from '../../styles/theme';
import Logo from '../../../assets/logo.svg';
import Icon from 'react-native-vector-icons/Feather';
import { useAuth } from '../../contexts/AuthContext';

type Props = StackScreenProps<AuthRoutesParamList, 'ResetPasswordScreen'>;

export default function ResetPasswordScreen({ navigation }: Props) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const { clearRecoveryFlag } = useAuth();

  const LOGO_WIDTH = 300;
  const LOGO_ASPECT_RATIO = 1.48;
  const LOGO_HEIGHT = LOGO_WIDTH / LOGO_ASPECT_RATIO;

  function togglePasswordVisibility() {
    setIsPasswordVisible(!isPasswordVisible);
  }
  
  function toggleConfirmVisibility() {
    setIsConfirmVisible(!isConfirmVisible);
  }

  async function handleSetNewPassword() {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Atenção', 'Por favor, preencha os dois campos.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Senha Fraca', 'A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      Alert.alert('Erro', 'Não foi possível redefinir a senha. Tente novamente.');
      console.error(error);
    } else {
      Alert.alert(
        'Sucesso!', 
        'Sua senha foi alterada. Por favor, faça o login com sua nova senha.'
      );
      await supabase.auth.signOut(); 
      
      clearRecoveryFlag();
      
      navigation.navigate('SignIn');
    }

    setLoading(false);
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
          <Text style={styles.title}>Redefinir sua Senha</Text>
          <Text style={styles.instructions}>Digite sua nova senha abaixo para completar a redefinição.</Text>

          <Text style={styles.label}>Nova Senha</Text>
          <View style={styles.inputContainer}>
            <Icon name="lock" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Sua nova senha"
              placeholderTextColor={theme.colors.textSecondary}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!isPasswordVisible}
            />
            <TouchableOpacity onPress={togglePasswordVisibility} style={styles.inputIcon}>
              <Icon 
                name={isPasswordVisible ? "eye" : "eye-off"}
                size={20}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Confirmar Nova Senha</Text>
          <View style={styles.inputContainer}>
            <Icon name="lock" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirme a senha"
              placeholderTextColor={theme.colors.textSecondary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!isConfirmVisible}
            />
            <TouchableOpacity onPress={toggleConfirmVisibility} style={styles.inputIcon}>
              <Icon 
                name={isConfirmVisible ? "eye" : "eye-off"}
                size={20}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.buttonContainer}
            onPress={handleSetNewPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.textOnPrimary} />
            ) : (
              <Text style={styles.buttonText}>Salvar Nova Senha</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.linkButton} 
            onPress={() => {
              clearRecoveryFlag();
              navigation.navigate('SignIn');
            }}
          >
            <Text style={styles.linkText}>Voltar para o Login</Text>
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