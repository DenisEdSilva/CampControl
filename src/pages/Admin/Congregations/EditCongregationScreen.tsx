import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Alert, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { PlusStackParamList } from '../../../routes/plus.stack.routes';
import { supabase } from '../../../lib/supabase';

type Props = StackScreenProps<PlusStackParamList, 'EditCongregationScreen'>;

export default function EditCongregationScreen({ route, navigation }: Props) {
    const { congregationId } = route.params;
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchInitialData() {
            const { data, error } = await supabase
                .from('congregations')
                .select('name')
                .eq('id', congregationId)
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
    }, [congregationId, navigation]);

    async function handleUpdate() {
        if (!name.trim()) {
            Alert.alert('Atenção', 'O nome não pode ficar em branco.');
            return;
        }
        setLoading(true);
        const { error } = await supabase
            .from('congregations')
            .update({ name: name.trim() })
            .eq('id', congregationId);
            
        setLoading(false);
        if (error) {
            Alert.alert('Erro', 'Não foi possível atualizar a congregação.');
        } else {
            Alert.alert('Sucesso!', 'Congregação atualizada.');
            navigation.goBack();
        }
    }

    if(loading) return <ActivityIndicator />

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Editar Nome da Congregação</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} />
            <Button title="Salvar Alterações" onPress={handleUpdate} disabled={loading} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
    label: { fontSize: 16, marginBottom: 8, fontWeight: 'bold', color: '#333' },
    input: { height: 50, backgroundColor: '#fff', borderColor: '#ccc', borderWidth: 1, borderRadius: 8, paddingHorizontal: 15, marginBottom: 20, fontSize: 16 },
});