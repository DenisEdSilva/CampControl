import React, { useState, useCallback } from 'react';
import { FlatList, ActivityIndicator, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RegistrationStackParamList } from '../../../routes/registration.stack.routes';
import { supabase } from '../../../lib/supabase';
import { useFocusEffect } from '@react-navigation/native';

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
            <Text style={styles.itemText}>{item.name}</Text>
        </TouchableOpacity>
    );

    if (loading) return <ActivityIndicator size="large" style={styles.loader} />;

    return (
        <FlatList
            data={camps}
            renderItem={renderItem}
            keyExtractor={item => item.id.toString()}
            style={styles.container}
        />
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#f5f5f5' 
    },
    loader: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    itemContainer: { 
        padding: 20, 
        borderBottomWidth: 1, 
        borderBottomColor: '#eee', 
        backgroundColor: '#fff' 
    },
    itemText: { 
        fontSize: 18 
    }
});