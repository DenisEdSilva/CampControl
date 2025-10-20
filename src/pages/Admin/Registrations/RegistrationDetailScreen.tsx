import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Button, Alert, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { HomeStackParamList } from '../../../routes/home.stack.routes';
import { supabase } from '../../../lib/supabase';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { useAuth } from '../../../contexts/AuthContext';
import { logPaymentActivity } from '../../utils/logs';

type Props = StackScreenProps<HomeStackParamList, 'RegistrationDetail'>;

type RegistrationDetails = {
    id: number;
    final_price: number;
    status: string;
    participants: { 
        name: string 
    };
    congregations: { 
        name: string 
    };
    participant_tiers: { 
        name: string 
    };
    registration_packages: { 
        name: string 
    };
    payments: { 
        id: number; 
        payed_value: number; 
        payment_date: string; 
        payment_methods: { 
            name: string 
        }; 
        treasurer_id: {
            name: string
        }
    }[];
};

type ListHeaderProps = {
    details: RegistrationDetails;
    navigation: Props['navigation'];
    onCancel: () => void;
}

const ListHeader = ({ details, navigation, onCancel }: ListHeaderProps) => {
    if (!details) return null;

    const totalPaid = details.payments.reduce((sum, p) => sum + p.payed_value, 0);
    const balanceDue = details.final_price - totalPaid;

    return (
        <>
            <View style={styles.section}>
                <Text style={styles.participantName}>{details.participants.name}</Text>
                <Text style={styles.metaInfo}>{details.congregations.name}</Text>
                <Text style={styles.metaInfo}>{details.participant_tiers.name} - {details.registration_packages.name}</Text>
            </View>

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

            <View style={styles.actionsHeader}>
                <Button 
                    title="Editar Inscrição" 
                    onPress={() => navigation.navigate('EditRegistration', { registrationId: details.id })}
                />
                {details.status !== 'cancelled' && (
                    <View style={{ marginLeft: 10 }}>
                        <Button 
                            title="Cancelar Inscrição" 
                            onPress={onCancel}
                            color="#ff4757"
                        />
                    </View>
                )}
            </View>
            
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Histórico de Pagamentos</Text>
                <Button 
                    title="Adicionar pagamento"
                    onPress={() => navigation.navigate('AddPayment', { registrationId: details.id })}
                />
            </View>
        </>
    );
};


export default function RegistrationDetailScreen({ route, navigation }: Props) {
    const { registrationId } = route.params;
    const { session } = useAuth();
    const [loading, setLoading] = useState(true);
    const [details, setDetails] = useState<RegistrationDetails | null>(null);

    useFocusEffect(
        useCallback(() => {
            async function fetchDetails() {
                setLoading(true);
                const { data, error } = await supabase
                    .from('registrations')
                    .select(`
                        id, final_price, status,
                        participants ( name ),
                        congregations ( name ),
                        participant_tiers ( name ),
                        registration_packages ( name ),
                        payments ( id, payed_value, payment_date, payment_methods ( name ), treasurer_id (name) )
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
            }
            fetchDetails();
        }, [registrationId, navigation])
    );

    async function handleCancelRegistration() {
        if (!details) return;

        Alert.alert(
            "Confirmar Cancelamento",
            `Tem certeza que deseja cancelar a inscrição de "${details.participants.name}"? Esta ação registrará a inscrição como cancelada, mas manterá o histórico de pagamentos.`,
            [
                { text: "Voltar", style: "cancel" },
                {
                    text: "Sim, Cancelar",
                    style: "destructive",
                    onPress: async () => {
                        const { error } = await supabase
                            .from('registrations')
                            .update({ status: 'cancelled' })
                            .eq('id', registrationId);

                        if (error) {
                            Alert.alert("Erro", "Não foi possível cancelar a inscrição.");
                            console.error("Erro ao cancelar:", error);
                        } else {
                            if (session?.user.id) {
                                const logDetails = `Inscrição de "${details.participants.name}" foi cancelada.`;
                                logPaymentActivity(session.user.id, registrationId, null, 'CANCELLED', logDetails);
                            }
                            Alert.alert("Sucesso", "A inscrição foi cancelada.");
                            navigation.goBack();
                        }
                    }
                }
            ]
        );
    }

    const renderPaymentItem = useCallback(({ item }: { item: RegistrationDetails['payments'][0] }) => (
        <View style={styles.paymentItem}>
            <View>
                <Text style={styles.paymentAmount}>R$ {item.payed_value.toFixed(2).replace('.', ',')}</Text>
                <Text style={styles.paymentMeta}>Tesoureira(o): {item.treasurer_id.name}</Text>
                <Text style={styles.paymentMeta}>Forma de pagamento: {item.payment_methods.name}</Text>
                <Text style={styles.paymentMeta}>
                    Dia: {item.payment_date ? new Date(item.payment_date).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'Data não informada'}
                </Text>
            </View>
            <TouchableOpacity onPress={() => {
                if (details) {
                    navigation.navigate('EditPayment', { paymentId: item.id, registrationId: details.id })
                }}
            }>
                <Icon name="edit-2" size={20} color="#007BFF" />
            </TouchableOpacity>
        </View>
    ), [navigation, details]);

    if (loading) {
        return <ActivityIndicator size="large" style={styles.loader} />;
    }

    if (!details) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <Text style={styles.emptyText}>Inscrição não encontrada.</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <FlatList
                data={details.payments.sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())}
                renderItem={renderPaymentItem}
                keyExtractor={(item) => item.id.toString()}
                ListHeaderComponent={
                    <ListHeader 
                        details={details} 
                        navigation={navigation}
                        onCancel={handleCancelRegistration}
                    />
                }
                ListEmptyComponent={<Text style={styles.emptyText}>Nenhum pagamento registrado.</Text>}
                style={styles.list}
                contentContainerStyle={{ paddingBottom: 30 }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { 
        flex: 1, 
        backgroundColor: '#f5f5f5' 
    },
    list: {
        backgroundColor: '#fff',
    },
    loader: { 
        flex: 1, 
        justifyContent: 'center' 
    },
    section: { 
        padding: 20, 
        borderBottomWidth: 1, 
        borderBottomColor: '#eee' 
    },
    participantName: { 
        fontSize: 24, 
        fontWeight: 'bold', 
        marginBottom: 8 
    },
    metaInfo: { 
        fontSize: 16, 
        color: 'gray', 
        marginBottom: 4, 
    },
    balanceSection: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    balanceBox: { 
        alignItems: 'center' 
    },
    balanceLabel: { 
        fontSize: 14, 
        color: 'gray' 
    },
    balanceValue: { 
        fontSize: 18, 
        fontWeight: 'bold', 
        marginTop: 4 
    },
    paidValue: { 
        color: 'green' 
    },
    dueValue: { 
        color: 'red' 
    },
    actionsHeader: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        flexDirection: 'row',
        justifyContent: 'center'
    },
    sectionTitle: { 
        fontSize: 18, 
        fontWeight: 'bold', 
        marginBottom: 15 
    },
    paymentItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    paymentAmount: { 
        fontSize: 16, 
        fontWeight: '500' 
    },
    paymentMeta: { 
        fontSize: 12, 
        color: 'gray', 
        marginTop: 2 
    },
    emptyText: { 
        textAlign: 'center', 
        color: 'gray', 
        padding: 20 
    },
});