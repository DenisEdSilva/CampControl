import React, { useState, useCallback } from 'react';
import { View, Button, FlatList, ActivityIndicator, RefreshControl, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { PlusStackParamList } from '../../../routes/plus.stack.routes';
import { supabase } from '../../../lib/supabase';
import { useFocusEffect } from '@react-navigation/native';

type Props = StackScreenProps<PlusStackParamList, 'TreasurersList'>;
type Treasurer = {
    id: number;
    name: string;
};

export default function TreasurersList({ navigation }: Props) {
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [treasurers, setTreasurers] = useState<Treasurer[]>([]);

    async function fetchTreasurers() {
        const { data, error } = await supabase
            .from('treasurers')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.error('Erro ao carregar tesoureiros:', error);
        } else {
            setTreasurers(data || []);
        }
    }

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            fetchTreasurers().finally(() => setLoading(false));
        }, [])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchTreasurers();
        setRefreshing(false);
    }, []);

    const renderItem = ({ item }: { item: Treasurer }) => (
        <TouchableOpacity style={styles.itemContainer} onPress={() => navigation.navigate('EditTreasurerScreen', { treasurerId: item.id })}>
            <Text style={styles.itemText}>{item.name}</Text>
            <Text style={styles.actionText}>Editar</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Button
                    title="Adicionar Novo Tesoureiro"
                    onPress={() => navigation.navigate('CreateTreasurerScreen')}
                />
            </View>
            
            {loading ? (
                <ActivityIndicator size="large" style={styles.loader}/>
            ) : (
                <FlatList
                    data={treasurers}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    style={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#f5f5f5' 
    },
    header: { 
        padding: 16, 
        backgroundColor: '#fff', 
        borderBottomWidth: 1, 
        borderBottomColor: '#eee' 
    },
    list: { 
        flex: 1 
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
        fontSize: 16 
    },
    actionText: { 
        fontSize: 14, 
        color: '#007BFF' 
    }
});