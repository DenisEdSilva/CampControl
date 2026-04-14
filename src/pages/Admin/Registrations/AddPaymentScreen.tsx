import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Alert, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
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

type Props = StackScreenProps<HomeStackParamList, 'AddPayment'>;

type PaymentMethod = { id: number; name: string; };
type Treasurer = { id: number; name: string };

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

export default function AddPaymentScreen({ route, navigation }: Props) {
    const { session } = useAuth();
    const { registrationId } = route.params;

    const [amount, setAmount] = useState('');
    const [paymentDate, setPaymentDate] = useState('');
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

        const dateParts = paymentDate.split('/');
        if (dateParts.length !== 3 || dateParts[2].length !== 4) {
            Alert.alert('Data Inválida', 'Por favor, use o formato DD/MM/AAAA para a data do pagamento.');
            return;
        }

        const formattedDateForDB = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;

        setSaving(true);

        const insertPayment = async () => {
            const { data: paymentData, error } = await supabase
                .from('payments')
                .insert([{
                    registration_id: registrationId,
                    payment_method_id: selectedPaymentMethodId,
                    payed_value: numericAmount,
                    payment_date: formattedDateForDB,
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

                await checkAndUpdateRegistrationStatus(registrationId);
                Alert.alert('Sucesso!', 'Pagamento registrado com sucesso.');
                navigation.goBack();
            }
        };

        const check = await checkPaymentExceeds(supabase, registrationId, numericAmount);

        if (check.exceeds) {
            Alert.alert(
                'Valor acima do esperado',
                `Total ficará em R$ ${check.total.toFixed(2)}, acima de R$ ${check.expected.toFixed(2)}.`,
                [
                    { text: 'Cancelar', style: 'cancel', onPress: () => setSaving(false) },
                    { text: 'Continuar', onPress: insertPayment }
                ]
            );
            return;
        }

        await insertPayment();
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
                            Adicionar Pagamento
                        </Text>
                    </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                    <Text style={styles.label}>Valor do Pagamento (R$)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ex: 100,00"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="numeric"
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
                        onPress={handleSave} 
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator color={theme.colors.textOnPrimary} />
                        ) : (
                            <Text style={styles.buttonText}>Salvar Pagamento</Text>
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