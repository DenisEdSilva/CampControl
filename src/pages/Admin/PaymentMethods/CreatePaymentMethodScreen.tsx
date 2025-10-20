import React, { useState } from 'react';
import { View, TextInput, Button, Alert, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { PlusStackParamList } from '../../../routes/plus.stack.routes';
import { supabase } from '../../../lib/supabase';

type Props = StackScreenProps<PlusStackParamList, 'CreatePaymentMethodScreen'>;

export default function CreatePaymentMethodScreen({ navigation }: Props) {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSave() {
        if (!name.trim()) {
            Alert.alert('Atenção', 'O nome do Método de Pagamento não pode estar vazio.');
            return;
        }
        setLoading(true);
        const { error } = await supabase
            .from('payment_methods')
            .insert([{ name: name.trim() }]);

        setLoading(false);
        if (error) {
            Alert.alert('Erro', `Não foi possível cadastrar o método de pagamento.`);
        } else {
            Alert.alert('Sucesso!', `Método de pagamento cadastrado com sucesso.`);
            navigation.goBack();
        }
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.label}>Novo Método de Pagamento</Text>
                <TextInput 
                    style={styles.input}
                    placeholder="Ex: Pix, Cartão de Crédito..."
                    value={name}
                    onChangeText={setName}
                />

                {loading ? (
                    <ActivityIndicator size="large" color="#007BFF" />
                ) : (
                    <Button title="Cadastrar Forma de Pagamento" onPress={handleSave} />
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
        padding: 20, 
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