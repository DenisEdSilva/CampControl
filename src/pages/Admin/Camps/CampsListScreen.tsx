import React, { useState, useCallback } from 'react';
import { View, FlatList, ActivityIndicator, RefreshControl, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { PlusStackParamList } from '../../../routes/plus.stack.routes';
import { supabase } from '../../../lib/supabase';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { theme } from '../../../styles/theme';

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
            <Text style={styles.itemText} numberOfLines={1}>{item.name}</Text>
            <Icon name="chevron-right" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
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
                        <Text style={styles.headerTitle} numberOfLines={1}>
                          Acampamentos
                        </Text>
                    </View>
                    <TouchableOpacity 
                        style={styles.buttonContainer}
                        onPress={() => navigation.navigate('CreateCampScreen')}
                    >
                        <Text style={styles.buttonText}>
                            <Icon name="plus" size={18} /> Novo Acampamento
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.buttonContainer, { marginTop: theme.spacing.sm, backgroundColor: theme.colors.textSecondary }]}
                        onPress={() => navigation.navigate('ArchivedCamps')}
                    >
                        <Text style={styles.buttonText}>
                            <Icon name="archive" size={18} /> Ver Arquivados
                        </Text>
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={camps}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.textPrimary}/>
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Nenhum acampamento ativo.</Text>
                        </View>
                    }
                />
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
    buttonContainer: {
        backgroundColor: theme.colors.textPrimary,
        borderRadius: 10,
        padding: 12,
        alignItems: 'center',
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    buttonText: {
        color: theme.colors.textOnPrimary,
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: theme.spacing.sm,
    },
    itemContainer: { 
        ...theme.cardStyle,
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: theme.spacing.md,
        marginBottom: theme.spacing.sm,
    },
    itemText: { 
        ...theme.typography.body,
        flex: 1,
        marginRight: theme.spacing.sm,
    },
    emptyContainer: {
        paddingTop: 48,
        alignItems: 'center',
    },
    emptyText: {
        ...theme.typography.body,
    },
});