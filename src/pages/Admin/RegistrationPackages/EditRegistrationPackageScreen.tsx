import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Alert, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { PlusStackParamList } from '../../../routes/plus.stack.routes';
import { supabase } from '../../../lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = StackScreenProps<PlusStackParamList, 'EditRegistrationPackageScreen'>;

export default function EditRegistrationPackageScreen({ route, navigation }: Props) {
    const { packageId } = route.params;
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function fetchInitialData() {
            const { data, error } = await supabase
                .from('registration_packages')
                .select('name')
                .eq('id', packageId)
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
    }, [packageId, navigation]);

    async function handleUpdate() {
        if (!name.trim()) {
            Alert.alert('Atenção', 'A descrição não pode ficar em branco.');
            return;
        }
        setSaving(true);
        const { error } = await supabase
            .from('registration_packages')
            .update({ name: name.trim() })
            .eq('id', packageId);
            
        setSaving(false);
        if (error) {
            Alert.alert('Erro', 'Não foi possível atualizar o pacote de inscrição.');
        } else {
            Alert.alert('Sucesso!', 'Pacote atualizado com sucesso.');
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
        <SafeAreaView style={styles.safeArea}>
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" />
                </View>
            ) : (
                <View style={styles.container}>
                    <Text style={styles.label}>Editar Pacote de Inscrição</Text>
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