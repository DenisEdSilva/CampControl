import React, { useState, useCallback } from 'react';
import { View, Button, FlatList, ActivityIndicator, RefreshControl, Text, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { PlusStackParamList } from '../../../routes/plus.stack.routes';
import { supabase } from '../../../lib/supabase';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';

type Props = StackScreenProps<PlusStackParamList, 'RegistrationPackagesList'>;
type RegistrationPackage = {
    id: number;
    name: string;
};

export default function RegistrationPackagesListScreen({ navigation }: Props) {
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [packages, setPackages] = useState<RegistrationPackage[]>([]);

    async function fetchPackages() {
        const { data, error } = await supabase
            .from('registration_packages')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.error('Erro ao carregar pacotes de inscrição:', error);
        } else {
            setPackages(data || []);
        }
    }

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            fetchPackages().finally(() => setLoading(false));
        }, [])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchPackages();
        setRefreshing(false);
    }, []);

    async function handleDelete(itemId: number, itemName: string) {
        Alert.alert(
            "Confirmar Exclusão",
            `Tem certeza que deseja excluir o pacote "${itemName}"? Esta opção não podera ser desfeita.`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Excluir",
                    style: "destructive",
                    onPress: async () => {
                        const { error } = await supabase
                        .from('registration_packages')
                        .delete()
                        .eq('id', itemId);

                        if (error) {
                        if (error.code === '23503') {
                            Alert.alert(
                                "Ação Bloqueada",
                                `Este pacote não pode ser excluído pois está associado a um ou mais planos dos acampamentos.`
                            );
                        } else {
                            Alert.alert("Erro", "Não foi possível excluir o pacote.");
                            console.error("Erro ao excluir:", error);
                        }
                    } else {
                        Alert.alert("Sucesso", `"${itemName}" foi excluído.`);
                        setPackages(currentPackage => 
                            currentPackage.filter(rp => rp.id !== itemId)
                        );
                    }
                    }
                }
            ]
        )
    }

    const renderItem = ({ item }: { item: RegistrationPackage }) => (
        <View style={styles.itemContainer}>
            <Text style={styles.itemText}>{item.name}</Text>
            <View style={styles.actionsContainer}>
                <TouchableOpacity onPress={() => navigation.navigate('EditRegistrationPackageScreen', { packageId: item.id })}>
                    <Icon name="edit-2" size={20} color="#007BFF" />
                </TouchableOpacity>
                <TouchableOpacity style={{ marginLeft: 20 }} onPress={() => handleDelete(item.id, item.name)}>
                    <Icon name="trash-2" size={20} color="#ff4757" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Button
                    title="Adicionar Novo Pacote"
                    onPress={() => navigation.navigate('CreateRegistrationPackageScreen')}
                />
            </View>
            
            {loading ? (
                <ActivityIndicator size="large" style={styles.loader}/>
            ) : (
                <FlatList
                    data={packages}
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
    safeArea: { flex: 1, backgroundColor: '#f5f5f5' },
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