import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { HomeStackParamList } from '../../../routes/home.stack.routes';
import { supabase } from '../../../lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomPicker from '../../../components/CustomPicker';
import { logPaymentActivity } from '../../utils/logs';
import { useAuth } from '../../../contexts/AuthContext';

type Props = StackScreenProps<HomeStackParamList, 'AddPayment'>;

type PaymentMethod = { id: number; name: string; };
type Treasurer = { id: number; name: string };

export default function AddPaymentScreen({ route, navigation }: Props) {
    const { session } = useAuth();
    const { registrationId } = route.params;

    const [amount, setAmount] = useState('');
    const [paymentDate, setPaymentDate] = useState('')
    const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<number | undefined>();
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

    const [selectedTreasurerId, setSelectedTreasurerId] = useState<number | undefined>();
    const [treasurers, setTreasurers] = useState<Treasurer[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function fetchPickerData() {
            const paymentMethodPromise = supabase.from('payment_methods').select('*');
            const treasurerPromise = supabase.from('treasurers').select('*');
            
            const [pmResult, treasurersResult] = await Promise.all([
                paymentMethodPromise,
                treasurerPromise
            ])

            if (pmResult.data) setPaymentMethods(pmResult.data);
            if (treasurersResult.data) setTreasurers(treasurersResult.data)

            setLoading(false)
        }
        fetchPickerData();
    }, []);

    async function handleSave() {
        if (!amount || !selectedPaymentMethodId || !selectedTreasurerId || !paymentDate) {
            Alert.alert('Atenção', 'Todos os campos são obrigatórios.');
            return;
        }

        const numericAmount = parseFloat(amount.replace(',', '.'));
        if (isNaN(numericAmount) || numericAmount <= 0) {
            Alert.alert('Valor Inválido', 'Por favor, insira um valor numérico positivo.');
            return;
        }

        setSaving(true);
        const { data: paymentData, error } = await supabase
            .from('payments')
            .insert([{
                registration_id: registrationId,
                payment_method_id: selectedPaymentMethodId,
                payed_value: numericAmount,
                payment_date: paymentDate,
                treasurer_id: selectedTreasurerId,
                created_by_user_id: session?.user.id
            }])
            .select()
            .single();

        setSaving(false);
        if (error) {
            Alert.alert('Erro', 'Não foi possível salvar o pagamento.');
            console.error(error);
        } else {
            const details = `Pagamento de R$ ${numericAmount.toFixed(2)} criado.`;
            logPaymentActivity(
                session?.user.id ?? '',
                registrationId,
                paymentData.id,
                'CREATE',
                details
        );
            Alert.alert('Sucesso!', 'Pagamento registrado com sucesso.');
            navigation.goBack(); 
        }
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            {loading ? (
                <ActivityIndicator size="large" style={styles.loader} />
            ) : (
                <View style={styles.container}>
                    <Text style={styles.label}>Valor do Pagamento (R$)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ex: 100,00"
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="numeric"
                    />

                    <Text style={styles.label}>Data do Pagamento</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="DD/MM/AAAA"
                        value={paymentDate}
                        onChangeText={setPaymentDate}
                        keyboardType="default"
                    />
                    
                    <CustomPicker
                        label="Forma de Pagamento"
                        selectedValue={selectedPaymentMethodId}
                        onValueChange={setSelectedPaymentMethodId}
                        items={paymentMethods.map(pm => ({ label: pm.name, value: pm.id }))}
                    />

                    <CustomPicker
                        label="Recebido por (tesoureiro)"
                        selectedValue={selectedTreasurerId}
                        onValueChange={setSelectedTreasurerId}
                        items={treasurers.map(t => ({ label: t.name, value: t.id }))}
                    />

                    <View style={styles.buttonContainer}>
                        <Button title={saving ? "Salvando..." : "Salvar Pagamento"} onPress={handleSave} disabled={saving} />
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { 
        flex: 1, 
        backgroundColor: '#fff' 
    },
    container: { 
        flex: 1, 
        padding: 20, 
        justifyContent: 'center' 
    },
    loader: { 
        flex: 1, 
        justifyContent: 'center' 
    },
    label: { 
        fontSize: 16, 
        fontWeight: 'bold', 
        marginBottom: 8, 
        color: '#333' 
    },
    input: { 
        height: 50, 
        backgroundColor: '#f5f5f5', 
        borderColor: '#ccc', 
        borderWidth: 1, 
        borderRadius: 8, 
        paddingHorizontal: 15, 
        marginBottom: 20, 
        fontSize: 16 
    },
    buttonContainer: {
        marginTop: 20,
    }
});