import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Alert, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { HomeStackParamList } from '../../../routes/home.stack.routes';
import { supabase } from '../../../lib/supabase';
import CustomPicker from '../../../components/CustomPicker';
import { logPaymentActivity } from '../../utils/logs';
import { useAuth } from '../../../contexts/AuthContext';
import { checkPaymentExceeds } from '@/services/payments';
import { theme } from '../../../styles/theme';
import Icon from 'react-native-vector-icons/Feather';

type Props = StackScreenProps<HomeStackParamList, 'EditPayment'>;

type PaymentMethod = { id: number; name: string; };
type Treasurer = { id: number; name: string; };

async function checkAndUpdateRegistrationStatus(registrationId: number) {
    const { data: registration, error: regError } = await supabase
        .from('registrations')
        .select('final_price, status, payments(payed_value)')
        .eq('id', registrationId)
        .single();

    if (regError || !registration) {
        console.error('Erro ao buscar dados da inscrição para atualização de status.');
        return;
    }

    const totalPaid = registration.payments.reduce((sum, p) => sum + p.payed_value, 0);

    if (totalPaid >= registration.final_price && registration.status === 'Em andamento') {
        await supabase
            .from('registrations')
            .update({ status: 'Concluido' })
            .eq('id', registrationId);
    }
}

export default function EditPaymentScreen({ route, navigation }: Props) {
   const { paymentId, registrationId } = route.params;
    const { session } = useAuth();

    const [originalPayment, setOriginalPayment] = useState<any>(null);
    const [amount, setAmount] = useState('');
    const [paymentDate, setPaymentDate] = useState('');
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
                setAmount(pData.payed_value.toString().replace('.', ','));
                setSelectedPaymentMethodId(pData.payment_method_id);
                setSelectedTreasurerId(pData.treasurer_id);
                if (pData.payment_date) {
                    const formattedDate = new Date(pData.payment_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
                    setPaymentDate(formattedDate);
                }
            } else {
                Alert.alert('Erro', 'Não foi possível carregar os dados do pagamento.');
                navigation.goBack();
            }
            setLoading(false);
        }
        fetchInitialData();
    }, [paymentId, navigation]);

    const handleDateChange = (text: string) => {
        const cleaned = text.replace(/[^0-9]/g, '');
        let formatted = cleaned;
        if (cleaned.length > 2) {
            formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
        }
        if (cleaned.length > 4) {
            formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
        }
        setPaymentDate(formatted);
    };

    async function handleUpdate() {
        if (!amount || !selectedPaymentMethodId || !selectedTreasurerId || !paymentDate) {
            Alert.alert('Atenção', 'Todos os campos são obrigatórios.');
            return;
        }

        const numericAmount = parseFloat(amount.replace(',', '.'));

        const dateParts = paymentDate.split('/');
        if (dateParts.length !== 3 || dateParts[2].length !== 4) {
            Alert.alert('Data Inválida', 'Por favor, use o formato DD/MM/AAAA para a data do pagamento.');
            return;
        }

        const formattedDateForDB = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;

        setSaving(true);

        const updatePayment = async () => {
            const updatedData = {
                payment_method_id: selectedPaymentMethodId,
                payed_value: numericAmount,
                treasurer_id: selectedTreasurerId,
                payment_date: formattedDateForDB,
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

                await checkAndUpdateRegistrationStatus(registrationId);
                Alert.alert('Sucesso!', 'Pagamento atualizado com sucesso.');
                navigation.goBack();
            }
        };

        const check = await checkPaymentExceeds(
            supabase,
            registrationId,
            numericAmount,
            paymentId
        );

        if (check.exceeds) {
            Alert.alert(
                'Valor acima do esperado',
                `Total ficará em R$ ${check.total.toFixed(2)}, acima de R$ ${check.expected.toFixed(2)}.`,
                [
                    { text: 'Cancelar', style: 'cancel', onPress: () => setSaving(false) },
                    { text: 'Continuar', onPress: updatePayment }
                ]
            );
            return;
        }

        await updatePayment();
    }

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.textPrimary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.headerTitleContainer}>
                        <TouchableOpacity 
                            style={styles.backButton} 
                            onPress={() => navigation.goBack()}
                        >
                            <Icon name="chevron-left" size={30} color={theme.colors.textPrimary} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle} numberOfLines={1}>
                            Editar Pagamento
                        </Text>
                    </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                    <Text style={styles.label}>Valor do Pagamento (R$)</Text>
                    <TextInput 
                        style={styles.input} 
                        value={amount} 
                        onChangeText={setAmount} 
                        keyboardType="numeric" 
                        placeholderTextColor={theme.colors.textSecondary}
                    />

                    <Text style={styles.label}>Data do Pagamento</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="DD/MM/AAAA"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={paymentDate}
                        onChangeText={handleDateChange}
                        keyboardType="numeric"
                        maxLength={10}
                    />

                    <Text style={styles.label}>Forma de Pagamento</Text>
                    <CustomPicker 
                        selectedValue={selectedPaymentMethodId} 
                        onValueChange={setSelectedPaymentMethodId} 
                        items={paymentMethods.map(pm => ({ label: pm.name, value: pm.id }))}
                        label="Selecione a forma..."
                    />
                    <Text style={styles.label}>Recebido por (Tesoureiro)</Text>
                    <CustomPicker 
                        selectedValue={selectedTreasurerId} 
                        onValueChange={setSelectedTreasurerId} 
                        items={treasurers.map(t => ({ label: t.name, value: t.id }))} 
                        label="Selecione o tesoureiro..."
                    />
                    
                    <TouchableOpacity 
                        style={styles.buttonContainer} 
                        onPress={handleUpdate} 
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator color={theme.colors.textOnPrimary} />
                        ) : (
                            <Text style={styles.buttonText}>Salvar Alterações</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { 
        flex: 1, 
        backgroundColor: theme.colors.background 
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    },
    container: { 
        flex: 1,
        width: '80%',
        alignSelf: 'center',
    },
    header: {
        marginVertical: theme.spacing.lg,
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    backButton: {
        zIndex: 1, 
    },
    headerTitle: {
        ...theme.typography.header,
        position: 'absolute',
        left: 0,
        right: 0,
        textAlign: 'center',
        paddingHorizontal: 40, 
    },
    label: {
        ...theme.typography.body,
        fontWeight: 'bold',
        marginBottom: theme.spacing.sm,
        marginTop: theme.spacing.md,
        color: theme.colors.textPrimary,
    },
    input: {
        ...theme.cardStyle,
        paddingHorizontal: theme.spacing.md,
        height: 50,
        fontSize: 16,
        color: theme.colors.textPrimary,
    },
    buttonContainer: {
        backgroundColor: theme.colors.textPrimary,
        borderRadius: 10,
        padding: 14,
        alignItems: 'center',
        width: '100%',
        marginTop: theme.spacing.lg,
    },
    buttonText: {
        color: theme.colors.textOnPrimary,
        fontSize: 18,
        fontWeight: 'bold',
    },
});