
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Button, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { PlusStackParamList } from '../../../routes/plus.stack.routes';
import { supabase } from '../../../lib/supabase';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

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

    React.useLayoutEffect(() => {
        navigation.setOptions({ title: campName });
    }, [navigation, campName]);

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

    console.log(campName)

    console.log("Possiveis preços: ", prices)

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
            `Tem certeza que deseja arquivar o acampamento "${campName}"? Ele não aparecerá mais nas listas principais, mas seu histórico será mantido por um tempo.`,
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
                            console.error("Erro ao arquivar:", error);
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
                        congregations ( name )
                    )
                `)
                .eq('registrations.camp_id', id);

            if (error) throw error;

            if (!payments || payments.length === 0) {
                Alert.alert("Aviso", "Nenhum pagamento encontrado para este acampamento.");
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
                "Registrado por": p.created_by_user_id?.name ?? 'N/A'
            }));

            const ws_details = XLSX.utils.json_to_sheet(detailsData);
            ws_details['!cols'] = [
                { wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 30 }, { wch: 15 }, { wch: 30 }, { wch: 30 }
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

            console.log('arquivo salvo em: ', filePath)

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
            <View>
                <Text style={styles.itemText}>
                    {getNameFromArrayOrObject(item.participant_tiers)} - {getNameFromArrayOrObject(item.registration_packages)}
                </Text>
                <Text style={styles.priceText}>R$ {item.price.toFixed(2)}</Text>
            </View>
            <View style={styles.actionsContainer}>
                <TouchableOpacity onPress={() => navigation.navigate('CreateEditCampPriceScreen', { campId, priceId: item.id })}>
                    <Icon name="edit-2" size={20} color="#007BFF" />
                </TouchableOpacity>
                <TouchableOpacity style={{ marginLeft: 20 }} onPress={() => handleDeletePrice(item.id)}>
                    <Icon name="trash-2" size={20} color="#ff4757" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} >
            <View style={styles.actionsHeader}>
                <View>
                    <Button 
                        title="Editar Nome do Acampamento"
                        onPress={() => navigation.navigate('EditCampScreen', { campId })}
                    />
                    <Button 
                        title="Arquivar Acampamento"
                        onPress={handleArchiveCamp}
                        color="#ff4757"
                    />
                    <Button 
                        title="Gerar relatório de pagamentos (.xlsx)"
                        onPress={() => generatePaymentsReport(campId, campName)}
                        color="#28a745"
                    />
                </View>
            </View>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Tabela de Preços</Text>
                <Button 
                    title="Adicionar Novo Preço"
                    onPress={() => navigation.navigate('CreateEditCampPriceScreen', { campId })}
                />
            </View>

            {loading ? (
                <ActivityIndicator size="large" style={{ marginTop: 50 }}/>
            ) : (
                <FlatList
                    data={prices}
                    renderItem={renderPriceItem}
                    keyExtractor={(item) => item.id.toString()}
                    ListEmptyComponent={<Text style={styles.emptyText}>Nenhum preço cadastrado.</Text>}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#f5f5f5' 
    },
    actionsHeader: {
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    actionsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'gray',
        marginBottom: 8,
    },
    header: { 
        padding: 16, 
        backgroundColor: '#fff', 
        borderBottomWidth: 1, 
        borderBottomColor: '#eee' 
    },
    headerTitle: { 
        fontSize: 20, 
        fontWeight: 'bold', 
        marginBottom: 12 
    },
    itemContainer: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: 16, 
        borderBottomWidth: 1, 
        borderBottomColor: '#eee', 
        backgroundColor: '#fff' 
    },
    actionsContainer: {
       flexDirection: 'row', 
    },
    itemText: { 
        fontSize: 16, 
        fontWeight: '500' 
    },
    priceText: { 
        fontSize: 14, 
        color: 'green', 
        marginTop: 4 
    },
    emptyText: { 
        textAlign: 'center', 
        marginTop: 50, 
        fontSize: 16, 
        color: 'gray' 
    },
});