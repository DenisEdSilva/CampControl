import React, { useState } from 'react';
import { View, TextInput, Alert, StyleSheet, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { PlusStackParamList } from '../../../routes/plus.stack.routes';
import { supabase } from '../../../lib/supabase';
import { theme } from '../../../styles/theme';
import Icon from 'react-native-vector-icons/Feather';

type Props = StackScreenProps<PlusStackParamList, 'CreateParticipantTierScreen'>;

export default function CreateParticipantTierScreen({ navigation }: Props) {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSave() {
        if (!name.trim()) {
            Alert.alert('Atenção', 'O nome do nível não pode estar vazio.');
            return;
        }
        setLoading(true);
        const { error } = await supabase
            .from('participant_tiers')
            .insert([{ name: name.trim() }]);

        setLoading(false);
        if (error) {
            Alert.alert('Erro', `Não foi possível criar o nível de participante.`);
        } else {
            Alert.alert('Sucesso!', `Nível criado com sucesso.`);
            navigation.goBack();
        }
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
                            Novo Nível
                        </Text>
                    </View>
                </View>

                <View style={styles.form}>
                    <Text style={styles.label}>Novo Tipo de inscrição</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ex: 11+ Anos"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={name}
                        onChangeText={setName}
                    />
                    
                    <TouchableOpacity 
                        style={styles.buttonContainer} 
                        onPress={handleSave} 
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={theme.colors.textOnPrimary} />
                        ) : (
                            <Text style={styles.buttonText}>Criar Nível</Text>
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