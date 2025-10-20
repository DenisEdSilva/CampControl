import React, { useState } from 'react';
import { View, TextInput, Button, Alert, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { PlusStackParamList } from '../../../routes/plus.stack.routes';
import { supabase } from '../../../lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = StackScreenProps<PlusStackParamList, 'CreateRegistrationPackageScreen'>;

export default function CreateRegistrationPackageScreen({ navigation }: Props) {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSave() {
        if (!name.trim()) {
            Alert.alert('Atenção', 'A descrição do pacote não pode estar vazia.');
            return;
        }
        setLoading(true);
        const { error } = await supabase
            .from('registration_packages')
            .insert([{ name: name.trim() }]);

        setLoading(false);
        if (error) {
            Alert.alert('Erro', `Não foi possível criar o pacote de inscrição.`);
        } else {
            Alert.alert('Sucesso!', `Pacote criado com sucesso.`);
            navigation.goBack();
        }
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.label}>Novo Pacote de Inscrição</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ex: Integral, Diária, Apenas Kit"
                    value={name}
                    onChangeText={setName}
                />
                {loading ? (
                    <ActivityIndicator size="large" color="#007BFF" />
                ) : (
                    <Button title="Criar Pacote" onPress={handleSave} disabled={loading} />
                )}
            </View>
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
        padding: 20 
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