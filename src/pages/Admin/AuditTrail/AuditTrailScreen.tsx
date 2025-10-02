import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
import { supabase } from '../../../lib/supabase';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';

type LogEntry = {
    id: number;
    created_at: string;
    action: string;
    details: string;
    users: { 
        name: string 
    };
    registrations: {
        participants: { name: string }
    };
};

export default function AuditTrailScreen() {
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const fetchLogs = useCallback(async () => {
        const { data, error } = await supabase
            .from('payment_logs')
            .select(`
                id,
                created_at,
                action,
                details,
                users ( name ),
                registrations ( participants ( name ) )
            `)
            .order('created_at', { ascending: false })
            .limit(100);

        console.log(data)

        if (error) {
            console.error("Erro ao buscar logs de auditoria:", error);
        } else {
            setLogs(data as any || []);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            fetchLogs().finally(() => setLoading(false));
        }, [fetchLogs])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchLogs();
        setRefreshing(false);
    }, [fetchLogs]);

    const renderItem = ({ item }: { item: LogEntry }) => (
        <View style={styles.itemContainer}>
            <Icon 
                name={item.action === 'CREATE' ? 'plus-circle' : 'edit'} 
                size={24} 
                color={item.action === 'CREATE' ? 'green' : 'orange'} 
                style={styles.icon}
            />
            <View style={styles.detailsContainer}>
                <Text style={styles.detailsText}>{item.details}</Text>
                <Text style={styles.metaText}>
                    Para: {item.registrations.participants.name} | Por: {item.users.name}
                </Text>
                <Text style={styles.dateText}>
                    {new Date(item.created_at).toLocaleString('pt-BR')}
                </Text>
            </View>
        </View>
    );

    if (loading) {
        return <ActivityIndicator size="large" style={styles.loader} />;
    }

    return (
        <FlatList
            data={logs}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            style={styles.container}
            ListEmptyComponent={<Text style={styles.emptyText}>Nenhum log de atividade encontrado.</Text>}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        />
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    loader: { flex: 1, justifyContent: 'center' },
    itemContainer: { flexDirection: 'row', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    icon: { marginRight: 16, marginTop: 2 },
    detailsContainer: { flex: 1 },
    detailsText: { fontSize: 16, fontWeight: '500', marginBottom: 6 },
    metaText: { fontSize: 14, color: '#555', marginBottom: 4 },
    dateText: { fontSize: 12, color: '#999' },
    emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: 'gray' },
});