import React, { useState, useCallback } from 'react';
import { View, Button, FlatList, ActivityIndicator, StyleSheet, RefreshControl, Text, TouchableOpacity } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { PlusStackParamList } from '../../../routes/plus.stack.routes';
import { supabase } from '../../../lib/supabase';
import { useFocusEffect } from '@react-navigation/native';

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

  if (loading) {
    return (
      <View>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  const renderItem = ({ item }: { item: Congregation }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemText}>{item.name}</Text>
      <TouchableOpacity onPress={() => navigation.navigate('EditCongregationScreen', { congregationId: item.id })}>
        <Text  style={styles.actionText} >Editar</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button 
          title="Adicionar nova Congregação"
          onPress={() => navigation.navigate('CreateCongregationScreen')}
        />
      </View>

      <FlatList
        data={congregations}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

    </View>
  )

}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  list: {
    flex: 1,
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
  },
  actionText: {
    fontSize: 14,
    color: '#007BFF',
  }
});