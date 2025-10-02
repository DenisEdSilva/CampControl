import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Alert, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { PlusStackParamList } from '../../../routes/plus.stack.routes';
import { supabase } from '../../../lib/supabase';

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
            <View style={styles.container}>
                <ActivityIndicator size="large" />
                <Text>Carregando dados...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Editar Nome da Forma de Pagamento</Text>
            <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
            />
            {saving ? (
                <ActivityIndicator size="large" />
            ) : (
                <Button title="Salvar Alterações" onPress={handleUpdate} />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center'
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
        fontSize: 16,
    },
});