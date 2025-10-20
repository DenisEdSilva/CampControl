import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TextInput, TouchableOpacity} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { HomeStackParamList } from '../../routes/home.stack.routes';
import { supabase } from '../../lib/supabase';
import { useFocusEffect } from '@react-navigation/native';
import CustomPicker from '../../components/CustomPicker';
import Icon from 'react-native-vector-icons/Feather';

type Props = StackScreenProps<HomeStackParamList, 'Dashboard'>;
type Camp = { id: number; name: string; };
type Registration = {
  id: number;
  final_price: number;
  status: string;
  congregations: { name: string };
  registration_packages: { name: string };
  participant_tiers: { name: string };
  participants: { name: string };
};

export default function Dashboard({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [camps, setCamps] = useState<Camp[]>([]);
  const [selectedCampId, setSelectedCampId] = useState<number | undefined>();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchCamps() {
      const { data, error } = await supabase.from('camps').select('id, name').order('name');
      if (data) {
        setCamps(data);
      } else if (error) {
        console.error("Erro ao buscar acampamentos: ", error);
      }
    }
    fetchCamps();
  }, []);


  useEffect(() => {
      if (camps.length > 0) {
        setSelectedCampId(prevId => {
          return prevId ? prevId : camps[0].id;
        });
      }
  }, [camps]);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true; 
      
      if (selectedCampId) {
        setLoading(true);
        async function fetchRegistrations() {
          const { data, error } = await supabase
            .from('registrations')
            .select('id, final_price, status, congregations(name), registration_packages(name), participant_tiers(name), participants(name)')
            .eq('camp_id', selectedCampId)
            .order('created_at', { ascending: false });
          
          if (isMounted) {
            if (data) {
              setRegistrations(data.map((item: any) => ({
                ...item,
                participants: item.participants || { name: 'Participante não encontrado' }
              })));
            } else if (error) {
              console.error("Erro ao buscar inscrições: ", error);
            }
            setLoading(false);
          }
        }
        fetchRegistrations();
      } else if (camps.length === 0) {
        setRegistrations([]);
        setLoading(false);
      }
      
      return () => {
        isMounted = false;
      };
    }, [selectedCampId, camps.length])
  );

  const filteredRegistrations = useMemo(() => {
    if (!searchQuery) return registrations;
    return registrations.filter(reg => 
      reg.participants?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, registrations]);

  const handleCampChange = useCallback((value: number | undefined) => {
    setSelectedCampId(value);
  }, []);

  const campItems = useMemo(() => {
    return camps.map(camp => ({ label: camp.name, value: camp.id }));
  }, [camps]);

  const renderItem = useCallback(({ item }: { item: Registration }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => navigation.navigate('RegistrationDetail', {registrationId: item.id})}
    >
      <View style={styles.itemDetails}>
        <Text style={styles.itemText}>{item.participants?.name}</Text>
        <View style={styles.itemSubRow}>
          <Text style={styles.itemSubText}>{item.congregations?.name}</Text>
          <Text style={styles.itemSubText}>{item.registration_packages?.name}</Text>
        </View>
        <Text style={styles.itemSubText}>{item.participant_tiers?.name}</Text>
        <Text style={[styles.itemStatus, { color: item.status === 'cancelled' ? 'red' : 'green' }]}>
          Status: {item.status}
        </Text>
      </View>
      <Icon name="chevron-right" size={24} color="#ccc" />
    </TouchableOpacity>
  ), [navigation]);

  return (
    <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <CustomPicker 
            label="Selecione um Acampamento"
            selectedValue={selectedCampId}
            onValueChange={handleCampChange}
            items={campItems}
          />
          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar participante por nome..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              editable={!!selectedCampId}
            />
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" style={styles.loader} />
        ) : (
          <FlatList 
            data={filteredRegistrations}
            renderItem={renderItem}
            keyExtractor={item => item.id.toString()}
            ListEmptyComponent={
              <Text style={styles.emptyText}>{camps.length > 0 ? 'Nenhuma inscrição encontrada.' : 'Nenhum acampamento cadastrado.'}</Text>
            }
          />
        )} 
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  header: { 
    padding: 16, 
    backgroundColor: '#fff', 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee' 
  },
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#f0f0f0', 
    borderRadius: 8,
    marginTop: 10 
  },
  searchIcon: { 
    padding: 10 
  },
  searchInput: { 
    flex: 1, 
    height: 40, 
    paddingRight: 10, 
    backgroundColor: 'transparent' 
  },
  loader: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#f5f5f5' 
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
  itemDetails: { 
    flex: 1 
  },
  itemSubRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    flexWrap: 'wrap' 
  },
  itemText: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    marginBottom: 4 
  },
  itemSubText: { 
    fontSize: 14, 
    color: 'gray', 
    marginRight: 10 
  },
  itemStatus: { 
    fontSize: 14, 
    marginTop: 4, 
    fontWeight: '500' 
  },
  emptyText: { 
    textAlign: 'center',
    marginTop: 50, 
    fontSize: 16, 
    color: 'gray' 
  },
});