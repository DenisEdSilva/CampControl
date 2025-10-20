import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { HomeStackParamList } from '../../../routes/home.stack.routes';
import { supabase } from '../../../lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomPicker from '../../../components/CustomPicker';
import { logPaymentActivity } from '../../utils/logs';
import { useAuth } from '../../../contexts/AuthContext';

type Props = StackScreenProps<HomeStackParamList, 'EditPayment'>;

type PaymentMethod = { id: number; name: string; };
type Treasurer = { id: number; name: string; };

export default function EditPaymentScreen({ route, navigation }: Props) {
   const { paymentId, registrationId } = route.params;
    const { session } = useAuth();

    const [originalPayment, setOriginalPayment] = useState<any>(null);
    const [amount, setAmount] = useState('');
    const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<number | undefined>();
    const [selectedTreasurerId, setSelectedTreasurerId] = useState<number | undefined>();
    
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [treasurers, setTreasurers] = useState<Treasurer[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function fetchInitialData() {
            const paymentPromise = supabase.from('payments').select('*').eq('id', paymentId).single();
            const paymentMethodsPromise = supabase.from('payment_methods').select('*');
            const treasurersPromise = supabase.from('treasurers').select('*');

            const [paymentResult, pmResult, treasurersResult] = await Promise.all([paymentPromise, paymentMethodsPromise, treasurersPromise]);

            if (pmResult.data) setPaymentMethods(pmResult.data);
            if (treasurersResult.data) setTreasurers(treasurersResult.data);

            if (paymentResult.data) {
                const pData = paymentResult.data;
                setOriginalPayment(pData);
                setAmount(pData.payed_value.toString());
                setSelectedPaymentMethodId(pData.payment_method_id);
                setSelectedTreasurerId(pData.treasurer_id);
            } else {
                Alert.alert('Erro', 'Não foi possível carregar os dados do pagamento.');
                navigation.goBack();
            }
            setLoading(false);
        }
        fetchInitialData();
    }, [paymentId, navigation]);

    async function handleUpdate() {
        if (!amount || !selectedPaymentMethodId || !selectedTreasurerId) {
            Alert.alert('Atenção', 'Todos os campos são obrigatórios.');
            return;
        }
        const numericAmount = parseFloat(amount.replace(',', '.'));

        setSaving(true);

        const updatedData = {
            payment_method_id: selectedPaymentMethodId,
            payed_value: numericAmount,
            treasurer_id: selectedTreasurerId,
        };

        const { error } = await supabase
            .from('payments')
            .update(updatedData)
            .eq('id', paymentId);

        setSaving(false);
        if (error) {
            Alert.alert('Erro', 'Não foi possível atualizar o pagamento.');
        } else {
            if (session?.user.id && originalPayment) {
                let details = 'Pagamento atualizado. ';
                if (originalPayment.payed_value !== numericAmount) {
                    details += `Valor alterado de R$ ${originalPayment.payed_value.toFixed(2)} para R$ ${numericAmount.toFixed(2)}. `;
                }
                
                logPaymentActivity(
                    session.user.id ?? '',
                    registrationId,
                    paymentId,
                    'UPDATE',
                    details
                );
            }
            Alert.alert('Sucesso!', 'Pagamento atualizado com sucesso.');
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
                        value={amount} 
                        onChangeText={setAmount} 
                        keyboardType="numeric" 
                        />
                    <CustomPicker 
                        label="Forma de Pagamento" 
                        selectedValue={selectedPaymentMethodId} 
                        onValueChange={setSelectedPaymentMethodId} 
                        items={paymentMethods.map(pm => ({ label: pm.name, value: pm.id }))} 
                    />
                    <CustomPicker 
                        label="Recebido por (Tesoureiro)" 
                        selectedValue={selectedTreasurerId} 
                        onValueChange={setSelectedTreasurerId} 
                        items={treasurers.map(t => ({ label: t.name, value: t.id }))} 
                    />
                    <View style={styles.buttonContainer}>
                        <Button title={saving ? "Salvando..." : "Salvar Alterações"} onPress={handleUpdate} disabled={saving} />
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
        marginTop: 20 
    },
});