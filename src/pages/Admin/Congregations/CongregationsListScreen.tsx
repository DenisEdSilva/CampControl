import React, { useState, useCallback } from 'react';
import { View, FlatList, ActivityIndicator, StyleSheet, RefreshControl, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { PlusStackParamList } from '../../../routes/plus.stack.routes';
import { supabase } from '../../../lib/supabase';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { theme } from '../../../styles/theme';

type Props = StackScreenProps<PlusStackParamList, 'CongregationsList'>;

type Congregation = {
  id: number;
  name: string;
};

export default function CongregationsListScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [congregations, setCongregations] = useState<Congregation[]>([]);

  async function fetchCongregations() {
    setLoading(true);
    const { data, error } = await supabase
      .from('congregations')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Erro ao buscar congregações:', error);
    } else {
      setCongregations(data as Congregation[]);
    }

    setLoading(false);
  }

  useFocusEffect(
    useCallback(() => {
      fetchCongregations();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCongregations().then(() => setRefreshing(false));
  }, []);

  async function handleDelete(itemId: number, itemName: string) {
          Alert.alert(
              "Confirmar Exclusão",
              `Tem certeza que deseja excluir a congregação "${itemName}"? Esta opção não podera ser desfeita.`,
              [
                  { text: "Cancelar", style: "cancel" },
                  {
                      text: "Excluir",
                      style: "destructive",
                      onPress: async () => {
                          const { error } = await supabase
                          .from('congregations')
                          .delete()
                          .eq('id', itemId);
  
                          if (error) {
                          if (error.code === '23503') {
                              Alert.alert(
                                  "Ação Bloqueada",
                                  `Esta congregação não pode ser excluída pois está associada a uma ou mais pessoas cadastradas.`
                              );
                          } else {
                              Alert.alert("Erro", "Não foi possível excluir a congregação.");
                              console.error("Erro ao excluir:", error);
                          }
                      } else {
                          Alert.alert("Sucesso", `"${itemName}" foi excluída.`);
                          setCongregations(currentCongregation => 
                              currentCongregation.filter(c => c.id !== itemId)
                          );
                      }
                      }
                  }
              ]
          )
      }

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.textPrimary} />
      </SafeAreaView>
    );
  }

  const renderItem = ({ item }: { item: Congregation }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemText} numberOfLines={1}>{item.name}</Text>
      <View style={styles.actionsContainer}>
        <TouchableOpacity onPress={() => navigation.navigate('EditCongregationScreen', { congregationId: item.id })}>
          <Icon name="edit-2" size={20} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={{ marginLeft: 20 }} onPress={() => handleDelete(item.id, item.name)}>
          <Icon name="trash-2" size={20} color={theme.colors.accent} />
        </TouchableOpacity>
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
              Congregações
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.buttonContainer}
            onPress={() => navigation.navigate('CreateCongregationScreen')}
          >
            <Text style={styles.buttonText}>
              <Icon name="plus" size={18} /> Nova Congregação
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={congregations}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.textPrimary}/>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhuma congregação encontrada.</Text>
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