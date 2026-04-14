import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import Dashboard from '../pages/Dashboard';
import RegistrationDetailScreen from '../pages/Admin/Registrations/RegistrationDetailScreen'
import CreateRegistrationScreen from '../pages/Admin/Registrations/CreateRegistrationScreen';
import EditRegistrationScreen from '../pages/Admin/Registrations/EditRegistrationScreen'
import AddPaymentScreen from '../pages/Admin/Registrations/AddPaymentScreen';
import EditPaymentScreen from '../pages/Admin/Registrations/EditPaymentScreen';
import ErrorBoundary from '../components/ErrorBoundary';

export type HomeStackParamList = {
    Dashboard: undefined;
    RegistrationDetail: { registrationId: number };
    CreateRegistration: { campId: number };
    EditRegistration: { registrationId: number }
    AddPayment: { registrationId: number }
    EditPayment: { paymentId: number, registrationId: number }
};

const Stack = createStackNavigator<HomeStackParamList>();

function HomeStackRoutes() {
    return (
        <Stack.Navigator>
            <Stack.Screen 
                name="Dashboard"
                component={Dashboard}
                options={{ 
                    title: "Home",
                    headerShown: false
                }} 
            />
            
            <Stack.Screen
                name="CreateRegistration"
                component={CreateRegistrationScreen}
                options={{ 
                    title: "Nova Inscrição",
                    headerShown: false 
                }}
            />

            <Stack.Screen 
                name="RegistrationDetail"
                options={{ 
                    title: "Detalhes da Inscrição",
                    headerShown: false 
                }}
            >
                {(props) => (
                    <ErrorBoundary>
                        <RegistrationDetailScreen {...props} />
                    </ErrorBoundary>
                )}
            </Stack.Screen>

            <Stack.Screen
                name="EditRegistration"
                component={EditRegistrationScreen}
                options={{
                    title: 'Edição da inscrição',
                    presentation: 'modal',
                    headerShown: false
                }}
            />

            <Stack.Screen
                name="AddPayment"
                component={AddPaymentScreen}
                options={{ 
                    title: "Adicionar Pagamento",
                    presentation: 'modal',
                    headerShown: false 
                }}
            />
            <Stack.Screen
                name="EditPayment"
                component={EditPaymentScreen}
                options={{ 
                    title: "Editar Pagamento",
                    presentation: 'modal',
                    headerShown: false 
                }}
            />

        </Stack.Navigator>
    )
}

export default HomeStackRoutes;