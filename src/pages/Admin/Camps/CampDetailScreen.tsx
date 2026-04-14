import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { PlusStackParamList } from '../../../routes/plus.stack.routes';
import { supabase } from '../../../lib/supabase';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { theme } from '../../../styles/theme';

type Props = StackScreenProps<PlusStackParamList, 'CampDetail'>;

type CampPrice = {
    id: number;
    price: number;
    participant_tiers: { name: string }[] | { name: string };
    registration_packages: { name: string }[] | { name: string };
};

export default function CampDetailScreen({ route, navigation }: Props) {
    const { campId, campName } = route.params;
    const [loading, setLoading] = useState(true);
    const [prices, setPrices] = useState<CampPrice[]>([]);

    const fetchCampPrices = useCallback(async () => {
        const { data, error } = await supabase
            .from('camp_prices')
            .select(`
                id,
                price,
                participant_tiers ( name ),
                registration_packages ( name )
            `)
            .eq('camp_id', campId);

        if (error) {
            console.error('Erro ao buscar preços:', error);
        } else {
            setPrices(data as CampPrice[] || []);
        }
    }, [campId]);
    
    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            fetchCampPrices().finally(() => setLoading(false));
        }, [fetchCampPrices])
    );

    const getNameFromArrayOrObject = (data: { name: string }[] | { name: string } | null | undefined) => {
        if (!data) return '';
        if (Array.isArray(data)) {
            return data[0]?.name || '';
        }
        return data.name || '';
    };

    async function handleDeletePrice(priceId: number) {
        Alert.alert(
            "Confirmar Exclusão",
            "Tem certeza que deseja excluir este preço? Esta ação não pode ser desfeita.",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Excluir",
                    style: "destructive",
                    onPress: async () => {
                        const { error } = await supabase.from('camp_prices').delete().eq('id', priceId);
                        if (error) {
                            Alert.alert("Erro", "Não foi possível excluir o preço.");
                        } else {
                            setPrices(currentPrices => currentPrices.filter(p => p.id !== priceId));
                        }
                    }
                }
            ]
        );
    }

    async function handleArchiveCamp() {
        Alert.alert(
            "Confirmar Arquivamento",
            `Tem certeza que deseja arquivar o acampamento "${campName}"? Ele não aparecerá mais nas listas principais.`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Sim, Arquivar",
                    style: "destructive",
                    onPress: async () => {
                        const { error } = await supabase
                            .from('camps')
                            .update({ status: 'archived' })
                            .eq('id', campId);

                        if (error) {
                            Alert.alert("Erro", "Não foi possível arquivar o acampamento.");
                        } else {
                            Alert.alert("Sucesso", "Acampamento arquivado.");
                            navigation.goBack();
                        }
                    }
                }
            ]
        );
    }

    async function generatePaymentsReport(id: number, name: string) {
        try {
            const { data: payments, error } = await supabase
                .from('payments')
                .select(`
                    payed_value,
                    payment_date,
                    payment_methods ( name ),
                    treasurer_id ( name ),
                    created_by_user_id ( name ), 
                    registrations!inner (
                        camp_id,
                        participants ( name ),
                        congregations ( name ),
                        status
                    )
                `)
                .eq('registrations.camp_id', id)

            if (error) throw error;

            if (!payments || payments.length === 0) {
                Alert.alert("Aviso", "Nenhum pagamento de inscrições ativas foi encontrado para este acampamento.");
                return;
            }

            const totalsByMethod = payments.reduce((acc: Record<string, number>, payment: any) => {
                const methodName = payment.payment_methods?.name ?? 'Não Identificado';
                const value = payment.payed_value;
                
                if (!acc[methodName]) {
                    acc[methodName] = 0;
                }
                acc[methodName] += value;
                return acc;

            }, {});

            const summaryData = Object.keys(totalsByMethod).map(method => ({
                "Forma de Pagamento": method,
                "Valor Total": totalsByMethod[method]
            }));

            const ws_summary = XLSX.utils.json_to_sheet(summaryData);
            ws_summary['!cols'] = [{ wch: 30 }, { wch: 20 }];

            const range_summary = XLSX.utils.decode_range((ws_summary as any)['!ref']);
            for (let R = range_summary.s.r + 1; R <= range_summary.e.r; ++R) {
                const cell_ref = XLSX.utils.encode_cell({c: 1, r: R});
                if(ws_summary[cell_ref]) (ws_summary[cell_ref] as any).z = 'R$ #,##0.00';
            }

            const detailsData = payments.map((p: any) => ({
                "Data Pagamento": p.payment_date,
                "Valor Pago": p.payed_value,
                "Forma de Pagamento": p.payment_methods?.name ?? 'N/A',
                "Participante": p.registrations.participants?.name ?? 'N/A',
                "Congregação": p.registrations.congregations?.name ?? 'N/A',
                "Recebido por": p.treasurer_id?.name ?? 'N/A',
                "Registrado por": p.created_by_user_id?.name ?? 'N/A',
                "Status": p.registrations.status ?? 'N/A',
            }));

            const ws_details = XLSX.utils.json_to_sheet(detailsData);
            ws_details['!cols'] = [
                { wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 30 }, { wch: 15 }, { wch: 30 }, { wch: 30 }, { wch: 25 }
            ];

            const range_details = XLSX.utils.decode_range((ws_details as any)['!ref']);
            for (let R = range_details.s.r + 1; R <= range_details.e.r; ++R) {
                const date_cell = XLSX.utils.encode_cell({c: 0, r: R});
                if(ws_details[date_cell]) (ws_details[date_cell] as any).z = 'dd/mm/yyyy';

                const value_cell = XLSX.utils.encode_cell({c: 1, r: R});
                if(ws_details[value_cell]) (ws_details[value_cell] as any).z = 'R$ #,##0.00';
            }

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws_summary, "Resumo por Método");
            XLSX.utils.book_append_sheet(wb, ws_details, "Todos os Pagamentos");

            const xlsxData = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
            const fileName = `Relatorio_Pagamentos_${name.replace(/\s/g, '_')}.xlsx`;
            
            const filePath = `${FileSystem.cacheDirectory}${fileName}`;

            await FileSystem.writeAsStringAsync(filePath, xlsxData, {
                encoding: FileSystem.EncodingType.Base64
            });

            if (!(await Sharing.isAvailableAsync())) {
                Alert.alert('Erro', 'O compartilhamento não está disponível neste dispositivo.');
                return;
            }
            await Sharing.shareAsync(filePath, {
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                dialogTitle: 'Compartilhar Relatório de Pagamentos',
                UTI: 'com.microsoft.excel.xlsx'
            });

        } catch (error) {
            console.error('Erro ao gerar relatório de pagamentos:', error);
            Alert.alert('Erro', 'Não foi possível gerar o relatório de pagamentos.');
        }
    }
    const renderPriceItem = ({ item }: { item: CampPrice }) => (
        <View style={styles.itemContainer}>
            <View style={styles.itemDetails}>
                <Text style={styles.itemText} numberOfLines={2}>
                    {getNameFromArrayOrObject(item.participant_tiers)} - {getNameFromArrayOrObject(item.registration_packages)}
                </Text>
                <Text style={styles.priceText}>R$ {item.price.toFixed(2).replace('.', ',')}</Text>
            </View>
            <View style={styles.actionsContainer}>
                <TouchableOpacity onPress={() => navigation.navigate('CreateEditCampPriceScreen', { campId, priceId: item.id })}>
                    <Icon name="edit-2" size={20} color={theme.colors.textPrimary} />
                </TouchableOpacity>
                <TouchableOpacity style={{ marginLeft: 20 }} onPress={() => handleDeletePrice(item.id)}>
                    <Icon name="trash-2" size={20} color={theme.colors.accent} />
                </TouchableOpacity>
            </View>
        </View>
    );

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
                        <Text style={styles.headerTitle} numberOfLines={2}>
                            {campName}
                        </Text>
                    </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Ações</Text>
                        <TouchableOpacity 
                            style={styles.button}
                            onPress={() => navigation.navigate('EditCampScreen', { campId })}
                        >
                            <Icon name="edit" size={16} color={theme.colors.textOnPrimary} style={styles.buttonIcon}/>
                            <Text style={styles.buttonText}>Editar Nome</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.button, { backgroundColor: '#28a745' }]}
                            onPress={() => generatePaymentsReport(campId, campName)}
                        >
                            <Icon name="download" size={16} color={theme.colors.textOnPrimary} style={styles.buttonIcon}/>
                            <Text style={styles.buttonText}>Relatório de Pagamentos</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.button, { backgroundColor: theme.colors.accent }]}
                            onPress={handleArchiveCamp}
                        >
                            <Icon name="archive" size={16} color={theme.colors.textOnPrimary} style={styles.buttonIcon}/>
                            <Text style={styles.buttonText}>Arquivar Acampamento</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Tabela de Preços</Text>
                            <TouchableOpacity 
                                style={styles.addButton}
                                onPress={() => navigation.navigate('CreateEditCampPriceScreen', { campId })}
                            >
                                <Icon name="plus" size={18} color={theme.colors.textOnPrimary}/>
                            </TouchableOpacity>
                        </View>
                        {prices.length > 0 ? (
                            prices.map(item => (
                                // ----- A CORREÇÃO ESTÁ AQUI -----
                                <View key={item.id} style={styles.itemContainer}>
                                    <View style={styles.itemDetails}>
                                        <Text style={styles.itemText} numberOfLines={2}>
                                            {getNameFromArrayOrObject(item.participant_tiers)} - {getNameFromArrayOrObject(item.registration_packages)}
                                        </Text>
                                        <Text style={styles.priceText}>R$ {item.price.toFixed(2).replace('.', ',')}</Text>
                                    </View>
                                    <View style={styles.actionsContainer}>
                                        <TouchableOpacity onPress={() => navigation.navigate('CreateEditCampPriceScreen', { campId, priceId: item.id })}>
                                            <Icon name="edit-2" size={20} color={theme.colors.textPrimary} />
                                        </TouchableOpacity>
                                        <TouchableOpacity style={{ marginLeft: 20 }} onPress={() => handleDeletePrice(item.id)}>
                                            <Icon name="trash-2" size={20} color={theme.colors.accent} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                // ------------------------------------
                            ))
                        ) : (
                            <Text style={styles.emptyText}>Nenhum preço cadastrado.</Text>
                        )}
                    </View>
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
    section: {
        ...theme.cardStyle,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
        ...theme.typography.header,
        fontSize: 20,
        marginBottom: theme.spacing.md,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.textPrimary,
        padding: 12,
        borderRadius: 8,
        marginBottom: theme.spacing.sm,
    },
    buttonIcon: {
        marginRight: theme.spacing.sm,
    },
    buttonText: {
        color: theme.colors.textOnPrimary,
        fontWeight: 'bold',
        fontSize: 16,
    },
    addButton: {
        backgroundColor: theme.colors.textPrimary,
        borderRadius: 100,
        padding: 8,
        marginBottom: theme.spacing.md
    },
    itemContainer: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingVertical: theme.spacing.md, 
        borderTopWidth: 1, 
        borderTopColor: theme.colors.background,
    },
    itemDetails: {
        flex: 1,
        marginRight: theme.spacing.sm,
    },
    actionsContainer: {
       flexDirection: 'row', 
    },
    itemText: { 
        ...theme.typography.body,
        fontWeight: '500',
    },
    priceText: { 
        fontSize: 14, 
        color: 'green', 
        marginTop: 4,
    },
    emptyText: { 
        ...theme.typography.body,
        textAlign: 'center', 
        paddingVertical: theme.spacing.lg,
    },
});