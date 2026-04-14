import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TextInput, TouchableOpacity} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { HomeStackParamList } from '../../routes/home.stack.routes';
import { supabase } from '../../lib/supabase';
import { useFocusEffect } from '@react-navigation/native';
import CustomPicker from '../../components/CustomPicker';
import Icon from 'react-native-vector-icons/Feather';
import { theme } from '../../styles/theme';

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
  const [filterStatus, setFilterStatus] = useState('Em andamento');

  useEffect(() => {
    async function fetchCamps() {
      const { data, error } = await supabase.from('camps').select('id, name').order('name');
      if (data) {
        setCamps(data);
        if (data.length > 0 && !selectedCampId) {
            setSelectedCampId(data[0].id);
        }
      } else if (error) {
        console.error("Erro ao buscar acampamentos: ", error);
      }
    }
    fetchCamps();
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true; 
      
      if (selectedCampId) {
        setLoading(true);
        async function fetchRegistrations() {
          let query = supabase
            .from('registrations')
            .select('id, final_price, status, congregations(name), registration_packages(name), participant_tiers(name), participants(name)')
            .eq('camp_id', selectedCampId);

          if (filterStatus === 'Cancelado') {
            query = query.eq('status', 'Cancelado');
          } else {
            query = query.in('status', ['Em andamento', 'Concluido', 'Presença Confirmada']);
          }
          
          const { data, error } = await query.order('created_at', { ascending: false });
          
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
      } else {
        setRegistrations([]);
        setLoading(false);
      }
      
      return () => {
        isMounted = false;
      };
    }, [selectedCampId, filterStatus])
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
          <Text style={styles.itemSubText}>{item.registration_packages?.name} • {item.participant_tiers?.name}</Text>
        </View>
        <Text style={[styles.itemStatus, { color: item.status === 'Cancelado' ? theme.colors.accent : '#16a34a' }]}>
          {item.status}
        </Text>
      </View>
      <Icon name="chevron-right" size={24} color={theme.colors.textSecondary} />
    </TouchableOpacity>
  ), [navigation]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Inscrições</Text>

          <CustomPicker 
            label="Selecione um Acampamento"
            selectedValue={selectedCampId}
            onValueChange={handleCampChange}
            items={campItems}
          />
          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nome..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              editable={!!selectedCampId}
            />
          </View>
           <View style={styles.filterToggle}>
                <TouchableOpacity 
                    style={[styles.toggleButton, filterStatus === 'Em andamento' && styles.toggleButtonActive]}
                    onPress={() => setFilterStatus('Em andamento')}
                >
                    <Text style={[styles.toggleText, filterStatus === 'Em andamento' && styles.toggleTextActive]}>Ativas</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.toggleButton, filterStatus === 'Cancelado' && styles.toggleButtonActive]}
                    onPress={() => setFilterStatus('Cancelado')}
                >
                    <Text style={[styles.toggleText, filterStatus === 'Cancelado' && styles.toggleTextActive]}>Canceladas</Text>
                </TouchableOpacity>
            </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.textPrimary} style={styles.loader} />
        ) : (
          <FlatList 
            data={filteredRegistrations}
            renderItem={renderItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.listContentContainer}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {camps.length > 0 ? 'Nenhuma inscrição encontrada.' : 'Nenhum acampamento cadastrado.'}
                </Text>
              </View>
            }
          />
        )} 
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    width: '90%',
    alignSelf: 'center',
  },
  header: { 
    paddingTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  headerTitle: {
    ...theme.typography.header,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  searchContainer: { 
    ...theme.cardStyle,
    flexDirection: 'row', 
    alignItems: 'center', 
    height: 50,
    marginTop: theme.spacing.md,
  },
  searchIcon: { 
    marginLeft: theme.spacing.md,
  },
  searchInput: { 
    flex: 1, 
    height: '100%', 
    paddingLeft: theme.spacing.md,
    ...theme.typography.body,
  },
  filterToggle: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    marginTop: theme.spacing.md,
  },
  toggleButton: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: theme.colors.textPrimary,
  },
  toggleText: {
    ...theme.typography.body,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
  },
  toggleTextActive: {
    color: theme.colors.textOnPrimary,
  },
  loader: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
  },
  itemContainer: {
    ...theme.cardStyle,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listContentContainer: {
    paddingBottom: theme.spacing.md,
  },
  emptyContainer: {
    paddingTop: 48,
    alignItems: 'center',
  },
  itemDetails: { 
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  itemSubRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    flexWrap: 'wrap' 
  },
  itemText: {
    ...theme.typography.body,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
  },
  itemSubText: {
    ...theme.typography.body,
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginRight: theme.spacing.sm,
  },
  itemStatus: { 
    fontSize: 14, 
    marginTop: 4, 
    fontWeight: 'bold' 
  },
  emptyText: { 
    ...theme.typography.body,
    textAlign: 'center'
  },
});