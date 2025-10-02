/* eslint-disable react-native/no-inline-styles */
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Button, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { PlusStackParamList } from '../../../routes/plus.stack.routes';
import { supabase } from '../../../lib/supabase';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';

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

    console.log(prices)

    const getNameFromArrayOrObject = (data: { name: string }[] | { name: string } | null | undefined) => {
    if (!data) return '';
    if (Array.isArray(data)) {
        return data[0]?.name || '';
    }
    return data.name || '';
};

    const renderPriceItem = ({ item }: { item: CampPrice }) => (
        <View style={styles.itemContainer}>
            <View>
                <Text style={styles.itemText}>
                    {getNameFromArrayOrObject(item.participant_tiers)} - {getNameFromArrayOrObject(item.registration_packages)}
                </Text>
                <Text style={styles.priceText}>R$ {item.price.toFixed(2)}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('CreateEditCampPriceScreen', { campId, priceId: item.id })}>
                <Icon name="edit-2" size={20} color="#007BFF" />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.actionsHeader}>
                <Text style={styles.actionsTitle}>Gerenciamento</Text>
                <View style={styles.actionButton}>
                    <Button 
                        title="Editar Nome do Acampamento"
                        // Navega para a tela de edição que você já construiu
                        onPress={() => navigation.navigate('EditCampScreen', { campId })}
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
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
    actionButton: {
        // Estilo para o botão se necessário
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