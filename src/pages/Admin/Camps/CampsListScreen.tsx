import React, { useState, useCallback } from 'react';
import { View, Button, FlatList, ActivityIndicator, RefreshControl, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { PlusStackParamList } from '../../../routes/plus.stack.routes';
import { supabase } from '../../../lib/supabase';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = StackScreenProps<PlusStackParamList, 'CampsList'>;
type Camp = { id: number; name: string; };

export default function CampsListScreen({ navigation }: Props) {
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [camps, setCamps] = useState<Camp[]>([]);

    async function fetchCamps() {
        const { data, error } = await supabase
            .from('camps')
            .select('*')
            .eq('status', 'active')
            .order('name', { ascending: true });

        if (error) {
            console.error('Erro ao carregar acampamentos:', error);
        } else {
            setCamps(data || []);
        }
    }

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            fetchCamps().finally(() => setLoading(false));
        }, [])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchCamps();
        setRefreshing(false);
    }, []);

    const renderItem = ({ item }: { item: Camp }) => (
        <TouchableOpacity style={styles.itemContainer} onPress={() => navigation.navigate('CampDetail', { campId: item.id, campName: item.name })}>
            <Text style={styles.itemText}>{item.name}</Text>
            <Text style={styles.actionText}>Visualizar</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Button
                    title="Adicionar Novo Acampamento"
                    onPress={() => navigation.navigate('CreateCampScreen')}
                />
                <View style={{ marginTop: 8 }}>
                    <Button 
                        title="Ver Acampamentos Arquivados"
                        onPress={() => navigation.navigate('ArchivedCamps')}
                    />
                </View>
            </View>
            
            {loading ? (
                <ActivityIndicator size="large" style={styles.loader}/>
            ) : (
                <FlatList
                    data={camps}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    style={styles.list}
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