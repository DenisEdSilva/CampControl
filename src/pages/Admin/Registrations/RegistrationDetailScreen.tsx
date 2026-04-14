import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { HomeStackParamList } from '../../../routes/home.stack.routes';
import { supabase } from '../../../lib/supabase';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { useAuth } from '../../../contexts/AuthContext';
import { logPaymentActivity } from '../../utils/logs';
import { theme } from '../../../styles/theme';

type Props = StackScreenProps<HomeStackParamList, 'RegistrationDetail'>;

type RegistrationDetails = {
    id: number;
    final_price: number;
    status: string;
    participants: { name: string };
    congregations: { name: string };
    participant_tiers: { name: string };
    registration_packages: { name: string };
    payments: { 
        id: number; 
        payed_value: number; 
        payment_date: string; 
        payment_methods: { name: string }; 
        treasurer_id: { name: string },
        created_by_user_id: { name: string },
    }[];
};

type ListHeaderProps = {
    details: RegistrationDetails;
    navigation: Props['navigation'];
    onCancel: () => void;
    onRestore: () => void;
}

const ListHeader = ({ details, navigation, onCancel, onRestore }: ListHeaderProps) => {
    if (!details) return null;

    const totalPaid = details.payments.reduce((sum, p) => sum + p.payed_value, 0);
    const balanceDue = details.final_price - totalPaid;

    return (
        <View>
            <View style={styles.balanceSection}>
                <View style={styles.balanceBox}>
                    <Text style={styles.balanceLabel}>Valor Total</Text>
                    <Text style={styles.balanceValue}>R$ {details.final_price.toFixed(2).replace('.', ',')}</Text>
                </View>
                <View style={styles.balanceBox}>
                    <Text style={styles.balanceLabel}>Total Pago</Text>
                    <Text style={[styles.balanceValue, styles.paidValue]}>R$ {totalPaid.toFixed(2).replace('.', ',')}</Text>
                </View>
                <View style={styles.balanceBox}>
                    <Text style={styles.balanceLabel}>Saldo Devedor</Text>
                    <Text style={[styles.balanceValue, balanceDue > 0 ? styles.dueValue : styles.paidValue]}>
                        {balanceDue > 0 ? `R$ ${balanceDue.toFixed(2).replace('.', ',')}` : 'Quitado'}
                    </Text>
                </View>
            </View>

            <View style={styles.infoSection}>
                <Text style={styles.infoText}><Text style={styles.infoLabel}>Congregação:</Text> {details.congregations.name}</Text>
                <Text style={styles.infoText}><Text style={styles.infoLabel}>Plano:</Text> {details.participant_tiers.name} - {details.registration_packages.name}</Text>
            </View>

            <View style={styles.actionsSection}>
                {details.status !== 'Cancelado' ? (
                    <>
                        <TouchableOpacity 
                            style={styles.button}
                            onPress={() => navigation.navigate('EditRegistration', { registrationId: details.id })}
                        >
                            <Icon name="edit" size={16} color={theme.colors.textOnPrimary} style={styles.buttonIcon}/>
                            <Text style={styles.buttonText}>Editar Inscrição</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.button, {backgroundColor: theme.colors.accent, marginTop: theme.spacing.sm}]}
                            onPress={onCancel}
                        >
                            <Icon name="x-circle" size={16} color={theme.colors.textOnPrimary} style={styles.buttonIcon}/>
                            <Text style={styles.buttonText}>Cancelar Inscrição</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <TouchableOpacity 
                        style={[styles.button, {backgroundColor: '#28a745'}]}
                        onPress={onRestore}
                    >
                        <Icon name="rotate-ccw" size={16} color={theme.colors.textOnPrimary} style={styles.buttonIcon}/>
                        <Text style={styles.buttonText}>Restaurar Inscrição</Text>
                    </TouchableOpacity>
                )}
            </View>
            
            <View style={styles.listHeader}>
                <Text style={styles.sectionTitle}>Histórico de Pagamentos</Text>
                {details.status !== 'Cancelado' && (
                    <TouchableOpacity 
                        style={styles.addButton}
                        onPress={() => navigation.navigate('AddPayment', { registrationId: details.id })}
                    >
                        <Icon name="plus" size={18} color={theme.colors.textOnPrimary}/>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

export default function RegistrationDetailScreen({ route, navigation }: Props) {
    const { registrationId } = route.params;
    const { session } = useAuth();
    const [loading, setLoading] = useState(true);
    const [details, setDetails] = useState<RegistrationDetails | null>(null);

    const fetchDetails = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('registrations')
            .select(`
                id, final_price, status,
                participants ( name ),
                congregations ( name ),
                participant_tiers ( name ),
                registration_packages ( name ),
                payments ( id, payed_value, payment_date, payment_methods ( name ), treasurer_id (name), created_by_user_id ( name ) )
            `)
            .eq('id', registrationId)
            .single();

        if (error) {
            console.error("Erro ao buscar detalhes da inscrição:", error);
            Alert.alert('Erro', 'Não foi possível carregar os detalhes desta inscrição.');
            navigation.goBack();
        } else if (data) {
            setDetails(data as any);
        }
        setLoading(false);
    }, [registrationId, navigation]);

    useFocusEffect(
        useCallback(() => {
            fetchDetails();
        }, [fetchDetails])
    );

    async function handleCancelRegistration() {
        if (!details) return;

        Alert.alert(
            "Confirmar Cancelamento",
            `Tem certeza que deseja cancelar a inscrição de "${details.participants.name}"? Esta ação registrará a inscrição como cancelada.`,
            [
                { text: "Voltar", style: "cancel" },
                {
                    text: "Sim, Cancelar",
                    style: "destructive",
                    onPress: async () => {
                        const { error } = await supabase
                            .from('registrations')
                            .update({ status: 'Cancelado' })
                            .eq('id', registrationId);

                        if (error) {
                            Alert.alert("Erro", "Não foi possível cancelar a inscrição.");
                        } else {
                            if (session?.user.id) {
                                const logDetails = `Inscrição de "${details.participants.name}" foi cancelada.`;
                                logPaymentActivity(session.user.id, registrationId, null, 'CANCELLED', logDetails);
                            }
                            Alert.alert("Sucesso", "A inscrição foi cancelada.");
                            fetchDetails();
                        }
                    }
                }
            ]
        );
    }

    async function handleRestoreRegistration() {
        if (!details) return;

        Alert.alert(
            "Confirmar Restauração",
            `Tem certeza que deseja restaurar a inscrição de "${details.participants.name}"?`,
            [
                { text: "Voltar", style: "cancel" },
                {
                    text: "Sim, Restaurar",
                    onPress: async () => {
                        const totalPaid = details.payments.reduce((sum, p) => sum + p.payed_value, 0);
                        const newStatus = (totalPaid >= details.final_price) ? 'Concluido' : 'Em andamento';

                        const { error } = await supabase
                            .from('registrations')
                            .update({ status: newStatus })
                            .eq('id', registrationId);

                        if (error) {
                            Alert.alert("Erro", "Não foi possível restaurar a inscrição.");
                        } else {
                            if (session?.user.id) {
                                const logDetails = `Inscrição de "${details.participants.name}" foi restaurada.`;
                                logPaymentActivity(session.user.id, registrationId, null, 'RESTORED', logDetails);
                            }
                            Alert.alert("Sucesso", "A inscrição foi restaurada.");
                            setDetails(prev => prev ? { ...prev, status: newStatus } : null);
                        }
                    }
                }
            ]
        );
    }

    const handleDeletePayment = useCallback(async (paymentId: number, payedValue: number) => {
        if (!details) return;

        Alert.alert(
            "Confirmar Exclusão",
            `Tem certeza que deseja excluir o pagamento de R$ ${payedValue.toFixed(2).replace('.', ',')}? Esta ação não pode ser desfeita.`,
            [
                { text: "Voltar", style: "cancel" },
                {
                    text: "Sim, Excluir",
                    style: "destructive",
                    onPress: async () => {
                        const { error: logUpdateError } = await supabase
                            .from('payment_logs')
                            .update({ payment_id: null })
                            .eq('payment_id', paymentId);

                        if (logUpdateError) {
                            console.error("Erro ao atualizar os logs: ", logUpdateError);
                            Alert.alert("Erro ao preparar para a exclusão deste pagamento. Informar ao administrador.");
                            return;
                        }

                        const { error: deleteError } = await supabase
                            .from('payments')
                            .delete()
                            .eq('id', paymentId);

                        if (deleteError) {
                            Alert.alert("Erro", "Não foi possível excluir o pagamento.");
                            console.error("Erro ao excluir pagamento:", deleteError);
                        } else {
                            if (session?.user.id) {
                                const logDetails = `Pagamento de R$ ${payedValue.toFixed(2)} foi excluído da inscrição de ${details.participants.name}.`;
                                logPaymentActivity(session.user.id, registrationId, null, 'DELETE', logDetails);
                            }
                            
                            const updatedPaymentsAfterDelete = details.payments.filter(p => p.id !== paymentId);
                            const totalPaidAfterDelete = updatedPaymentsAfterDelete.reduce((sum, p) => sum + p.payed_value, 0);
                            
                            const newStatus = (totalPaidAfterDelete >= details.final_price) ? 'Concluido' : 'Em andamento';

                            if (newStatus !== details.status) {
                                await supabase
                                    .from('registrations')
                                    .update({ status: newStatus })
                                    .eq('id', registrationId);
                            }
                            
                            Alert.alert("Sucesso", "Pagamento excluído.");
                            
                            setDetails(prevDetails => {
                                if (!prevDetails) return null;
                                
                                return {
                                    ...prevDetails,
                                    payments: updatedPaymentsAfterDelete,
                                    status: newStatus,
                                };
                            });
                        }
                    }
                }
            ]
        );
    }, [details, session, registrationId, logPaymentActivity]);

    const renderPaymentItem = useCallback(({ item }: { item: RegistrationDetails['payments'][0] }) => (
        <View style={styles.paymentItem}>
            <View style={{ flex: 1, marginRight: theme.spacing.sm }}>
                <Text style={styles.paymentAmount}>R$ {item.payed_value.toFixed(2).replace('.', ',')}</Text>
                
                <Text style={styles.paymentMeta}>
                    {item.payment_methods?.name ?? 'Método desc.'} | {item.payment_date ? new Date(item.payment_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 's/ data'}
                </Text>
                
                <Text style={styles.paymentMeta}>
                    Recebido por: {item.treasurer_id?.name ?? 'Não informado'}
                </Text>
                
                <Text style={styles.paymentMeta}>
                    Registrado por: {item.created_by_user_id?.name ?? 'Não informado'}
                </Text>
            </View>
            {details?.status !== 'Cancelado' && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginRight: 6 }}>
                <TouchableOpacity onPress={() => {
                    if (details) {
                        navigation.navigate('EditPayment', { paymentId: item.id, registrationId: details.id })
                    }}
                }>
                    <Icon name="edit-2" size={20} color={theme.colors.textPrimary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { 
                    handleDeletePayment(item.id, item.payed_value) 
                }}>
                    <Icon name="x" size={26} color={theme.colors.accent} />
                </TouchableOpacity>
            </View>
            )}
        </View>
    ), [navigation, details]);

    async function handleToggleCheckIn() {
        if (!details) return;

        if (details.status !== 'Concluido' && details.status !== 'Presença Confirmada') {
            Alert.alert('Ação não permitida', 'A presença só pode ser confirmada para inscrições com pagamento concluído.');
            return;
        }

        const isCheckedIn = details.status === 'Presença Confirmada';
        const newStatus = isCheckedIn ? 'Concluido' : 'Presença Confirmada';
        const actionText = isCheckedIn ? 'Desfazer Check-in' : 'Confirmar Presença';
        const actionLog = isCheckedIn ? 'CHECK_OUT' : 'CHECK_IN';

        Alert.alert(
            `Confirmar ${actionText}`,
            `Deseja alterar o status da inscrição de "${details.participants.name}" para "${newStatus}"?`,
            [
                { text: "Voltar", style: "cancel" },
                {
                    text: `Sim, ${actionText}`,
                    onPress: async () => {
                        const { error } = await supabase
                            .from('registrations')
                            .update({ status: newStatus })
                            .eq('id', registrationId);

                        if (error) {
                            Alert.alert("Erro", `Não foi possível ${actionText.toLowerCase()}.`);
                        } else {
                            if (session?.user.id) {
                                const logDetails = `Status da inscrição alterado para ${newStatus}.`;
                                logPaymentActivity(session.user.id, registrationId, null, actionLog, logDetails);
                            }
                            Alert.alert("Sucesso", `Status alterado para "${newStatus}".`);
                            setDetails(prev => prev ? { ...prev, status: newStatus } : null);
                        }
                    }
                }
            ]
        );
    }

    const isCheckedIn = details?.status === 'Presença Confirmada';

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.textPrimary} />
            </SafeAreaView>
        );
    }

    if (!details) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>
                    <Text style={styles.emptyText}>Inscrição não encontrada.</Text>
                </View>
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
                        <Text style={styles.headerTitle} numberOfLines={2}>
                            {details.participants.name}
                        </Text>
                    </View>
                </View>

                {(details.status === 'Concluido' || details.status === 'Presença Confirmada') && (
                    <TouchableOpacity 
                        style={[styles.checkInSection, isCheckedIn && styles.checkInSectionActive]}
                        onPress={handleToggleCheckIn}
                    >
                        <Icon 
                            name={isCheckedIn ? "check-circle" : "circle"} 
                            size={24} 
                            color={isCheckedIn ? '#fff' : theme.colors.textPrimary} 
                        />
                        <Text style={[styles.checkInText, isCheckedIn && styles.checkInTextActive]}>
                            {isCheckedIn ? 'Presença Confirmada' : 'Confirmar Presença'}
                        </Text>
                    </TouchableOpacity>
                )}

                <FlatList
                    data={details.payments.sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())}
                    renderItem={renderPaymentItem}
                    keyExtractor={(item) => item.id.toString()}
                    ListHeaderComponent={
                        <ListHeader 
                            details={details} 
                            navigation={navigation}
                            onCancel={handleCancelRegistration}
                            onRestore={handleRestoreRegistration}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Nenhum pagamento registrado.</Text>
                        </View>
                    }
                    showsVerticalScrollIndicator={false}
                />
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
        width: '90%',
        alignSelf: 'center',
    },
    header: {
        marginVertical: theme.spacing.lg,
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        zIndex: 1, 
    },
    headerTitle: {
        ...theme.typography.header,
        fontSize: 28,
        position: 'absolute',
        left: 0,
        right: 0,
        textAlign: 'center',
        paddingHorizontal: 40, 
    },
    checkInSection: {
        ...theme.cardStyle,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.md,
        marginBottom: theme.spacing.lg,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    checkInSectionActive: {
        backgroundColor: '#16a34a',
        borderColor: '#15803d',
    },
    checkInText: {
        ...theme.typography.body,
        fontWeight: 'bold',
        fontSize: 18,
        marginLeft: theme.spacing.sm,
    },
    checkInTextActive: {
        color: '#fff',
    },
    infoSection: {
        ...theme.cardStyle,
        padding: theme.spacing.md,
        marginTop: theme.spacing.lg,
    },
    infoLabel: {
        fontWeight: 'bold',
    },
    infoText: {
        ...theme.typography.body,
        fontSize: 16,
        lineHeight: 24,
    },
    balanceSection: {
        ...theme.cardStyle,
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: theme.spacing.md,
    },
    balanceBox: { 
        alignItems: 'center',
        flex: 1,
    },
    balanceLabel: { 
        fontSize: 14, 
        color: theme.colors.textSecondary,
    },
    balanceValue: { 
        ...theme.typography.body,
        fontSize: 18, 
        fontWeight: 'bold', 
        marginTop: 4 
    },
    paidValue: { 
        color: '#16a34a' 
    },
    dueValue: { 
        color: theme.colors.accent
    },
    actionsSection: {
        marginTop: theme.spacing.lg,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.textPrimary,
        padding: 12,
        borderRadius: 8,
    },
    buttonIcon: {
        marginRight: theme.spacing.sm,
    },
    buttonText: {
        color: theme.colors.textOnPrimary,
        fontWeight: 'bold',
        fontSize: 16,
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: theme.spacing.lg,
        marginBottom: theme.spacing.sm,
    },
    sectionTitle: { 
        ...theme.typography.header,
        fontSize: 20,
    },
    addButton: {
        backgroundColor: theme.colors.textPrimary,
        borderRadius: 100,
        padding: 8,
    },
    paymentItem: {
        ...theme.cardStyle,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.md,
        marginBottom: theme.spacing.sm,
    },
    paymentAmount: { 
        ...theme.typography.body,
        fontSize: 18,
        fontWeight: 'bold' 
    },
    paymentMeta: { 
        fontSize: 12, 
        color: theme.colors.textSecondary,
        marginTop: 4,
    },
    emptyContainer: {
        ...theme.cardStyle,
        padding: theme.spacing.lg,
        alignItems: 'center',
    },
    emptyText: { 
        ...theme.typography.body,
        textAlign: 'center', 
        color: theme.colors.textSecondary,
    },
});