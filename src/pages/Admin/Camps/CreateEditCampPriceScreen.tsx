import React, { useState, useEffect } from 'react';
import { Text, TextInput, Button, Alert, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import CustomPicker from '../../../components/CustomPicker'; 
import { StackScreenProps } from '@react-navigation/stack';
import { PlusStackParamList } from '../../../routes/plus.stack.routes';
import { supabase } from '../../../lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = StackScreenProps<PlusStackParamList, 'CreateEditCampPriceScreen'>;
type Tier = { id: number; name: string; };
type Package = { id: number; name: string; };

export default function CreateEditCampPriceScreen({ route, navigation }: Props) {
    const { campId, priceId } = route.params;
    const isEditing = !!priceId;

    const [price, setPrice] = useState('');
    const [selectedTierId, setSelectedTierId] = useState<number | undefined>();
    const [selectedPackageId, setSelectedPackageId] = useState<number | undefined>();
    
    const [tiers, setTiers] = useState<Tier[]>([]);
    const [packages, setPackages] = useState<Package[]>([]);
    
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchInitialData() {
            const tiersPromise = supabase.from('participant_tiers').select('*');
            const packagesPromise = supabase.from('registration_packages').select('*');
            
            const [tiersResult, packagesResult] = await Promise.all([tiersPromise, packagesPromise]);
            
            if (tiersResult.data) setTiers(tiersResult.data);
            if (packagesResult.data) setPackages(packagesResult.data);

            if (isEditing) {
                const { data: priceData } = await supabase
                    .from('camp_prices')
                    .select('*')
                    .eq('id', priceId)
                    .single();
                
                if (priceData) {
                    setPrice(priceData.price.toString());
                    setSelectedTierId(priceData.participant_tier_id);
                    setSelectedPackageId(priceData.registration_package_id);
                }
            }
            setLoading(false);
        }
        fetchInitialData();
    }, [isEditing, priceId]);

    async function handleSave() {
        if (!selectedTierId || !selectedPackageId || !price.trim()) {
            Alert.alert('Atenção', 'Todos os campos são obrigatórios.');
            return;
        }

        const priceData = {
            camp_id: campId,
            participant_tier_id: selectedTierId,
            registration_package_id: selectedPackageId,
            price: parseFloat(price.replace(',', '.')),
        };

        const { error } = isEditing
            ? await supabase.from('camp_prices').update(priceData).eq('id', priceId)
            : await supabase.from('camp_prices').insert([priceData]);

        if (error) {
            Alert.alert('Erro', 'Não foi possível salvar o preço.');
        } else {
            Alert.alert('Sucesso', 'Preço salvo com sucesso.');
            navigation.goBack();
        }
    }


    return (
        <SafeAreaView style={styles.safeArea}>
            {loading ? (
                <ActivityIndicator size="large" style={{ flex: 1 }} />
            ) : (
                <ScrollView style={styles.container}>
                    <CustomPicker
                        label="Nível de Participante"
                        selectedValue={selectedTierId}
                        onValueChange={(value) => setSelectedTierId(value)}
                        items={tiers.map(tier => ({ label: tier.name, value: tier.id }))}
                        placeholder="Selecione o nível (Adulto, Criança...)"
                    />

                    <CustomPicker
                        label="Pacote de Inscrição"
                        selectedValue={selectedPackageId}
                        onValueChange={(value) => setSelectedPackageId(value)}
                        items={packages.map(pkg => ({ label: pkg.name, value: pkg.id }))}
                        placeholder="Selecione o pacote (Integral, Diária...)"
                    />

                    <Text style={styles.label}>Preço (R$)</Text>
                    <TextInput
                        style={styles.input}
                        value={price}
                        onChangeText={setPrice}
                        keyboardType="numeric"
                        placeholder="Ex: 250,00"
                    />
                    
                    <Button title="Salvar Preço" onPress={handleSave} disabled={loading} />
                </ScrollView>
            )}
        </SafeAreaView>
    );
}
const styles = StyleSheet.create({
    safeArea: { 
        flex: 1, 
        backgroundColor: '#f5f5f5' 
    },
    container: { 
        flex: 1, 
        padding: 20 
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
    },
    input: {
        height: 50,
        backgroundColor: '#fff',
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 20,
        fontSize: 16,
    },
});