import React, { useState, useCallback } from 'react';
import { FlatList, ActivityIndicator, Text, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { RegistrationStackParamList } from '../../../routes/registration.stack.routes';
import { supabase } from '../../../lib/supabase';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../../../styles/theme';
import Icon from 'react-native-vector-icons/Feather';

type Props = StackScreenProps<RegistrationStackParamList, 'SelectCamp'>;
type Camp = {
    id: number;
    name: string;
};

export default function SelectCampScreen({ navigation }: Props) {
    const [loading, setLoading] = useState(true);
    const [camps, setCamps] = useState<Camp[]>([]);

    async function fetchCamps() {
        const { data, error } = await supabase
            .from('camps')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.error('Erro ao carregar acampamentos:', error);
        } else {
            setCamps(data || []);
        }
    }

    useFocusEffect(
        useCallback(() => {
            fetchCamps().finally(() => setLoading(false));
        }, [])
    );

    const renderItem = ({ item }: { item: Camp }) => (
        <TouchableOpacity 
            style={styles.itemContainer} 
            onPress={() => navigation.navigate('CreateRegistration', { campId: item.id, campName: item.name })}
        >
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
                    <Text style={styles.headerTitle}>Selecione o Acampamento</Text>
                </View>

                <FlatList
                    data={camps}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Nenhum acampamento encontrado.</Text>
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
    headerTitle: {
        ...theme.typography.header,
        textAlign: 'center',
        marginBottom: theme.spacing.md,
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
        fontWeight: 'bold',
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