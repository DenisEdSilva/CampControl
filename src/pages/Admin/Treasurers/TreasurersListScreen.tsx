import React, { useState, useCallback } from 'react';
import { View, FlatList, ActivityIndicator, RefreshControl, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { PlusStackParamList } from '../../../routes/plus.stack.routes';
import { supabase } from '../../../lib/supabase';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { theme } from '../../../styles/theme';

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
        <View style={styles.itemContainer}>
            <Text style={styles.itemText} numberOfLines={1}>{item.name}</Text>
            <View style={styles.actionsContainer}>
                <TouchableOpacity onPress={() => navigation.navigate('EditTreasurerScreen', { treasurerId: item.id })}>
                    <Icon name="edit-2" size={20} color={theme.colors.textPrimary} />
                </TouchableOpacity>
                <TouchableOpacity style={{ marginLeft: 20 }} onPress={(e) => { e.stopPropagation(); handleDelete(item.id, item.name); }}>
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
                        <Text style={styles.headerTitle} numberOfLines={1}>
                            Tesoureiros
                        </Text>
                    </View>
                    <TouchableOpacity 
                        style={styles.buttonContainer}
                        onPress={() => navigation.navigate('CreateTreasurerScreen')}
                    >
                        <Text style={styles.buttonText}>
                            <Icon name="plus" size={18} /> Novo Tesoureiro
                        </Text>
                    </TouchableOpacity>
                </View>
                <FlatList
                    data={treasurers}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.textPrimary}/>
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Nenhum tesoureiro encontrado.</Text>
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
    },
    buttonText: {
        color: theme.colors.textOnPrimary,
        fontSize: 18,
        fontWeight: 'bold',
    },
    itemContainer: {
        ...theme.cardStyle,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.md,
        marginBottom: theme.spacing.sm,
    },
    actionsContainer: {
        flexDirection: 'row', 
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