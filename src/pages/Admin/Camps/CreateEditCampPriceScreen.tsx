import React, { useState, useEffect } from 'react';
import { Text, TextInput, Alert, StyleSheet, ActivityIndicator, ScrollView, View, TouchableOpacity, Platform } from 'react-native';
import CustomPicker from '../../../components/CustomPicker'; 
import { StackScreenProps } from '@react-navigation/stack';
import { PlusStackParamList } from '../../../routes/plus.stack.routes';
import { supabase } from '../../../lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../../styles/theme';
import Icon from 'react-native-vector-icons/Feather';

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
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function fetchInitialData() {
            try {
                const tiersPromise = supabase.from('participant_tiers').select('*');
                const packagesPromise = supabase.from('registration_packages').select('*');
                
                const [tiersResult, packagesResult] = await Promise.all([tiersPromise, packagesPromise]);
                
                if (tiersResult.data) setTiers(tiersResult.data);
                if (packagesResult.data) setPackages(packagesResult.data);

                if (isEditing) {
                    const { data: priceData, error } = await supabase
                        .from('camp_prices')
                        .select('*')
                        .eq('id', priceId)
                        .single();

                    if (error) throw error;
                    
                    if (priceData) {
                        setPrice(priceData.price.toString().replace('.', ','));
                        setSelectedTierId(priceData.participant_tier_id);
                        setSelectedPackageId(priceData.registration_package_id);
                    }
                }
            } catch (error) {
                Alert.alert('Erro', 'Não foi possível carregar os dados.');
            } finally {
                setLoading(false);
            }
        }
        fetchInitialData();
    }, [isEditing, priceId]);

    async function handleSave() {
                if (!selectedTierId || !selectedPackageId || !price.trim()) {
            Alert.alert('Atenção', 'Todos os campos são obrigatórios.');
            return;
        }

        setSaving(true);

        try {
            const query = supabase
                .from('camp_prices')
                .select('id')
                .eq('camp_id', campId)
                .eq('participant_tier_id', selectedTierId)
                .eq('registration_package_id', selectedPackageId);

            const { data: existingData, error: checkError } = await query;

            if (checkError) {
                throw new Error(checkError.message);
            }

            if (existingData && existingData.length > 0) {
                if (isEditing) {
                    if (existingData[0].id !== priceId) {
                        Alert.alert('Conflito', 'Já existe um preço cadastrado com esta combinação de tipo e pacote.');
                        setSaving(false);
                        return;
                    }
                } else {
                    Alert.alert('Conflito', 'Já existe um preço cadastrado com esta combinação de tipo e pacote.');
                    setSaving(false);
                    return;
                }
            }

            const priceData = {
                camp_id: campId,
                participant_tier_id: selectedTierId,
                registration_package_id: selectedPackageId,
                price: parseFloat(price.replace(',', '.')),
            };

            const { error: saveError } = isEditing
                ? await supabase.from('camp_prices').update(priceData).eq('id', priceId)
                : await supabase.from('camp_prices').insert([priceData]);

            
                if ( saveError ) {
                    throw new Error(saveError.message);
                }

            setSaving(false);
            Alert.alert('Sucesso', 'Preço salvo com sucesso.');
            navigation.goBack();

        } catch (error) {
            setSaving(false);
            Alert.alert('Erro', `Não foi possível salvar: ${error.message}`);
        }      
    }

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
                            {isEditing ? 'Editar Preço' : 'Novo Preço'}
                        </Text>
                    </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                    <Text style={styles.label}>Tipos de Inscrições</Text>
                    <CustomPicker
                        selectedValue={selectedTierId}
                        onValueChange={(value) => setSelectedTierId(value)}
                        items={tiers.map(tier => ({ label: tier.name, value: tier.id }))}
                        label="Selecione o nível..."
                    />

                    <Text style={styles.label}>Pacote de Inscrições</Text>
                    <CustomPicker
                        selectedValue={selectedPackageId}
                        onValueChange={(value) => setSelectedPackageId(value)}
                        items={packages.map(pkg => ({ label: pkg.name, value: pkg.id }))}
                        label="Selecione o pacote..."
                    />

                    <Text style={styles.label}>Preço (R$)</Text>
                    <TextInput
                        style={styles.input}
                        value={price}
                        onChangeText={setPrice}
                        keyboardType="numeric"
                        placeholder="Ex: 250,00"
                        placeholderTextColor={theme.colors.textSecondary}
                    />
                    
                    <TouchableOpacity 
                        style={styles.buttonContainer} 
                        onPress={handleSave} 
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator color={theme.colors.textOnPrimary} />
                        ) : (
                            <Text style={styles.buttonText}>Salvar Preço</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
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
    label: {
        ...theme.typography.body,
        fontWeight: 'bold',
        marginBottom: theme.spacing.sm,
        marginTop: theme.spacing.md,
        color: theme.colors.textPrimary,
    },
    input: {
        ...theme.cardStyle,
        paddingHorizontal: theme.spacing.md,
        height: 50,
        fontSize: 16,
        color: theme.colors.textPrimary,
    },
    buttonContainer: {
        backgroundColor: theme.colors.textPrimary,
        borderRadius: 10,
        padding: 14,
        alignItems: 'center',
        width: '100%',
        marginTop: theme.spacing.lg,
    },
    buttonText: {
        color: theme.colors.textOnPrimary,
        fontSize: 18,
        fontWeight: 'bold',
    },
});