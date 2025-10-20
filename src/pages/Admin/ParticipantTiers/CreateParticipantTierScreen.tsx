import React, { useState } from 'react';
import { View, TextInput, Button, Alert, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { PlusStackParamList } from '../../../routes/plus.stack.routes';
import { supabase } from '../../../lib/supabase';

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
        <View style={styles.container}>
            <Text style={styles.label}>Novo Nível de Participante</Text>
            <TextInput
                style={styles.input}
                placeholder="Ex: Adulto, Criança, Equipe de Apoio"
                value={name}
                onChangeText={setName}
            />
            {loading ? (
                <ActivityIndicator size="large" color="#007BFF" />
            ) : (
                <Button title="Criar Nível" onPress={handleSave} disabled={loading} />
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