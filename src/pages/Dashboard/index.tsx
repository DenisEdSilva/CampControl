import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TextInput, TouchableOpacity} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { HomeStackParamList } from '../../routes/home.stack.routes';
import { supabase } from '../../lib/supabase';
import { useFocusEffect } from '@react-navigation/native';
import CustomPicker from '../../components/CustomPicker';
import Icon from 'react-native-vector-icons/Feather';

type Props = StackScreenProps<HomeStackParamList, 'Dashboard'>;

type Camp = {
  id: number;
  name: string;
}

type Registration = {
  id: number;
  final_price: number;
  status: string;
  congregation_id: {
    name: string
  };
  registration_package_id: {
    name: string
  };
  participant_tier_id: {
    name: string
  };
  participants: {
    name: string
  };
};

export default function Dashboard({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [camps, setCamps] = useState<Camp[]>([]);
  const [selectedCampId, setSelectedCampId] = useState<number | undefined>();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchCamps() {
      const { data, error } = await supabase
        .from('camps')
        .select('id, name')
        .order('name');

      if (data && data.length > 0) {
        setCamps(data);
        if (!selectedCampId) {
          setSelectedCampId(data[0].id)
        }
      } else if (error) {
        console.error("Erro ao buscar acampamentos: ", error);
      }
    }
    fetchCamps()
  }, [selectedCampId]);

  useFocusEffect(
    React.useCallback(() => {
      if (selectedCampId) {
        setLoading(true);
          
        async function fetchRegistrations() {
          const { data, error } = await supabase
            .from('registrations')
            .select(`
              id,
              final_price,
              status,
              congregation_id (name),
              registration_package_id (name),
              participant_tier_id (name),
              participants ( name )  
            `)
            .eq('camp_id', selectedCampId)
            .order('created_at', { ascending: false});
        
          if (data) {
            setRegistrations(
              data.map((item: any) => ({
                ...item,
                participants: Array.isArray(item.participants) ? item.participants[0] : item.participants
              }))
            );
          } else if (error) {
            console.error("Erro ao buscar inscrições: ", error)
          }
          setLoading(false);
      
        }
        fetchRegistrations();

      } else {
        setLoading(false);
      }  
    }, [selectedCampId])
  );

  const filteredRegistrations = useMemo(() => {
    if (!searchQuery) {
      return registrations;
    }
    return registrations.filter(reg => 
      reg.participants.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [searchQuery, registrations])

  const renderItem = ({ item }: { item: Registration }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => navigation.navigate('RegistrationDetail', {registrationId: item.id})}
    >
      <View>
        <Text style={styles.itemText}>{item.participants.name}</Text>
        <View style={styles.itemDirection}>
          <Text style={styles.itemSubText}>{item.congregation_id.name}</Text>
          <Text style={styles.itemSubText}>{item.registration_package_id.name}</Text>
          <Text style={styles.itemSubText}>{item.participant_tier_id.name}</Text>
        </View>
        <Text style={styles.itemSubText}>Status: {item.status}</Text>
      </View>

      <Icon name="chevron-right" size={24} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomPicker 
          label="Selecione um Acampamento"
          selectedValue={selectedCampId}
          onValueChange={(value) => setSelectedCampId(value)}
          items={camps.map(camp => ({
            label: camp.name,
            value: camp.id
          }))}
        />

        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar participante por nome..."
            value={searchQuery}
            onChangeText={setSearchQuery}
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
            <Text style={styles.emptyText}>Nenhuma inscrição encontrada.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
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
    marginTop: 10,
  },
  searchIcon: {
    padding: 10,
  },
  searchInput: {
    flex: 1,
    paddingTop: 10,
    paddingRight: 10,
    paddingBottom: 10,
    paddingLeft: 0,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
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
  itemDirection: {
    flex: 1,
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center'
  },
  itemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  itemSubText: {
    fontSize: 14,
    color: 'gray',
    marginTop: 4,
    paddingRight: 10
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: 'gray',
  },
});