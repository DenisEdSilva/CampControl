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
import { StackScreenProps } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { PlusStackParamList } from '../../../routes/plus.stack.routes';
import { supabase } from '../../../lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';

type Props = StackScreenProps<PlusStackParamList, 'ArchivedCamps'>;

type ArchivedCamp = {
    id: number;
    name: string;
}

export default function ArchivedCampsScreen({ }: Props) {
    const [loading, setLoading] = useState(true);
    const [archivedCamps, setArchivedCamps] = useState<ArchivedCamp[]>([]);

    useFocusEffect(
        useCallback(() => {
            const fetchArchivedCamps = async () => {
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
            };

            fetchArchivedCamps();
        }, [])
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
            <Text style={styles.itemText}>{item.name}</Text>
            <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleRestoreCamp(item.id, item.name)}
            >
                <Icon name="rotate-ccw" size={20} color="#007BFF" />
                <Text style={styles.actionText}>Restaurar</Text>
            </TouchableOpacity>
        </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {loading ? (
        <ActivityIndicator size="large" style={styles.loader} />
      ) : (
        <FlatList
          data={archivedCamps}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Nenhum acampamento arquivado.</Text>
            </View>
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
    backgroundColor: '#fff',
  },
  itemText: {
    fontSize: 16,
    flex: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
    backgroundColor: '#e7f3ff'
  },
  actionText: {
    fontSize: 14,
    color: '#007BFF',
    marginLeft: 8,
    fontWeight: 'bold'
  },
  emptyContainer: {
    flex: 1,
    marginTop: 50,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyText: {
    fontSize: 16,
    color: 'gray',
  },
});