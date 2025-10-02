import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Alert, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { PlusStackParamList } from '../../../routes/plus.stack.routes';
import { supabase } from '../../../lib/supabase';

type Props = StackScreenProps<PlusStackParamList, 'EditParticipantTierScreen'>;

export default function EditParticipantTierScreen({ route, navigation }: Props) {
    const { tierId } = route.params;
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function fetchInitialData() {
            const { data, error } = await supabase
                .from('participant_tiers')
                .select('name')
                .eq('id', tierId)
                .single();

            setLoading(false);
            if (error) {
                Alert.alert('Erro', 'Não foi possível carregar os dados para edição.');
                navigation.goBack();
            } else {
                setName(data.name);
            }
        }
        fetchInitialData();
    }, [tierId, navigation]);

    async function handleUpdate() {
        if (!name.trim()) {
            Alert.alert('Atenção', 'O nome não pode ficar em branco.');
            return;
        }
        setSaving(true);
        const { error } = await supabase
            .from('participant_tiers')
            .update({ name: name.trim() })
            .eq('id', tierId);
            
        setSaving(false);
        if (error) {
            Alert.alert('Erro', 'Não foi possível atualizar o nível de participante.');
        } else {
            Alert.alert('Sucesso!', 'Nível atualizado com sucesso.');
            navigation.goBack();
        }
    }

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Editar Nível de Participante</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} />
            {saving ? (
                <ActivityIndicator size="large" color="#007BFF" />
            ) : (
                <Button title="Salvar Alterações" onPress={handleUpdate} disabled={saving} />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        padding: 20, 
        backgroundColor: '#f5f5f5' 
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    label: { 
        fontSize: 16, 
        marginBottom: 8, 
        fontWeight: 'bold', 
        color: '#333' 
    },
    input: { 
        height: 50, 
        backgroundColor: '#fff', 
        borderColor: '#ccc', 
        borderWidth: 1, 
        borderRadius: 8, 
        paddingHorizontal: 15, 
        marginBottom: 20, 
        fontSize: 16 
    },
});