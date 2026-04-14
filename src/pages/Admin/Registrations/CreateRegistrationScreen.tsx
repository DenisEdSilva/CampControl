import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Alert, StyleSheet, ActivityIndicator, ScrollView, Switch, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomPicker from '../../../components/CustomPicker';
import { StackScreenProps } from '@react-navigation/stack';
import { HomeStackParamList } from '../../../routes/home.stack.routes';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { useDebounce } from 'use-debounce';
import { logPaymentActivity } from '../../utils/logs';
import { checkPaymentExceeds } from '@/services/payments';
import { theme } from '../../../styles/theme';
import Icon from 'react-native-vector-icons/Feather';

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

    function normalizeName(name: string) {
        return name.trim().toLowerCase().replace(/\s+/g, ' ');
    }

    function formatName(name: string) {
        return name.toLowerCase().trim().replace(/\s+/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    useEffect(() => {
        async function fetchPickerData() {
            const tiersPromise = supabase.from('participant_tiers').select('*');
            const packagesPromise = supabase.from('registration_packages').select('*');
            const congregationsPromise = supabase.from('congregations').select('*');
            const paymentMethodsPromise = supabase.from('payment_methods').select('*');
            const treasurersPromise = supabase.from('treasurers').select('*');

            const [tiersResult, packagesResult, congregationsResult, paymentMethodsResult, treasurersResult] = await Promise.all([
                tiersPromise, packagesPromise, congregationsPromise, paymentMethodsPromise, treasurersPromise
            ]);

            if (tiersResult.data) setTiers(tiersResult.data);
            if (packagesResult.data) setPackages(packagesResult.data);
            if (congregationsResult.data) setCongregations(congregationsResult.data);
            if (paymentMethodsResult.data) setPaymentMethods(paymentMethodsResult.data);
            if (treasurersResult.data) setTreasurers(treasurersResult.data);

            setLoading(false);
        }
        fetchPickerData();
    }, []);

    useEffect(() => {
        if (selectedTierId && selectedPackageId) {
            async function fetchCampPrice() {
                const { data } = await supabase.from('camp_prices').select('price').eq('camp_id', campId).eq('participant_tier_id', selectedTierId).eq('registration_package_id', selectedPackageId).single();
                setFinalPrice(data ? data.price : null);
            }
            fetchCampPrice();
        } else {
            setFinalPrice(null);
        }
    }, [selectedTierId, selectedPackageId, campId]);

    useEffect(() => {
        if (debouncedSearchQuery.trim().length > 2 && !selectedParticipant) {
            async function searchParticipants() {
                const normalized = normalizeName(debouncedSearchQuery);
                const { data } = await supabase.from('participants').select('id, name').ilike('name_normalized', `%${normalized}%`).limit(5);
                setSearchResults(data || []);
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
        setSearchQuery(''); 
    };

    const handleDateChange = (text: string) => {
        const cleaned = text.replace(/[^0-9]/g, '');
        let formatted = cleaned;
        if (cleaned.length > 2) formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
        if (cleaned.length > 4) formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
        setInitialPaymentDate(formatted);
    };

    async function handleSave() {
        if (!participantName || !selectedTierId || !selectedPackageId || !selectedCongregationId || finalPrice === null) {
            Alert.alert('Atenção', 'Nome, Congregação, Nível e Pacote são obrigatórios.'); 
            setSaving(false);
            return;
        }
        if (addInitialPayment && (!paymentAmount || !selectedPaymentMethodId || !selectedTreasurerId || !initialPaymentDate)) {
            Alert.alert('Atenção', 'Preencha todos os dados do pagamento inicial ou desative a opção.'); 
            setSaving(false);
            return;
        }

        setSaving(true);
        let participantIdToUse: number;

        if (selectedParticipant) {
            participantIdToUse = selectedParticipant.id;
        } else {
            const formattedName = formatName(participantName);
            const normalizedName = normalizeName(participantName);
            
            const { data: existingParticipant } = await supabase.from('participants').select('id, name').eq('name_normalized', normalizedName).maybeSingle();
            if (existingParticipant) {
                Alert.alert('Participante Já Existe', `Um participante com o nome "${formattedName}" já está cadastrado. Deseja selecioná-lo?`, [
                    { text: 'Não, Cancelar', style: 'cancel', onPress: () => setSaving(false) },
                    { text: 'Sim, Selecionar', onPress: () => { handleSelectParticipant(existingParticipant); setSaving(false); }},
                ]); return;
            }
            const { data: newParticipantData, error: participantError } = await supabase.from('participants').insert([{ 
                name: formattedName,
                name_normalized: normalizedName, 
            }]).select('id').single();

            if (participantError) {
                if (participantError.code === '23505') {
                    const { data: existing } = await supabase.from('participants').select('id, name').eq('name_normalized', normalizedName).single();
                    if (existing) {
                        handleSelectParticipant(existing);
                    }
                    setSaving(false);
                    return;
                } else {
                    setSaving(false);
                    Alert.alert('Erro', 'Falha ao criar o novo participante.');
                    return;
                }
            }

            if (!newParticipantData) {
                setSaving(false);
                Alert.alert('Erro', 'Falha ao criar o novo participante.');
                return;
            }

            participantIdToUse = newParticipantData.id;
        }

        const { data: registrationData, error: registrationError } = await supabase.from('registrations').insert([{
            participant_id: participantIdToUse, 
            camp_id: campId, 
            congregation_id: selectedCongregationId, 
            participant_tier_id: selectedTierId, 
            registration_package_id: selectedPackageId, 
            final_price: finalPrice, 
            status: 'Em andamento', 
            registrant_id: session?.user.id,
        }]).select('id').single();

        if (registrationError) {
            if (registrationError.code === '23505') {
                setSaving(false);
                Alert.alert('Participante já inscrito neste acampamento.');
                return;
            } else {
                setSaving(false);
                Alert.alert('Erro', 'Participante definido, mas a inscrição falhou.');
                return;
            }
        }

        if (!registrationData) {
            setSaving(false);
            Alert.alert('Erro', 'Participante definido, mas a inscrição falhou.');
            return;
        }

        if (addInitialPayment) {
            const newRegistrationId = registrationData.id;

            const dateParts = initialPaymentDate.split('/');
            if (dateParts.length !== 3 || dateParts[2].length !== 4) {
                Alert.alert('Data Inválida', 'Use DD/MM/AAAA.');
                setSaving(false);
                return;
            }

            const formattedDateForDB = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
            const numericAmount = parseFloat(paymentAmount.replace(',', '.'));

            const insertPayment = async () => {
                const { data: paymentData, error: paymentError } = await supabase.from('payments').insert([{
                    registration_id: newRegistrationId,
                    payment_method_id: selectedPaymentMethodId,
                    payed_value: numericAmount,
                    payment_date: formattedDateForDB,
                    treasurer_id: selectedTreasurerId,
                    created_by_user_id: session?.user.id
                }]).select().single();

                Alert.alert('Sucesso!', 'Inscrição realizada com sucesso.', [
                    {
                        text: 'OK', 
                        onPress: () => {
                            setSaving(false);
                            navigation.goBack();
                        }
                    }
                ]);

                if (paymentError) {
                    Alert.alert('Aviso', 'Inscrição criada, mas erro ao registrar pagamento.');
                    console.error(paymentError);
                    navigation.goBack();
                    return;
                } else {
                    const details = `Pagamento inicial de R$ ${numericAmount.toFixed(2)} criado.`;
                    logPaymentActivity(session?.user.id ?? '', newRegistrationId, paymentData.id, 'CREATE', details);
                }
            };

            const check = await checkPaymentExceeds(supabase, newRegistrationId, numericAmount);

            if (check.exceeds) {
                Alert.alert(
                    'Valor acima do esperado',
                    `Total ficará em R$ ${check.total.toFixed(2)}, acima de R$ ${check.expected.toFixed(2)}.`,
                    [
                        { text: 'Cancelar', style: 'cancel', onPress: () => setSaving(false) },
                        { text: 'Continuar', onPress: insertPayment }
                    ]
                );
                return;
            }

            await insertPayment();
        }
    }
    
    if (loading) {
        return ( <SafeAreaView style={styles.loadingContainer}><ActivityIndicator size="large" color={theme.colors.textPrimary} /></SafeAreaView> );
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
                            Nova Inscrição
                        </Text>
                    </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
                    <Text style={styles.label}>Dados do Participante</Text>

                    {selectedParticipant ? (
                        <View style={styles.selectedContainer}>
                            <Icon name="user" size={20} color={theme.colors.textOnPrimary} style={{ marginRight: theme.spacing.sm }}/>
                            <Text style={styles.selectedName}>{selectedParticipant.name}</Text>
                            <TouchableOpacity style={styles.changeButtonTouchable} onPress={clearSelection}>
                                 <Icon name="x" size={18} color={theme.colors.textOnPrimary}/>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View>
                            <TextInput
                                style={styles.input}
                                placeholder="Buscar ou criar participante..."
                                placeholderTextColor={theme.colors.textSecondary}
                                value={participantName}
                                onChangeText={text => {
                                    setParticipantName(text);
                                    setSearchQuery(text);
                                }}
                            />
                            {searchResults.length > 0 && (
                                <View style={styles.searchResultsContainer}>
                                    <FlatList
                                        data={searchResults}
                                        keyExtractor={(item) => item.id.toString()}
                                        renderItem={({ item }) => (
                                            <TouchableOpacity style={styles.searchResultItem} onPress={() => handleSelectParticipant(item)}>
                                                <Icon name="user-check" size={18} color={theme.colors.textSecondary} style={{ marginRight: theme.spacing.sm }}/>
                                                <Text style={styles.searchResultText}>{item.name}</Text>
                                            </TouchableOpacity>
                                        )}
                                        scrollEnabled={false}
                                    />
                                </View>
                            )}
                        </View>
                    )}

                    {(participantName.length > 0) && (
                        <>
                            <Text style={styles.label}>Dados da Inscrição</Text>
                            <CustomPicker selectedValue={selectedCongregationId} onValueChange={setSelectedCongregationId} items={congregations.map(c => ({ label: c.name, value: c.id }))} label="Selecione a congregação..."/>
                            <CustomPicker selectedValue={selectedTierId} onValueChange={setSelectedTierId} items={tiers.map(t => ({ label: t.name, value: t.id }))} label="Selecione o nível..."/>
                            <CustomPicker selectedValue={selectedPackageId} onValueChange={setSelectedPackageId} items={packages.map(p => ({ label: p.name, value: p.id }))} label="Selecione o pacote..."/>

                            {finalPrice !== null && ( <View style={styles.priceContainer}><Text style={styles.priceLabel}>Valor Total:</Text><Text style={styles.priceValue}>R$ {finalPrice.toFixed(2).replace('.', ',')}</Text></View> )}
                            
                            <View style={styles.section}>
                                <View style={styles.switchContainer}>
                                    <Text style={styles.labelSwitch}>Adicionar Pagamento Inicial?</Text>
                                    <Switch value={addInitialPayment} onValueChange={setAddInitialPayment} trackColor={{ false: theme.colors.textSecondary, true: theme.colors.textPrimary }} thumbColor={theme.colors.card}/>
                                </View>
                                {addInitialPayment && (
                                    <View style={styles.paymentSection}>
                                        <Text style={styles.label}>Valor Pago (R$)</Text>
                                        <TextInput style={styles.input} placeholder="Ex: 150,00" placeholderTextColor={theme.colors.textSecondary} value={paymentAmount} onChangeText={setPaymentAmount} keyboardType="numeric"/>
                                        <Text style={styles.label}>Data do Pagamento</Text>
                                        <TextInput style={styles.input} placeholder="DD/MM/AAAA" placeholderTextColor={theme.colors.textSecondary} value={initialPaymentDate} onChangeText={handleDateChange} keyboardType="numeric" maxLength={10}/>
                                        <Text style={styles.label}>Forma de Pagamento</Text>
                                        <CustomPicker selectedValue={selectedPaymentMethodId} onValueChange={setSelectedPaymentMethodId} items={paymentMethods.map(pm => ({ label: pm.name, value: pm.id }))} label="Selecione a forma..."/>
                                        <Text style={styles.label}>Recebido por (Tesoureiro)</Text>
                                        <CustomPicker selectedValue={selectedTreasurerId} onValueChange={setSelectedTreasurerId} items={treasurers.map(t => ({ label: t.name, value: t.id }))} label="Selecione o tesoureiro..."/>
                                    </View>
                                )}
                            </View>

                            <TouchableOpacity style={styles.buttonContainer} onPress={handleSave} disabled={saving || loading || finalPrice === null}>
                                {saving ? (<ActivityIndicator color={theme.colors.textOnPrimary} />) : (<Text style={styles.buttonText}>Salvar Inscrição</Text>)}
                            </TouchableOpacity>
                        </>
                     )}
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
        marginTop: theme.spacing.lg, 
        marginBottom: theme.spacing.md,
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
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
    scrollContent: {
       paddingBottom: 40,
    },
    label: {
        ...theme.typography.body,
        fontWeight: 'bold',
        marginBottom: theme.spacing.sm,
        marginTop: theme.spacing.md,
        color: theme.colors.textPrimary,
    },
    labelSwitch: {
        ...theme.typography.body,
        fontWeight: 'bold',
        color: theme.colors.textPrimary,
        flex: 1, 
        marginRight: theme.spacing.sm,
    },
    input: {
        ...theme.cardStyle,
        paddingHorizontal: theme.spacing.md,
        height: 50,
        fontSize: 16,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.sm, 
    },
    priceContainer: {
        marginTop: theme.spacing.md,
        padding: theme.spacing.md,
        backgroundColor: '#e0f2fe', 
        borderRadius: 12,
        alignItems: 'center'
    },
    priceLabel: { 
        fontSize: 16, 
        color: '#0284c7' 
    },
    priceValue: { 
        fontSize: 22, 
        fontWeight: 'bold', 
        color: '#0369a1', 
        marginTop: 4 
    },
    section: { 
        marginTop: theme.spacing.lg, 
    },
    switchContainer: {
        ...theme.cardStyle,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: theme.spacing.sm, 
        paddingHorizontal: theme.spacing.md,
    },
    paymentSection: { 
        marginTop: theme.spacing.sm, 
    },
    buttonContainer: {
        backgroundColor: theme.colors.textPrimary,
        borderRadius: 10,
        padding: 14,
        alignItems: 'center',
        width: '100%',
        marginVertical: theme.spacing.lg, 
    },
    buttonText: { 
        color: theme.colors.textOnPrimary, 
        fontSize: 18, 
        fontWeight: 'bold', 
    },    
    selectedContainer: {
        ...theme.cardStyle,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.md,
        marginBottom: theme.spacing.sm,
        borderColor: theme.colors.textPrimary, 
        borderWidth: 1.5,
        backgroundColor: '#a19a8e', 
    },
    selectedName: {
        ...theme.typography.body,
        fontWeight: 'bold',
        fontSize: 16,
        flex: 1,
        color: theme.colors.textOnPrimary,
    },
    changeButtonTouchable: {
        padding: 6, 
        marginLeft: theme.spacing.sm,
    },
    searchResultsContainer: { 
        maxHeight: 180,
        ...theme.cardStyle, 
        elevation: 4, 
        marginTop: -theme.spacing.sm, 
        marginBottom: theme.spacing.md,
        borderColor: theme.colors.background,
        borderWidth: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },
    searchResultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.background, 
    },
    searchResultText: {
        ...theme.typography.body,
        fontSize: 16,
        color: theme.colors.textPrimary,
    },
});