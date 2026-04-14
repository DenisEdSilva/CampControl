import React, { useState, useEffect } from 'react';
import { View, Text, Alert, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomPicker from '../../../components/CustomPicker'; 
import { StackScreenProps } from '@react-navigation/stack';
import { HomeStackParamList } from '../../../routes/home.stack.routes';
import { supabase } from '../../../lib/supabase';
import { theme } from '../../../styles/theme';
import Icon from 'react-native-vector-icons/Feather';

type Props = StackScreenProps<HomeStackParamList, 'EditRegistration'>;

type Tier = { id: number; name: string; };
type Package = { id: number; name: string; };
type Congregation = { id: number; name: string; };

export default function EditRegistrationScreen({ route, navigation }: Props) {
    const { registrationId } = route.params;

    const [participantName, setParticipantName] = useState('');
    const [selectedTierId, setSelectedTierId] = useState<number | undefined>();
    const [selectedPackageId, setSelectedPackageId] = useState<number | undefined>();
    const [selectedCongregationId, setSelectedCongregationId] = useState<number | undefined>();
    const [participantId, setParticipantId] = useState<number | null>(null);
    
    const [tiers, setTiers] = useState<Tier[]>([]);
    const [packages, setPackages] = useState<Package[]>([]);
    const [congregations, setCongregations] = useState<Congregation[]>([]);

    const [finalPrice, setFinalPrice] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function fetchInitialData() {
            try {
                const tiersPromise = supabase.from('participant_tiers').select('*');
                const packagesPromise = supabase.from('registration_packages').select('*');
                const congregationsPromise = supabase.from('congregations').select('*');
                
                const registrationPromise = supabase
                    .from('registrations')
                    .select('*, participants(name, id)')
                    .eq('id', registrationId)
                    .single();

                const [tiersResult, packagesResult, congregationsResult, registrationResult] = await Promise.all([tiersPromise, packagesPromise, congregationsPromise, registrationPromise]);
                
                if (tiersResult.data) setTiers(tiersResult.data);
                if (packagesResult.data) setPackages(packagesResult.data);
                if (congregationsResult.data) setCongregations(congregationsResult.data);

                if (registrationResult.data) {
                    const regData = registrationResult.data as any;
                    setParticipantName(regData.participants.name);
                    setParticipantId(regData.participants.id);
                    setSelectedCongregationId(regData.congregation_id);
                    setSelectedTierId(regData.participant_tier_id);
                    setSelectedPackageId(regData.registration_package_id);
                    setFinalPrice(regData.final_price);
                } else {
                    throw registrationResult.error;
                }
            } catch (error) {
                Alert.alert('Erro', 'Não foi possível carregar os dados da inscrição.');
                navigation.goBack();
            } finally {
                setLoading(false);
            }
        }
        fetchInitialData();
    }, [registrationId, navigation]);
    
    async function recalculatePrice(tierId?: number, packageId?: number) {
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

            const { data: priceData } = await supabase
                .from('camp_prices')
                .select('price')
                .eq('camp_id', regData.camp_id)
                .eq('participant_tier_id', tierId)
                .eq('registration_package_id', packageId)
                .single()

            if (priceData && priceData.price !== finalPrice) {
                Alert.alert(
                    "Alteração de Preço Detectada",
                    `O novo preço para esta combinação é R$ ${priceData.price.toFixed(2)}. Deseja atualizar o valor da inscrição?`,
                    [
                        { text: "Não", style: "cancel"},
                        { text: "Sim", onPress: () => setFinalPrice(priceData.price)}
                    ]
                );
            } else if (!priceData) {
                setFinalPrice(null);
            }
        }
    }

    async function handleUpdate() {
        if (!participantName || !selectedTierId || !selectedPackageId || !selectedCongregationId || finalPrice === null) {
            Alert.alert('Atenção', 'Todos os campos são obrigatórios e o preço final deve ser válido.');
            return;
        }
        setSaving(true);

        const [participantResult, registrationResult] = await Promise.all([
            supabase
                .from('participants')
                .update({
                    name: participantName
                })
                .eq('id', participantId),

            supabase
                .from('registrations')
                .update({
                    congregation_id: selectedCongregationId,
                    participant_tier_id: selectedTierId,
                    registration_package_id: selectedPackageId,
                    final_price: finalPrice,
                })
                .eq('id', registrationId)
        ]) 

        setSaving(false);

        const { error: participantError } = participantResult;
        const { error: registrationError } = registrationResult;

        if (participantError || registrationError) {
            console.error('Erro ao atualizar participante: ', participantError);
            console.error('Erro ao atualizar inscrição: ', registrationError);
        } else {
            Alert.alert('Sucesso!', 'Inscrição atualizada com sucesso.')
            navigation.goBack();
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
                            Editar Inscrição
                        </Text>
                    </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                    <Text style={styles.label}>Participante</Text>
                    <View style={styles.participantContainer}>
                        <TextInput style={styles.participantName} 
                            value={participantName}
                            onChangeText={setParticipantName}
                            
                        />
                    </View>

                    <Text style={styles.label}>Congregação</Text>
                    <CustomPicker
                        selectedValue={selectedCongregationId}
                        onValueChange={setSelectedCongregationId}
                        items={congregations.map(c => ({ label: c.name, value: c.id }))}
                        label="Selecione a congregação..."
                    />

                    <Text style={styles.label}>Nível de Participante</Text>
                    <CustomPicker
                        selectedValue={selectedTierId}
                        onValueChange={(value) => {
                            setSelectedTierId(value);
                            recalculatePrice(value, selectedPackageId);
                        }}
                        items={tiers.map(t => ({ label: t.name, value: t.id }))}
                        label="Selecione o nível..."
                    />

                    <Text style={styles.label}>Pacote de Inscrição</Text>
                    <CustomPicker
                        selectedValue={selectedPackageId}
                        onValueChange={(value) => {
                            setSelectedPackageId(value);
                            recalculatePrice(selectedTierId, value)
                        }}
                        items={packages.map(p => ({ label: p.name, value: p.id }))}
                        label="Selecione o pacote..."
                    />

                    {finalPrice !== null ? (
                        <View style={styles.priceContainer}>
                            <Text style={styles.priceLabel}>Valor Total da Inscrição:</Text>
                            <Text style={styles.priceValue}>R$ {finalPrice.toFixed(2).replace('.', ',')}</Text>
                        </View>
                    ) : (
                        <View style={[styles.priceContainer, { backgroundColor: '#fee2e2' }]}>
                             <Text style={[styles.priceLabel, { color: '#b91c1c' }]}>Combinação de plano inválida. Selecione outra.</Text>
                        </View>
                    )}

                    <TouchableOpacity 
                        style={[styles.buttonContainer, finalPrice === null && {backgroundColor: theme.colors.textSecondary}]} 
                        onPress={handleUpdate} 
                        disabled={saving || finalPrice === null}
                    >
                        {saving ? (
                            <ActivityIndicator color={theme.colors.textOnPrimary} />
                        ) : (
                            <Text style={styles.buttonText}>Salvar Alterações</Text>
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
    participantContainer: {
        ...theme.cardStyle,
        padding: 10,
    },
    participantName: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
    },
    priceContainer: {
        marginTop: theme.spacing.md,
        padding: theme.spacing.md,
        backgroundColor: '#e0f2fe',
        borderRadius: 12,
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