import React, { useState, useEffect } from 'react';
import { View, Text, Button, Alert, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import CustomPicker from '../../../components/CustomPicker'; 
import { StackScreenProps } from '@react-navigation/stack';
import { HomeStackParamList } from '../../../routes/home.stack.routes';
import { supabase } from '../../../lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = StackScreenProps<HomeStackParamList, 'EditRegistration'>;

type Tier = { id: number; name: string; };
type Package = { id: number; name: string; };
type Congregation = { id: number; name: string; };

export default function EditRegistrationScreen({ route, navigation }: Props) {
    const { registrationId } = route.params;

    const [selectedTierId, setSelectedTierId] = useState<number | undefined>();
    const [selectedPackageId, setSelectedPackageId] = useState<number | undefined>();
    const [selectedCongregationId, setSelectedCongregationId] = useState<number | undefined>();
    
    const [tiers, setTiers] = useState<Tier[]>([]);
    const [packages, setPackages] = useState<Package[]>([]);
    const [congregations, setCongregations] = useState<Congregation[]>([]);

    const [finalPrice, setFinalPrice] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function fetchInitialData() {
            const tiersPromise = supabase.from('participant_tiers').select('*');
            const packagesPromise = supabase.from('registration_packages').select('*');
            const congregationsPromise = supabase.from('congregations').select('*');
            
            const registrationPromise = supabase.from('registrations').select('*').eq('id', registrationId).single();

            const [tiersResult, packagesResult, congregationsResult, registrationResult] = await Promise.all([tiersPromise, packagesPromise, congregationsPromise, registrationPromise]);
            
            if (tiersResult.data) setTiers(tiersResult.data);
            if (packagesResult.data) setPackages(packagesResult.data);
            if (congregationsResult.data) setCongregations(congregationsResult.data);

            if (registrationResult.data) {
                const regData = registrationResult.data;
                setSelectedCongregationId(regData.congregation_id);
                setSelectedTierId(regData.participant_tier_id);
                setSelectedPackageId(regData.registration_package_id);
                setFinalPrice(regData.final_price);
            } else {
                Alert.alert('Erro', 'Não foi possível carregar os dados da inscrição.');
                navigation.goBack();
            }

            setLoading(false);
        }
        fetchInitialData();
    }, [registrationId, navigation]);
    
    async function recalculatePrice(tierId?: number, packageId?: number) {
        console.log('--- RECALCULANDO PREÇO ---');
        console.log('Buscando para a combinação:');
        console.log('Tier ID selecionado:', tierId);
        console.log('Package ID selecionado:', packageId);

        if (tierId && packageId) {
            const { data: regData, error: regError } = await supabase
                .from('registrations')
                .select('camp_id')
                .eq('id', registrationId)
                .single();

            if (regError || !regData) {
                console.error('Não foi possível encontrar o camp_id da inscrição.');
                return;
            }
            console.log('Para o Acampamento ID:', regData.camp_id);

            const { data: priceData, error: priceError } = await supabase
                .from('camp_prices')
                .select('price')
                .eq('camp_id', regData.camp_id)
                .eq('participant_tier_id', tierId)
                .eq('registration_package_id', packageId)
                .single()

            console.log('Resultado da busca de preço:', { priceData, priceError });

            if (priceData) {
                Alert.alert(
                    "Alteração de Preço Detectada",
                    `O novo preço para esta combinação é R$ ${priceData.price.toFixed(2)}. Deseja atualizar o valor da inscrição?`,
                    [
                        { text: "Não, Manter Preço Original", style: "cancel"},
                        { text: "Sim, Atualizar Preço", onPress: () => setFinalPrice(priceData.price)}
                    ]
                );
            } else if (!priceData) {
                console.log('Nenhum preço encontrado, definindo finalPrice como null.');
                setFinalPrice(null);
            }
        }
    }

    async function handleUpdate() {
        if (!selectedTierId || !selectedPackageId || !selectedCongregationId || finalPrice === null) {
            Alert.alert('Atenção', 'Todos os campos são obrigatórios.');
            return;
        }
        setSaving(true);

        const { error } = await supabase
            .from('registrations')
            .update({
                congregation_id: selectedCongregationId,
                participant_tier_id: selectedTierId,
                registration_package_id: selectedPackageId,
                final_price: finalPrice,
            })
            .eq('id', registrationId);

        setSaving(false);
        if (error) {
            Alert.alert('Erro', 'Não foi possível atualizar a inscrição.');
        } else {
            Alert.alert('Sucesso!', 'Inscrição atualizada com sucesso.');
            navigation.goBack();
        }
    }

    if (loading) {
        return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: 'center' }} />;
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            {loading ? (
                <ActivityIndicator size="large" style={{ flex: 1, justifyContent: 'center' }} />
            ) : (
                <ScrollView style={styles.container}>
                    <Text
                        style={styles.sectionTitle}
                    >
                        Editar Dados da Inscrição
                    </Text>

                    <CustomPicker
                        label="Congregação"
                        selectedValue={selectedCongregationId}
                        onValueChange={setSelectedCongregationId}
                        items={congregations.map(c => ({
                            label: c.name,
                            value: c.id,
                        }))}
                    />

                    <CustomPicker
                        label="Nível de Participante"
                        selectedValue={selectedTierId}
                        onValueChange={(value) => {
                            setSelectedTierId(value);
                            recalculatePrice(value, selectedPackageId);
                        }}
                        items={tiers.map(t => ({
                            label: t.name,
                            value: t.id,
                        }))}
                    />

                    <CustomPicker
                        label="Pacote de Inscrição"
                        selectedValue={selectedPackageId}
                        onValueChange={(value) => {
                            setSelectedPackageId(value);
                            recalculatePrice(selectedTierId, value)
                        }}
                        items={packages.map(p => ({
                            label: p.name,
                            value: p.id,
                        }))}
                    />

                    {finalPrice !== null && (
                        <View
                            style={styles.priceContainer}
                        >
                            <Text
                                style={styles.priceLabel}
                            >
                                Novo Valor Total:
                            </Text>
                            <Text
                                style={styles.priceValue}
                            >
                                R$ {finalPrice.toFixed(2).replace('.', ',')}
                            </Text>
                        </View>
                    )}

                    <View
                        style={{
                            marginTop: 20,
                        }}
                    >
                        <Button
                            title={saving ? "Salvando..." : "Salvar Alterações"}
                            onPress={handleUpdate}
                            disabled={saving || finalPrice === null}
                        />
                    </View>
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { 
        flex: 1, 
        backgroundColor: '#fff' 
    },
    container: { 
        flex: 1, 
        padding: 20 
    },

    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },

    priceContainer: {
        marginTop: 10,
        padding: 15,
        backgroundColor: '#e0f2fe',
        borderRadius: 8,
        alignItems: 'center',
    },

    priceLabel: {
        fontSize: 16,
        color: '#0284c7',
    },

    priceValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#0369a1',
        marginTop: 4,
    },
});