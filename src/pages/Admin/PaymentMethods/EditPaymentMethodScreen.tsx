import React, { useState, useEffect } from 'react';
import { View, TextInput, Alert, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { PlusStackParamList } from '../../../routes/plus.stack.routes';
import { supabase } from '../../../lib/supabase';
import { theme } from '../../../styles/theme';
import Icon from 'react-native-vector-icons/Feather';

type Props = StackScreenProps<PlusStackParamList, 'EditPaymentMethodScreen'>;

export default function EditPaymentMethodScreen({ route, navigation }: Props) {
    const { paymentMethodId } = route.params;
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function fetchInitialData() {
            const { data, error } = await supabase
                .from('payment_methods')
                .select('name')
                .eq('id', paymentMethodId)
                .single();

            setLoading(false);
            if (error) {
                Alert.alert('Erro', 'Não foi possível carregar os dados para edição.');
                console.error(error);
                navigation.goBack();
            } else {
                setName(data.name);
            }
        }

        fetchInitialData();
    }, [paymentMethodId, navigation]);

    async function handleUpdate() {
        if (!name.trim()) {
            Alert.alert('Atenção', 'O nome não pode ficar em branco.');
            return;
        }

        setSaving(true);
        const { error } = await supabase
            .from('payment_methods')
            .update({ name: name.trim() })
            .eq('id', paymentMethodId);

        setSaving(false);
        if (error) {
            Alert.alert('Erro', 'Não foi possível atualizar a forma de pagamento.');
            console.error(error);
        } else {
            Alert.alert('Sucesso!', 'Forma de pagamento atualizada.');
            navigation.goBack();
        }
    }

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.textPrimary} />
            </SafeAreaView>
        );
    }
    
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.headerTitleContainer}>
                        <TouchableOpacity 
                            style={styles.backButton} 
                            onPress={() => navigation.goBack()}
                        >
                            <Icon name="chevron-left" size={30} color={theme.colors.textPrimary} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle} numberOfLines={1}>
                            Editar Método
                        </Text>
                    </View>
                </View>
                <View style={styles.form}>
                    <Text style={styles.label}>Nome da Forma de Pagamento</Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholderTextColor={theme.colors.textSecondary}
                    />
                    <TouchableOpacity 
                        style={styles.buttonContainer} 
                        onPress={handleUpdate} 
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator color={theme.colors.textOnPrimary} />
                        ) : (
                            <Text style={styles.buttonText}>Salvar Alterações</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { 
        flex: 1, 
        backgroundColor: theme.colors.background 
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    },
    container: { 
        flex: 1,
        width: '80%',
        alignSelf: 'center',
    },
    header: {
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
    form: {
        flex: 1,
    },
    label: { 
        ...theme.typography.body,
        fontWeight: 'bold',
        marginBottom: theme.spacing.sm, 
        color: theme.colors.textPrimary,
    },
    input: { 
        ...theme.cardStyle,
        paddingHorizontal: theme.spacing.md,
        height: 50,
        fontSize: 16,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.lg,
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