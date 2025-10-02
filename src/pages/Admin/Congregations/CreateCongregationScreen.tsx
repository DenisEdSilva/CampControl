import React, { useState } from 'react';
import { View, TextInput, Button, Alert, StyleSheet, Text } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { PlusStackParamList } from '../../../routes/plus.stack.routes';
import { supabase } from '../../../lib/supabase';

type Props = StackScreenProps<PlusStackParamList, 'CreateCongregationScreen'>;

export default function CreateCongregationScreen({ navigation }: Props) {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSave() {
        if (!name.trim()) {
            Alert.alert('Atenção', 'O nome da congregação não pode estar vazio.');
            return;
        }
        setLoading(true);
        const { error } = await supabase
            .from('congregations')
            .insert([{ name: name.trim() }]);

        setLoading(false);
        if (error) {
            Alert.alert('Erro', `Não foi possível criar a congregação.`);
        } else {
            Alert.alert('Sucesso!', `Congregação criada com sucesso.`);
            navigation.goBack();
        }
    }

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Nova Congregação</Text>
            <TextInput
                style={styles.input}
                placeholder="Nome da Congregação"
                value={name}
                onChangeText={setName}
            />
            <Button title="Criar Congregação" onPress={handleSave} disabled={loading} />
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