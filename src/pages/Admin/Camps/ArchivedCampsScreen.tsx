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

type Props = StackScreenProps<PlusStackParamList, 'ArchivedCamps'>;

type ArchivedCamp = {
    id: number;
    name: string;
}

export default function ArchivedCampsScreen({ navigation }: Props) {
    const [loading, setLoading] = useState(true);
    const [archivedCamps, setArchivedCamps] = useState<ArchivedCamp[]>([]);

    const fetchArchivedCamps = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('camps')
                .select('id, name')
                .eq('status', 'archived')
                .order('name', { ascending: true });

            if (error) {
                throw error;
            }
  
            setArchivedCamps(data || []);

        } catch (error) {
            console.error('Erro ao buscar acampamentos arquivados:', error);
            Alert.alert('Erro', 'Não foi possível carregar a lista de arquivados.');
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchArchivedCamps();
        }, [fetchArchivedCamps])
    );

    const handleRestoreCamp = async (campId: number, campName: string) => {
        Alert.alert(
            "Confirmar Restauração",
            `Tem Certeza que deseja restaurar o acampamento "${campName}"? Ele voltará para a lista de ativos.`,
            [
                { text: "Cancelar", style: "cancel"},
                {
                    text: "Sim, Restaurar",
                    onPress: async () => {
                        const { error } = await supabase
                            .from('camps')
                            .update({ status: 'active' })
                            .eq('id', campId)

                        if (error) {
                            Alert.alert("Erro", "Não foi possível restaurar o acampamento.");
                            console.error("Erro ao restaurar:", error);
                        } else {
                            Alert.alert("Sucesso", `"${campName}" foi restaurado.`);
                            setArchivedCamps(currentCamps =>
                                currentCamps.filter(camp => camp.id !== campId)
                            );
                        }
                    },
                },
            ]
        );
    };

    const renderItem = ({ item }: { item: ArchivedCamp }) => (
        <View style={styles.itemContainer}>
            <Text style={styles.itemText} numberOfLines={1}>{item.name}</Text>
            <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleRestoreCamp(item.id, item.name)}
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
                        Acampamentos Arquivados
                    </Text>
                </View>
            </View>
            <FlatList
                data={archivedCamps}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ paddingHorizontal: '10%' }}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Nenhum acampamento arquivado.</Text>
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
    flex: 1,
    paddingTop: 50,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyText: {
    ...theme.typography.body,
  },
});