import React, { useState, useCallback } from 'react';
import { View, Button, FlatList, ActivityIndicator, RefreshControl, Text, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { PlusStackParamList } from '../../../routes/plus.stack.routes';
import { supabase } from '../../../lib/supabase';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';

type Props = StackScreenProps<PlusStackParamList, 'ParticipantTiersList'>;
type ParticipantTier = {
    id: number;
    name: string;
};

export default function ParticipantTiersListScreen({ navigation }: Props) {
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [participantTiers, setParticipantTiers] = useState<ParticipantTier[]>([]);

    async function fetchParticipantTiers() {
        const { data, error } = await supabase
            .from('participant_tiers')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.error('Erro ao carregar níveis de participante:', error);
        } else {
            setParticipantTiers(data || []);
        }
    }

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            fetchParticipantTiers().finally(() => setLoading(false));
        }, [])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchParticipantTiers();
        setRefreshing(false);
    }, []);

    async function handleDelete(itemId: number, itemName: string) {
            Alert.alert(
                "Confirmar Exclusão",
                `Tem certeza que deseja excluir o nivel de participante "${itemName}"? Esta opção não podera ser desfeita.`,
                [
                    { text: "Cancelar", style: "cancel" },
                    {
                        text: "Excluir",
                        style: "destructive",
                        onPress: async () => {
                            const { error } = await supabase
                            .from('participant_tiers')
                            .delete()
                            .eq('id', itemId);
    
                            if (error) {
                            if (error.code === '23503') {
                                Alert.alert(
                                    "Ação Bloqueada",
                                    `Este nivel de participante não pode ser excluído pois está associado a um ou mais planos dos acampamentos.`
                                );
                            } else {
                                Alert.alert("Erro", "Não foi possível excluir o nivel de participante.");
                                console.error("Erro ao excluir:", error);
                            }
                        } else {
                            Alert.alert("Sucesso", `"${itemName}" foi excluído.`);
                            setParticipantTiers(currentParticipantTier => 
                                currentParticipantTier.filter(pt => pt.id !== itemId)
                            );
                        }
                        }
                    }
                ]
            )
        }

    const renderItem = ({ item }: { item: ParticipantTier }) => (
        <View style={styles.itemContainer}>
            <Text style={styles.itemText}>{item.name}</Text>
            <View style={styles.actionsContainer}>
                <TouchableOpacity onPress={() => navigation.navigate('EditParticipantTierScreen', { tierId: item.id })}>
                    <Icon name="edit-2" size={20} color="#007BFF" />
                </TouchableOpacity>
                <TouchableOpacity style={{ marginLeft: 20 }} onPress={() => handleDelete(item.id, item.name)}>
                    <Icon name="trash-2" size={20} color="#ff4757" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Button
                    title="Adicionar Novo Nível"
                    onPress={() => navigation.navigate('CreateParticipantTierScreen')}
                />
            </View>
            
            {loading ? (
                <ActivityIndicator size="large" style={styles.loader}/>
            ) : (
                <FlatList
                    data={participantTiers}
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
    actionsContainer: {
        flexDirection: 'row', 
    },
    itemText: { 
        fontSize: 16 
    },
    actionText: { 
        fontSize: 14, 
        color: '#007BFF' 
    }
});