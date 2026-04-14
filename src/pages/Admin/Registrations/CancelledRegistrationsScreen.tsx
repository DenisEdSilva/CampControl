import React, { useState, useCallback } from 'react';
import { 
    Text, 
    View, 
    StyleSheet, 
    FlatList, 
    ActivityIndicator, 
    TouchableOpacity, 
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { PlusStackParamList } from '../../../routes/plus.stack.routes';
import { supabase } from '../../../lib/supabase';
import Icon from 'react-native-vector-icons/Feather';
import { theme } from '../../../styles/theme';

type Props = StackScreenProps<PlusStackParamList, 'CancelledRegistrationsScreen'>;

type CancelledRegistration = {
    id: number;
    participants: { name: string };
}

export default function CancelledRegistrationsScreen({ route, navigation }: Props) {
    const { campId } = route.params;
    const [loading, setLoading] = useState(true);
    const [cancelled, setCancelled] = useState<CancelledRegistration[]>([]);

    const fetchCancelled = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('registrations')
                .select('id, participants ( name )')
                .eq('status', 'Cancelado')
                .eq('camp_id', campId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCancelled(data as any || []);
        } catch (error) {
            console.error('Erro ao buscar inscrições canceladas:', error);
            Alert.alert('Erro', 'Não foi possível carregar a lista de cancelados.');
        } finally {
            setLoading(false);
        }
    }, [campId]);

    useFocusEffect(
        useCallback(() => {
            fetchCancelled();
        }, [fetchCancelled])
    );

    const handleRestore = async (regId: number, participantName: string) => {
        Alert.alert(
            "Confirmar Restauração",
            `Tem certeza que deseja restaurar a inscrição de "${participantName}"?`,
            [
                { text: "Cancelar", style: "cancel"},
                {
                    text: "Sim, Restaurar",
                    onPress: async () => {
                        try {
                            const { data: regData, error: fetchError } = await supabase
                                .from('registrations')
                                .select('final_price, payments(payed_value)')
                                .eq('id', regId)
                                .single();

                            if (fetchError || !regData) {
                                throw fetchError || new Error('Inscrição não encontrada');
                            }



                            const totalPaid = regData.payments.reduce((sum: number, payment: { payed_value: number }) => sum + payment.payed_value, 0);

                            const newStatus = (totalPaid >= regData.final_price) ? 'Concluido' : 'Em andamento';

                            const { error: updateError } = await supabase
                                .from('registrations')
                                .update({ status: newStatus })
                                .eq('id', regId);

                            if (updateError) {
                                throw updateError;
                            }

                            Alert.alert("Sucesso", `A inscrição de "${participantName}" foi restaurada.`);
                            setCancelled(current =>
                                current.filter(reg => reg.id !== regId)
                            );

                        } catch (error) {
                            console.error('Erro ao restaurar inscrição:', error);
                            Alert.alert('Erro', 'Não foi possível restaurar a inscrição.');
                        }
                    },
                },
            ]
        );
    };

    const renderItem = ({ item }: { item: CancelledRegistration }) => (
        <View style={styles.itemContainer}>
            <Text style={styles.itemText} numberOfLines={1}>{item.participants.name}</Text>
            <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleRestore(item.id, item.participants.name)}
            >
                <Icon name="rotate-ccw" size={18} color={theme.colors.textPrimary} />
                <Text style={styles.actionText}>Restaurar</Text>
            </TouchableOpacity>
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
                            Inscrições Canceladas
                        </Text>
                    </View>
                </View>
                <FlatList
                    data={cancelled}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={{ paddingHorizontal: '10%' }}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Nenhuma inscrição cancelada.</Text>
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
  },
  header: {
    width: '80%',
    alignSelf: 'center',
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
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.background
  },
  actionText: {
    ...theme.typography.body,
    fontSize: 14,
    marginLeft: 8,
    fontWeight: 'bold'
  },
  emptyContainer: {
    paddingTop: 50,
    alignItems: 'center',
  },
  emptyText: {
    ...theme.typography.body,
  },
});