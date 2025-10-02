/* eslint-disable react-native/no-inline-styles */
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Button, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { HomeStackParamList } from '../../../routes/home.stack.routes';
import { supabase } from '../../../lib/supabase';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';

type Props = StackScreenProps<HomeStackParamList, 'RegistrationDetail'>;

type RegistrationDetails = {
    id: number;
    final_price: number;
    status: string;
    participants: { name: string };
    congregations: { name: string };
    participant_tiers: { name: string };
    registration_packages: { name: string };
    payments: { id: number; payed_value: number; payment_date: string; payment_methods: { name: string }; treasurer_id: { name: string} }[];
};

export default function RegistrationDetailScreen({ route, navigation }: Props) {
    const { registrationId } = route.params;
    const [loading, setLoading] = useState(true);
    const [details, setDetails] = useState<RegistrationDetails | null>(null);

    useFocusEffect(
        useCallback(() => {
            async function fetchDetails() {
                setLoading(true);
                const { data, error } = await supabase
                    .from('registrations')
                    .select(`
                        id,
                        final_price,
                        status,
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

    const totalPaid = details ? details.payments.reduce((sum, p) => sum + p.payed_value, 0) : 0;
    const balanceDue = details ? details.final_price - totalPaid : 0;

    const renderPaymentItem = ({ item }: { item: RegistrationDetails['payments'][0] }) => (
        <View style={styles.paymentItem}>
            <View>
                <Text style={styles.paymentAmount}>R$ {item.payed_value.toFixed(2).replace('.', ',')}</Text>
                <Text style={styles.paymentMeta}>Tesoureira(o): {item.treasurer_id.name}</Text>
                <Text style={styles.paymentMeta}>
                    Forma de pagamento: {item.payment_methods.name}
                </Text>
                <Text style={styles.paymentMeta}>
                    Dia: {new Date(item.payment_date).toLocaleDateString('pt-BR')}
                </Text>
            </View>
            <TouchableOpacity onPress={() => {
                if (details) {
                    navigation.navigate('EditPayment', { paymentId: item.id, registrationId: details.id })
                }}
            }>
                <Icon name="edit-2" size={20} color="#ff1c1cff" />
            </TouchableOpacity>
        </View>
    );

    if (loading) {
        return <ActivityIndicator size="large" style={styles.loader} />;
    }

    if (!details) {
        return (
            <View style={styles.container}>
                <Text>Inscrição não encontrada.</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.section}>
                <Text style={styles.participantName}>{details.participants.name}</Text>
                <Text style={styles.metaInfo}>
                    <Icon name="home" size={14} style={{ marginRight: 8 }} /> 
                    <Text>{details.congregations.name}</Text>
                </Text>
                <Text style={styles.metaInfo}>
                    <Icon name="tag" size={14} style={{ marginRight: 8 }} /> 
                    <Text>{details.participant_tiers.name} - {details.registration_packages.name}</Text>
                </Text>
            </View>

            <View style={styles.balanceSection}>
                <View style={styles.balanceBox}>
                    <Text style={styles.balanceLabel}>Valor Total</Text>
                    <Text style={styles.balanceValue}>
                        R$ {details.final_price.toFixed(2).replace('.', ',')}
                    </Text>
                </View>
                <View style={styles.balanceBox}>
                    <Text style={styles.balanceLabel}>Total Pago</Text>
                    <Text style={[styles.balanceValue, styles.paidValue]}>
                        R$ {totalPaid.toFixed(2).replace('.', ',')}
                    </Text>
                </View>
                <View style={styles.balanceBox}>
                    <Text style={styles.balanceLabel}>Saldo Devedor</Text>
                    <Text style={[styles.balanceValue, styles.dueValue, balanceDue <= 0 && styles.paidValue]}>
                        {balanceDue > 0 ? `R$ ${balanceDue.toFixed(2).replace('.', ',')}` : 'Quitado'}
                    </Text>
                </View>
            </View>

            <View style={styles.actionsHeader}>
                <Button 
                    title="Editar Inscrição" 
                    onPress={() => navigation.navigate('EditRegistration', { registrationId: details.id })}
                />
            </View>

            <View style={styles.section}>

                <Text style={styles.sectionTitle}>Histórico de Pagamentos</Text>
                <Button 
                    title="Adicionar pagamento"
                    onPress={() => navigation.navigate('AddPayment', { registrationId: details.id})}
                />
                {details.payments
                    .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
                    .map(item => renderPaymentItem({ item }))
                }
                {details.payments.length === 0 && (
                    <Text style={styles.emptyText}>Nenhum pagamento registrado.</Text>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#f5f5f5' 
    },
    loader: { 
        flex: 1, 
        justifyContent: 'center' 
    },
    section: { 
        padding: 20, 
        backgroundColor: '#fff', 
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
        flexDirection: 'row', 
        alignItems: 'center' 
    },
    balanceSection: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 20,
        backgroundColor: '#fff',
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
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    sectionTitle: { 
        fontSize: 18, 
        fontWeight: 'bold', 
        marginBottom: 15 
    },
    addPaymentButton: { 
        marginBottom: 20 
    },
    paymentItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
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