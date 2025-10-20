import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Alert, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { PlusStackParamList } from '../../../routes/plus.stack.routes';
import { supabase } from '../../../lib/supabase';

type Props = StackScreenProps<PlusStackParamList, 'EditTreasurerScreen'>;

export default function EditTreasurerScreen({ route, navigation }: Props) {
    const { treasurerId } = route.params;
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function fetchInitialData() {
            const { data, error } = await supabase
                .from('treasurers')
                .select('name')
                .eq('id', treasurerId)
                .single();

            setLoading(false);
            if (error) {
                Alert.alert('Erro', 'Não foi possível carregar os dados para edição.');
                navigation.goBack();
            } else if (data) {
                setName(data.name);
            }
        }
        fetchInitialData();
    }, [treasurerId, navigation]);

    async function handleUpdate() {
        if (!name.trim()) {
            Alert.alert('Atenção', 'O nome não pode ficar em branco.');
            return;
        }
        setSaving(true);
        const { error } = await supabase
            .from('treasurers')
            .update({ name: name.trim() })
            .eq('id', treasurerId);
            
        setSaving(false);
        if (error) {
            Alert.alert('Erro', 'Não foi possível atualizar o tesoureiro.');
        } else {
            Alert.alert('Sucesso!', 'Tesoureiro atualizado com sucesso.');
            navigation.goBack();
        }
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" />
                </View>
            ) : (
                <View style={styles.container}>
                    <Text style={styles.label}>Editar Tesoureiro</Text>
                    <TextInput style={styles.input} value={name} onChangeText={setName} />
                    {saving ? (
                        <ActivityIndicator size="large" color="#007BFF" />
                    ) : (
                        <Button title="Salvar Alterações" onPress={handleUpdate} disabled={saving} />
                    )}
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f5f5f5'
    },
    container: { 
        flex: 1, 
        padding: 20, 
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