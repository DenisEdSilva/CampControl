import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import Plus from '../pages/Plus';

import CampsScreen from '../pages/Admin/Camps/CampsListScreen';
import CreateCampScreen from '../pages/Admin/Camps/CreateCampScreen';
import EditCampScreen from '../pages/Admin/Camps/EditCampScreen';
import CampDetailScreen from '../pages/Admin/Camps/CampDetailScreen';
import CreateEditCampPriceScreen from '../pages/Admin/Camps/CreateEditCampPriceScreen';
import ArchivedCampsScreen from '../pages/Admin/Camps/ArchivedCampsScreen';

import PaymentMethodsScreen from '../pages/Admin/PaymentMethods/PaymentMethodsScreen';
import CreatePaymentMethodScreen from '../pages/Admin/PaymentMethods/CreatePaymentMethodScreen';
import EditPaymentMethodScreen from '../pages/Admin/PaymentMethods/EditPaymentMethodScreen';

import RegistrationPackagesScreen from '../pages/Admin/RegistrationPackages/RegistrationPackagesScreen';
import CreateRegistrationPackageScreen from '../pages/Admin/RegistrationPackages/CreateRegistrationPackageScreen';
import EditRegistrationPackageScreen from '../pages/Admin/RegistrationPackages/EditRegistrationPackageScreen';

import CongregationsScreen from '../pages/Admin/Congregations/CongregationsListScreen';
import CreateCongregationScreen from '../pages/Admin/Congregations/CreateCongregationScreen';
import EditCongregationScreen from '../pages/Admin/Congregations/EditCongregationScreen';

import ParticipantTiersScreen from '../pages/Admin/ParticipantTiers/ParticipantTiersScreen';
import CreateParticipantTierScreen from '../pages/Admin/ParticipantTiers/CreateParticipantTierScreen';
import EditParticipantTierScreen from '../pages/Admin/ParticipantTiers/EditParticipantTierScreen';

import TreasurersListScreen from '../pages/Admin/Treasurers/TreasurersListScreen';
import CreateTreasurerScreen  from '../pages/Admin/Treasurers/CreateTreasurerScreen';
import EditTreasurerScreen from '../pages/Admin/Treasurers/EditTreasurerScreen';

import AuditTrailScreen from '../pages/Admin/AuditTrail/AuditTrailScreen'


export type PlusStackParamList = {
    PlusMenu: undefined;

    CampsList: undefined;
    CreateCampScreen: undefined;
    EditCampScreen: { campId: number };
    CampDetail: { campId: number, campName: string };
    CreateEditCampPriceScreen: { campId: number, priceId?: number };
    ArchivedCamps: undefined

    PaymentMethodsList: undefined;
    CreatePaymentMethodScreen: undefined;
    EditPaymentMethodScreen: { paymentMethodId: number};

    RegistrationPackagesList: undefined;
    CreateRegistrationPackageScreen: undefined;
    EditRegistrationPackageScreen: { packageId: number };

    CongregationsList: undefined;
    CreateCongregationScreen: undefined;
    EditCongregationScreen: { congregationId: number };

    ParticipantTiersList: undefined;
    CreateParticipantTierScreen: undefined;
    EditParticipantTierScreen: { tierId: number };

    TreasurersList: undefined;
    CreateTreasurerScreen: undefined;
    EditTreasurerScreen: { treasurerId: number };

    AuditTrail: undefined;

};

const Stack = createStackNavigator<PlusStackParamList>();

function PlusStackRoutes() {
    return (
        <Stack.Navigator>
            <Stack.Screen 
                name="PlusMenu"
                component={Plus}
                options={{ 
                    title: "Mais",
                    headerShown: false
                }} 
            />

            <Stack.Screen 
                name="CampsList"
                component={CampsScreen}
                options={{ 
                    title: "Acampamentos"
                }}
            />
            <Stack.Screen
                name="CreateCampScreen"
                component={CreateCampScreen}
                options={{
                    title: "Criar Acampamento",
                    presentation: 'modal'
                }}
            />
            <Stack.Screen
                name="EditCampScreen"
                component={EditCampScreen}
                options={{
                    title: "Editar Acampamento",
                    presentation: 'modal'
                }}
            />
            <Stack.Screen 
                name="CampDetail"
                component={CampDetailScreen}
            />
            <Stack.Screen 
                name="CreateEditCampPriceScreen"
                component={CreateEditCampPriceScreen}
                options={{ 
                    title: "Adicionar/Editar Preço", 
                    presentation: 'modal' 
                }}
            />
            <Stack.Screen 
                name="ArchivedCamps"
                component={ArchivedCampsScreen}
                options={{
                    title: "Lista de acampamentos arquivados",
                }}
            />

            <Stack.Screen 
                name="PaymentMethodsList"
                component={PaymentMethodsScreen}
                options={{ 
                    title: "Formas de Pagamento"
                }}
            />
            <Stack.Screen 
                name="CreatePaymentMethodScreen"
                component={CreatePaymentMethodScreen}
                options={{
                    title: "Criar Forma de Pagamento",
                    presentation: 'modal'
                }}
            />
            <Stack.Screen 
                name="EditPaymentMethodScreen"
                component={EditPaymentMethodScreen}
                options={{
                    title: "Editar Forma de Pagamento",
                    presentation: 'modal'
                }}
            />

            <Stack.Screen 
                name="RegistrationPackagesList"
                component={RegistrationPackagesScreen}
                options={{ 
                    title: "Pacotes de Inscrição"
                }}
            />
            <Stack.Screen
                name="CreateRegistrationPackageScreen"
                component={CreateRegistrationPackageScreen}
                options={{
                    title: "Criar Pacote de Inscrição",
                    presentation: 'modal'
                }}
            />
            <Stack.Screen
                name="EditRegistrationPackageScreen"
                component={EditRegistrationPackageScreen}
                options={{
                    title: "Editar Pacote de Inscrição",
                    presentation: 'modal'
                }}
            />

            <Stack.Screen 
                name="CongregationsList"
                component={CongregationsScreen}
                options={{ 
                    title: "Lista das congregações"
                }}
            />
            <Stack.Screen 
                name="CreateCongregationScreen"
                component={CreateCongregationScreen}
                options={{
                    title: "Criar Congregação",
                    presentation: 'modal'
                }}
            />
            <Stack.Screen 
                name="EditCongregationScreen"
                component={EditCongregationScreen}
                options={{
                    title: "Editar Congregação",
                    presentation: 'modal'
                }}
            />

            <Stack.Screen 
                name="ParticipantTiersList"
                component={ParticipantTiersScreen}
                options={{ 
                    title: "Níveis de Participante"
                }}
            />
            <Stack.Screen
                name="CreateParticipantTierScreen"
                component={CreateParticipantTierScreen}
                options={{
                    title: "Criar Nível de Participante",
                    presentation: 'modal'
                }}
            />
            <Stack.Screen
                name="EditParticipantTierScreen"
                component={EditParticipantTierScreen}
                options={{
                    title: "Editar Nível de Participante",
                    presentation: 'modal'
                }}
            />

            <Stack.Screen 
                name="TreasurersList"
                component={TreasurersListScreen}
                options={{ 
                    title: "Lista de Tesoureiros"
                }}
            />
            <Stack.Screen
                name="CreateTreasurerScreen"
                component={CreateTreasurerScreen}
                options={{
                    title: "Criar Novo Tesoureiro",
                    presentation: 'modal'
                }}
            />
            <Stack.Screen
                name="EditTreasurerScreen"
                component={EditTreasurerScreen}
                options={{
                    title: "Editar Tesoureiro",
                    presentation: 'modal'
                }}
            />

            <Stack.Screen 
                name="AuditTrail"
                component={AuditTrailScreen}
                options={{ 
                    title: "Trilha de Auditoria" 
                }}
            />

        </Stack.Navigator>
    )
}

export default PlusStackRoutes;