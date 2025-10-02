import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import SelectCampScreen from '../pages/Admin/Registrations/SelectCampScreen';
import CreateRegistrationScreen from '../pages/Admin/Registrations/CreateRegistrationScreen';

export type RegistrationStackParamList = {
    SelectCamp: undefined;
    CreateRegistration: { campId: number, campName: string };
}

const Stack = createStackNavigator<RegistrationStackParamList>();

function RegistrationStackRoutes() {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="SelectCamp"
                component={SelectCampScreen}
                options={{ 
                    title: "Selecione o Acampamento",
                }}
            />
            <Stack.Screen
                name="CreateRegistration"
                component={CreateRegistrationScreen}
                options={{ 
                    title: "Nova Inscrição",
                }}
            />
        </Stack.Navigator>
    )
}

export default RegistrationStackRoutes;