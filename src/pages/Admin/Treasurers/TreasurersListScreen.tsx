import React, { useState, useCallback } from 'react';
import { View, Button, FlatList, ActivityIndicator, RefreshControl, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { PlusStackParamList } from '../../../routes/plus.stack.routes';
import { supabase } from '../../../lib/supabase';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';

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

    async function handleDelete(itemId: number, itemName: string) {
        Alert.alert(
            "Confirmar Exclusão",
            `Tem certeza que deseja excluir o tesoureiro "${itemName}"? Esta opção não podera ser desfeita.`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Excluir",
                    style: "destructive",
                    onPress: async () => {
                        const { error } = await supabase
                        .from('treasurers')
                        .delete()
                        .eq('id', itemId);

                        if (error) {
                        if (error.code === '23503') {
                            Alert.alert(
                                "Ação Bloqueada",
                                `Este tesoureiro não pode ser excluído pois está associado a um ou mais pagamentos.`
                            );
                        } else {
                            Alert.alert("Erro", "Não foi possível excluir o tesoureiro.");
                            console.error("Erro ao excluir:", error);
                        }
                    } else {
                        Alert.alert("Sucesso", `"${itemName}" foi excluído.`);
                        setTreasurers(currentTreasurers => 
                            currentTreasurers.filter(t => t.id !== itemId)
                        );
                    }
                    }
                }
            ]
        )
    }

    const renderItem = ({ item }: { item: Treasurer }) => (
        <TouchableOpacity style={styles.itemContainer} onPress={() => navigation.navigate('EditTreasurerScreen', { treasurerId: item.id })}>
            <Text style={styles.itemText}>{item.name}</Text>
            <View style={styles.actionsContainer}>
                <Icon name="edit-2" size={20} color="#007BFF" />
                <TouchableOpacity style={{ marginLeft: 20 }} onPress={() => handleDelete(item.id, item.name)}>
                    <Icon name="trash-2" size={20} color="#ff4757" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
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
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: { 
        padding: 16, 
        backgroundColor: '#fff', 
        borderBottomWidth: 1, 
        borderBottomColor: '#eee' 
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
    actionsContainer: {
       flexDirection: 'row', 
       alignItems: 'center',
    },
    itemText: { 
        fontSize: 16 
    },
});