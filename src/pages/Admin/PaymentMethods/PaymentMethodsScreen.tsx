import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Button, FlatList, RefreshControl, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { PlusStackParamList } from '../../../routes/plus.stack.routes';
import { supabase } from '../../../lib/supabase';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';

type Props = StackScreenProps<PlusStackParamList, 'PaymentMethodsList'>;

type PaymentMethod = {
  id: number;
  name: string;
};

export default function PaymentMethodsScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  async function fetchPaymentMethods() {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .order('name', { ascending: true });

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

  async function handleDelete(itemId: number, itemName: string) {
      Alert.alert(
          "Confirmar Exclusão",
          `Tem certeza que deseja excluir o método de pagamento "${itemName}"? Esta opção não podera ser desfeita.`,
          [
              { text: "Cancelar", style: "cancel" },
              {
                  text: "Excluir",
                  style: "destructive",
                  onPress: async () => {
                      const { error } = await supabase
                      .from('payment_methods')
                      .delete()
                      .eq('id', itemId);

                      if (error) {
                      if (error.code === '23503') {
                          Alert.alert(
                              "Ação Bloqueada",
                              `Este método de pagamento não pode ser excluído pois está associado a um ou mais pagamentos.`
                          );
                      } else {
                          Alert.alert("Erro", "Não foi possível excluir o método de pagamento.");
                          console.error("Erro ao excluir:", error);
                      }
                    } else {
                        Alert.alert("Sucesso", `"${itemName}" foi excluído.`);
                        setPaymentMethods(currentPaymentMethod => 
                            currentPaymentMethod.filter(pm => pm.id !== itemId)
                        );
                    }
                  }
              }
          ]
      )
  }

  const renderItem = ({ item }: { item: PaymentMethod }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemText}>{item.name}</Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity onPress={() => navigation.navigate('EditPaymentMethodScreen', { paymentMethodId: item.id })}>
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
          title="Adicionar Novo Método"
          onPress={() => navigation.navigate('CreatePaymentMethodScreen')}
        />
      </View>
      
      {loading ? (
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
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
  actionsContainer: {
    flexDirection: 'row', 
  },
  itemText: {
    fontSize: 16,
  },
});