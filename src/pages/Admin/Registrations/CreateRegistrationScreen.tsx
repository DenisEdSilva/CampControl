import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    Button,
    Alert,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    Switch,
    FlatList,
    TouchableOpacity
} from 'react-native';
import CustomPicker from '../../../components/CustomPicker';
import { StackScreenProps } from '@react-navigation/stack';
import { HomeStackParamList } from '../../../routes/home.stack.routes';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { useDebounce } from 'use-debounce';
import { logPaymentActivity } from '../../utils/logs';

type Participant = { id: number; name: string; };
type Tier = { id: number; name: string; };
type Package = { id: number; name: string; };
type Congregation = { id: number; name: string; };
type PaymentMethod = { id: number; name: string; };
type Treasurer = { id: number; name: string; };

type Props = StackScreenProps<HomeStackParamList, 'CreateRegistration'>;

export default function CreateRegistrationScreen({ route, navigation }: Props) {
    const { campId } = route.params;
    const { session } = useAuth();

    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery] = useDebounce(searchQuery, 300);
    const [searchResults, setSearchResults] = useState<Participant[]>([]);
    const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);

    const [participantName, setParticipantName] = useState('');
    const [selectedTierId, setSelectedTierId] = useState<number | undefined>();
    const [selectedPackageId, setSelectedPackageId] = useState<number | undefined>();
    const [selectedCongregationId, setSelectedCongregationId] = useState<number | undefined>();

    const [tiers, setTiers] = useState<Tier[]>([]);
    const [packages, setPackages] = useState<Package[]>([]);
    const [congregations, setCongregations] = useState<Congregation[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

    const [addInitialPayment, setAddInitialPayment] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [initialPaymentDate, setInitialPaymentDate] = useState('');
    const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<number | undefined>();

    const [finalPrice, setFinalPrice] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [treasurers, setTreasurers] = useState<Treasurer[]>([]);
    const [selectedTreasurerId, setSelectedTreasurerId] = useState<number | undefined>();

    useEffect(() => {
        async function fetchPickerData() {
            const tiersPromise = supabase.from('participant_tiers').select('*');
            const packagesPromise = supabase.from('registration_packages').select('*');
            const congregationsPromise = supabase.from('congregations').select('*');
            const paymentMethodsPromise = supabase.from('payment_methods').select('*');
            const treasurersPromise = supabase.from('treasurers').select('*');

            const [tiersResult, packagesResult, congregationsResult, paymentMethodsResult, treasurersResult] = await Promise.all([
                tiersPromise,
                packagesPromise,
                congregationsPromise,
                paymentMethodsPromise,
                treasurersPromise
            ]);

            if (tiersResult.data) setTiers(tiersResult.data);
            if (packagesResult.data) setPackages(packagesResult.data);
            if (congregationsResult.data) setCongregations(congregationsResult.data);
            if (paymentMethodsResult.data) setPaymentMethods(paymentMethodsResult.data);
            if (treasurersResult.data) setTreasurers(treasurersResult.data)

            setLoading(false);
        }
        fetchPickerData();
    }, []);

    useEffect(() => {
        if (selectedTierId && selectedPackageId) {
            async function fetchCampPrice() {
                const { data } = await supabase
                    .from('camp_prices')
                    .select('price')
                    .eq('camp_id', campId)
                    .eq('participant_tier_id', selectedTierId)
                    .eq('registration_package_id', selectedPackageId)
                    .single();
                if (data) setFinalPrice(data.price);
                else setFinalPrice(null);
            }
            fetchCampPrice();
        } else {
            setFinalPrice(null);
        }
    }, [selectedTierId, selectedPackageId, campId]);

    useEffect(() => {
        if (debouncedSearchQuery.trim().length > 2 && !selectedParticipant) {
            async function searchParticipants() {
                const { data } = await supabase
                    .from('participants')
                    .select('id, name')
                    .ilike('name', `%${debouncedSearchQuery.trim()}%`)
                    .limit(5);
                if (data) setSearchResults(data);
            }
            searchParticipants();
        } else {
            setSearchResults([]);
        }
    }, [debouncedSearchQuery, selectedParticipant]);

    const handleSelectParticipant = (participant: Participant) => {
        setSelectedParticipant(participant);
        setParticipantName(participant.name);
        setSearchQuery('');
        setSearchResults([]);
    };

    const clearSelection = () => {
        setSelectedParticipant(null);
        setParticipantName('');
    };

    async function handleSave() {
        if (
            !participantName ||
            !selectedTierId ||
            !selectedPackageId ||
            !selectedCongregationId ||
            finalPrice === null
        ) {
            Alert.alert('Atenção', 'Nome, Congregação, Nível e Pacote são obrigatórios.');
            return;
        }

        if (addInitialPayment && (!paymentAmount || !selectedPaymentMethodId || !selectedTreasurerId || !initialPaymentDate)) {
            Alert.alert('Atenção', 'Preencha todos os dados do pagamento inicial ou desative a opção.');
            return;
        }

        setSaving(true);

        let participantIdToUse: number;

        if (selectedParticipant) {
            participantIdToUse = selectedParticipant.id;
        } else {
            const { data: newParticipantData, error: participantError } = await supabase
                .from('participants')
                .insert([{ name: participantName.trim() }])
                .select('id')
                .single();
            if (participantError || !newParticipantData) {
                setSaving(false);
                Alert.alert('Erro', 'Falha ao criar o novo participante.');
                return;
            }
            participantIdToUse = newParticipantData.id;
        }

        const { data: registrationData, error: registrationError } = await supabase
            .from('registrations')
            .insert([{
                participant_id: participantIdToUse,
                camp_id: campId,
                congregation_id: selectedCongregationId,
                participant_tier_id: selectedTierId,
                registration_package_id: selectedPackageId,
                final_price: finalPrice,
                status: 'Em andamento',
                registrant_id: session?.user.id,
            }])
            .select('id')
            .single();
        if (registrationError || !registrationData) {
            setSaving(false);
            Alert.alert('Erro', 'Participante definido, mas a inscrição falhou.');
            return;
        }

        if (addInitialPayment) {
            const newRegistrationId = registrationData.id
            const { data: paymentData, error: paymentError } = await supabase
                .from('payments')
                .insert([{
                    registration_id: newRegistrationId,
                    payment_method_id: selectedPaymentMethodId,
                    payed_value: parseFloat(paymentAmount.replace(',', '.')),
                    payment_date: initialPaymentDate,
                    treasurer_id: selectedTreasurerId,
                    created_by_user_id: session?.user.id
                }])
                .select()
                .single();

            if (paymentError) {
                setSaving(false);
                Alert.alert('Aviso', 'Inscrição criada, mas houve um erro ao registrar o pagamento.');
                console.error('Erro no passo 3:', paymentError);
                navigation.goBack();
                return;
            } else {
                const details = `Pagamento inicial de R$ ${parseFloat(paymentAmount.replace(',', '.')).toFixed(2)} criado.`
                logPaymentActivity(
                    session?.user.id ?? '',
                    newRegistrationId,
                    paymentData.id,
                    'CREATE',
                    details
                );
            }
        }

        setSaving(false);
        Alert.alert('Sucesso!', 'Inscrição realizada com sucesso.');
        navigation.goBack();
    }

    if (loading) {
        return <ActivityIndicator size="large" style={styles.loader} />;
    }

    return (
        <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
            <Text style={styles.sectionTitle}>Dados do Participante</Text>

            {selectedParticipant ? (
                <View style={styles.selectedContainer}>
                    <Text style={styles.selectedLabel}>Inscrevendo participante existente:</Text>
                    <Text style={styles.selectedName}>{selectedParticipant.name}</Text>
                    <Button title="Trocar / Cadastrar Novo" onPress={clearSelection} color="#888" />
                </View>
            ) : (
                <>
                    <TextInput
                        style={styles.input}
                        placeholder="Buscar por nome ou digitar novo..."
                        value={participantName}
                        onChangeText={text => {
                            setParticipantName(text);
                            setSearchQuery(text);
                        }}
                    />
                    {searchResults.length > 0 && (
                        <FlatList
                            data={searchResults}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.searchResultItem} onPress={() => handleSelectParticipant(item)}>
                                    <Text>{item.name}</Text>
                                </TouchableOpacity>
                            )}
                            style={styles.searchResultsContainer}
                        />
                    )}
                </>
            )}

            {(participantName.length > 0) && (
                <>
                    <Text style={styles.sectionTitle}>Dados da Inscrição</Text>
                    <CustomPicker
                        label="Congregação *"
                        selectedValue={selectedCongregationId}
                        onValueChange={setSelectedCongregationId}
                        items={congregations.map(c => ({ label: c.name, value: c.id }))}
                    />
                    <CustomPicker
                        label="Nível de Participante *"
                        selectedValue={selectedTierId}
                        onValueChange={setSelectedTierId}
                        items={tiers.map(t => ({ label: t.name, value: t.id }))}
                    />
                    <CustomPicker
                        label="Pacote de Inscrição *"
                        selectedValue={selectedPackageId}
                        onValueChange={setSelectedPackageId}
                        items={packages.map(p => ({ label: p.name, value: p.id }))}
                    />

                    {finalPrice !== null && (
                        <View style={styles.priceContainer}>
                            <Text style={styles.priceLabel}>Valor Total da Inscrição:</Text>
                            <Text style={styles.priceValue}>R$ {finalPrice.toFixed(2).replace('.', ',')}</Text>
                        </View>
                    )}

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Pagamento Inicial</Text>
                        <View style={styles.switchContainer}>
                            <Text style={styles.switchLabel}>Adicionar primeiro pagamento agora?</Text>
                            <Switch value={addInitialPayment} onValueChange={setAddInitialPayment} />
                        </View>
                        {addInitialPayment && (
                            <View style={styles.paymentSection}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Valor Pago (ex: 150,00) *"
                                    value={paymentAmount}
                                    onChangeText={setPaymentAmount}
                                    keyboardType="numeric"
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Data do Pagamento (DD/MM/AAAA) *"
                                    value={initialPaymentDate}
                                    onChangeText={setInitialPaymentDate}
                                    keyboardType="default"
                                />
                                <CustomPicker
                                    label="Forma de Pagamento *"
                                    selectedValue={selectedPaymentMethodId}
                                    onValueChange={setSelectedPaymentMethodId}
                                    items={paymentMethods.map(pm => ({ label: pm.name, value: pm.id }))}
                                />
                                <CustomPicker 
                                    label="Recebido por (Tesoureiro)"
                                    selectedValue={selectedTreasurerId}
                                    onValueChange={setSelectedTreasurerId}
                                    items={treasurers.map(t => ({ label: t.name, value: t.id }))}
                                />
                            </View>
                        )}
                    </View>

                    <View style={styles.saveButtonContainer}>
                        <Button
                            title={saving ? "Salvando..." : "Salvar Inscrição"}
                            onPress={handleSave}
                            disabled={saving || loading || finalPrice === null}
                        />
                    </View>
                </>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
        backgroundColor: '#fff'
    },
    loader: {
        flex: 1,
        justifyContent: 'center'
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 24,
        marginBottom: 15,
        borderTopColor: '#eee',
        borderTopWidth: 1,
        paddingTop: 24
    },
    input: {
        height: 50,
        backgroundColor: '#f5f5f5',
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 12,
        fontSize: 16
    },
    priceContainer: {
        marginTop: 10,
        padding: 15,
        backgroundColor: '#e0f2fe',
        borderRadius: 8,
        alignItems: 'center'
    },
    priceLabel: { fontSize: 16, color: '#0284c7' },
    priceValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#0369a1',
        marginTop: 4
    },
    section: {},
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 15,
        backgroundColor: '#f5f5f5',
        borderRadius: 8
    },
    switchLabel: { 
        fontSize: 16, 
        color: '#333' 
    },
    paymentSection: { 
        marginTop: 20 
    },
    saveButtonContainer: { 
        marginTop: 20, 
        marginBottom: 50 
    },
    selectedContainer: {
        padding: 15,
        backgroundColor: '#eef2ff',
        borderRadius: 8,
        marginBottom: 12
    },
    selectedLabel: { fontSize: 14, color: '#4338ca' },
    selectedName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginVertical: 5,
        color: '#312e81'
    },
    searchResultsContainer: {
        maxHeight: 150,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        backgroundColor: '#fff',
        marginBottom: 12,
        elevation: 3
    },
    searchResultItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
});