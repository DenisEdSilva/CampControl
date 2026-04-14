import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, RefreshControl, TextInput, TouchableOpacity, Platform, LayoutAnimation, UIManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../../lib/supabase';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { theme } from '../../../styles/theme';
import DateTimePickerModal from "react-native-modal-datetime-picker";

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type LogEntry = {
    id: number;
    created_at: string;
    action: string;
    details: string;
    users: { name: string };
    registrations: { participants: { name: string } };
};

export default function AuditTrailScreen() {
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const navigation = useNavigation();

    const [searchParticipant, setSearchParticipant] = useState('');
    const [searchUser, setSearchUser] = useState('');
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
    
    const [filtersVisible, setFiltersVisible] = useState(false);
    
    const isInitialMount = useRef(true);

    const fetchLogs = useCallback(async () => {
        const selectStatement = `
            id,
            created_at,
            action,
            details,
            users ${searchUser ? '!inner' : ''} ( name ),
            registrations ${searchParticipant ? '!inner' : ''} ( participants ${searchParticipant ? '!inner' : ''} ( name ) )
        `;

        let query = supabase.from('payment_logs').select(selectStatement);

        if (searchParticipant) {
            query = query.filter('registrations.participants.name', 'ilike', `%${searchParticipant}%`);
        }
        if (searchUser) {
            query = query.filter('users.name', 'ilike', `%${searchUser}%`);
        }
        if (selectedDate) {
            const startDate = new Date(selectedDate);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(selectedDate);
            endDate.setHours(23, 59, 59, 999);
            query = query.gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString());
        }

        const { data, error } = await query
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) {
            console.error("Erro ao buscar logs de auditoria:", error);
            setLogs([]);
        } else {
            setLogs(data as any || []);
        }
    }, [searchParticipant, searchUser, selectedDate]);

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            fetchLogs().finally(() => setLoading(false));
        }, [])
    );

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        
        const handler = setTimeout(() => {
            setLoading(true);
            fetchLogs().finally(() => setLoading(false));
        }, 500);

        return () => clearTimeout(handler);
    }, [searchParticipant, searchUser, selectedDate, fetchLogs]);


    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchLogs();
        setRefreshing(false);
    }, [fetchLogs]);
    
    const handleConfirmDate = (date: Date) => {
        setSelectedDate(date);
        setDatePickerVisibility(false);
    };

    const clearDateFilter = () => {
        setSelectedDate(null);
    };

    const toggleFilters = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setFiltersVisible(!filtersVisible);
    };
    
    const renderItem = ({ item }: { item: LogEntry }) => (
        <View style={styles.itemContainer}>
            <Icon 
                name={item.action === 'CREATE' ? 'plus-circle' : item.action === 'UPDATE' ? 'edit' : 'trash-2'} 
                size={24} 
                color={item.action === 'CREATE' ? '#28a745' : item.action === 'UPDATE' ? '#ffc107' : theme.colors.accent} 
                style={styles.icon}
            />
            <View style={styles.detailsContainer}>
                <Text style={styles.detailsText}>{item.details}</Text>
                <Text style={styles.metaText}>
                    Para: {item.registrations?.participants?.name || 'N/A'} | Por: {item.users?.name || 'Sistema'}
                </Text>
                <Text style={styles.dateText}>
                    {new Date(item.created_at).toLocaleString('pt-BR')}
                </Text>
            </View>
        </View>
    );

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
                        <Text style={styles.headerTitle} numberOfLines={1}>
                            Log de Atividades
                        </Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.filterButton} onPress={toggleFilters}>
                    <Icon name="filter" size={18} color={theme.colors.textPrimary} />
                    <Text style={styles.filterButtonText}>Filtros</Text>
                    <Icon name={filtersVisible ? 'chevron-up' : 'chevron-down'} size={20} color={theme.colors.textPrimary} />
                </TouchableOpacity>

                {filtersVisible && (
                    <View style={styles.filtersContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Filtrar por participante..."
                            placeholderTextColor={theme.colors.textSecondary}
                            value={searchParticipant}
                            onChangeText={setSearchParticipant}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Filtrar por cadastrante..."
                            placeholderTextColor={theme.colors.textSecondary}
                            value={searchUser}
                            onChangeText={setSearchUser}
                        />
                        <View>
                            <TouchableOpacity style={styles.dateButton} onPress={() => setDatePickerVisibility(true)}>
                                <Icon name="calendar" size={20} color={theme.colors.textPrimary} />
                                <Text style={styles.dateButtonText}>
                                    {selectedDate ? selectedDate.toLocaleDateString('pt-BR') : 'Filtrar por data'}
                                </Text>
                            </TouchableOpacity>
                            {selectedDate && (
                                <TouchableOpacity style={styles.clearButton} onPress={clearDateFilter}>
                                    <Icon name="x" size={16} color={theme.colors.textOnPrimary} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}

                <DateTimePickerModal
                    isVisible={isDatePickerVisible}
                    mode="date"
                    onConfirm={handleConfirmDate}
                    onCancel={() => setDatePickerVisibility(false)}
                    locale="pt_BR"
                />

                {loading ? (
                    <ActivityIndicator size="large" color={theme.colors.textPrimary} style={{ flex: 1 }}/>
                ) : (
                    <FlatList
                        data={logs}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id.toString()}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>Nenhum log encontrado para os filtros aplicados.</Text>
                            </View>
                        }
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.textPrimary}/>
                        }
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    },
    container: {
        flex: 1,
        width: '90%',
        alignSelf: 'center',
    },
    header: {
        marginVertical: theme.spacing.lg,
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
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
    filterButton: {
        ...theme.cardStyle,
        padding: theme.spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.md,
    },
    filterButtonText: {
        ...theme.typography.body,
        fontWeight: 'bold',
        flex: 1,
        marginLeft: theme.spacing.sm,
    },
    filtersContainer: {
        marginBottom: theme.spacing.md,
    },
    input: {
        ...theme.cardStyle,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: Platform.OS === 'ios' ? 14 : 10,
        fontSize: 16,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.sm,
    },
    dateButton: {
        ...theme.cardStyle,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateButtonText: {
        ...theme.typography.body,
        marginLeft: theme.spacing.sm,
    },
    clearButton: {
        position: 'absolute',
        right: 12,
        bottom: 12,
        backgroundColor: theme.colors.textSecondary,
        borderRadius: 100,
        padding: 4,
    },
    itemContainer: {
        ...theme.cardStyle,
        flexDirection: 'row',
        padding: theme.spacing.md,
        marginBottom: theme.spacing.sm,
        alignItems: 'flex-start',
    },
    icon: {
        marginRight: theme.spacing.md,
        marginTop: 2,
    },
    detailsContainer: {
        flex: 1,
    },
    detailsText: {
        ...theme.typography.body,
        fontWeight: 'bold',
        marginBottom: 6,
    },
    metaText: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginBottom: 4,
    },
    dateText: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.lg,
    },
    emptyText: {
        ...theme.typography.body,
        textAlign: 'center',
    },
});