import React, { useState } from 'react';
import { 
    TextInput, 
    Alert, 
    StyleSheet, 
    Text, 
    TouchableOpacity, 
    View, 
    ActivityIndicator, 
    KeyboardAvoidingView 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { PlusStackParamList } from '../../../routes/plus.stack.routes';
import { theme } from '../../../styles/theme';
import Icon from 'react-native-vector-icons/Feather';

import { useAuth } from '../../../contexts/AuthContext';

type Props = StackScreenProps<PlusStackParamList, 'ChangePassword'>;

export default function ChangePasswordScreen({ navigation }: Props) {
  const { changePassword } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  function togglePasswordVisibility() {
    setIsPasswordVisible(!isPasswordVisible);
  }
  
  function toggleConfirmVisibility() {
    setIsConfirmVisible(!isConfirmVisible);
  }

  async function handleUpdatePassword() {
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

    const success = await changePassword(newPassword);

    setLoading(false);

    if (success) {
      navigation.goBack();
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
            <View style={styles.headerTitleContainer}>
                <TouchableOpacity 
                    style={styles.backButton} 
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="chevron-left" size={30} color={theme.colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Alterar Senha</Text>
            </View>
        </View>

        <KeyboardAvoidingView 
            style={styles.container} 
            behavior="height"
        >
            <View style={styles.form}>
                <Text style={styles.instructions}>
                    Digite sua nova senha abaixo. Você será deslogado de outras sessões após a alteração.
                </Text>

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
                    onPress={handleUpdatePassword}
                    disabled={loading}
                >
                {loading ? (
                    <ActivityIndicator color={theme.colors.textOnPrimary} />
                ) : (
                    <Text style={styles.buttonText}>Salvar Nova Senha</Text>
                )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f6e9cf',
    },
    header: {
        width: '80%',
        alignSelf: 'center',
        marginVertical: theme.spacing.lg,
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        zIndex: 1, 
    },
    headerTitle: {
        ...theme.typography.header,
        position: 'absolute',
        left: 0,
        right: 0,
        textAlign: 'center',
        paddingHorizontal: 40, 
    },
    container: {
        flex: 1,
        justifyContent: 'center', // Alinha o formulário ao centro
        width: '80%',
        alignSelf: 'center',
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
});