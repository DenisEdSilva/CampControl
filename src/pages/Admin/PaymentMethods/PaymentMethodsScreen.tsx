import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Button, FlatList, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { PlusStackParamList } from '../../../routes/plus.stack.routes';
import { supabase } from '../../../lib/supabase';
import { useFocusEffect } from '@react-navigation/native';

type Props = StackScreenProps<PlusStackParamList, 'PaymentMethodsList'>;

type PaymentMethod = {
  id: number;
  name: string;
}[];

export default function PaymentMethodsScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod>([]);

  async function fetchPaymentMethods() {
    setLoading(true);
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .order('name', { ascending: true });

    setLoading(false);
    if (error) {
      console.error('Erro ao carregar métodos de pagamento:', error);
    } else {
      setPaymentMethods(data || []);
    }
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchPaymentMethods().finally(() => setLoading(false));
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPaymentMethods();
    setRefreshing(false);
  }, []);

  const renderItem = ({ item }: { item: { id: number; name: string } }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemText}>{item.name}</Text>
      <TouchableOpacity onPress={() => navigation.navigate('EditPaymentMethodScreen', { paymentMethodId: item.id })}>
        <Text style={styles.actionText}>Editar</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button
          title="Adicionar Novo Método"
          onPress={() => navigation.navigate('CreatePaymentMethodScreen')}
        />
      </View>
      
      {loading ? (
        // eslint-disable-next-line react-native/no-inline-styles
        <ActivityIndicator size="large" style={{ flex: 1 }}/>
      ) : (
        <FlatList
          data={paymentMethods}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          style={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
        />
      )}
    </View>
  );
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