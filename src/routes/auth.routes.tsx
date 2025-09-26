import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import SignIn from '../pages/SignIn';
import SignUp from '../pages/SignUp';

export type AuthRoutesParamList = {
    SignIn: undefined;
    SignUp: undefined;
};

const Stack = createStackNavigator<AuthRoutesParamList>();

function AuthRoutes() {
    return (
        <Stack.Navigator initialRouteName='SignIn'>
            <Stack.Screen
                name="SignIn"
                component={SignIn}
                options={{ 
                    title: 'Faça o seu login',
                    headerShown: false 
                }}
            />

            <Stack.Screen 
                name="SignUp"
                component={SignUp}
                options={{ 
                    title: 'Crie a sua conta',
                    headerShown: false 
                }}
            />
        </Stack.Navigator>
    )
}

export default AuthRoutes;