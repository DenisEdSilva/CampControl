import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import SignIn from '../pages/SignIn';
import SignUp from '../pages/SignUp';
import ResetPasswordScreen from '../pages/SignIn/ResetPasswordScreen';
import ForgotPasswordScreen from '../pages/SignIn/ForgotPasswordScreen';

export type AuthRoutesParamList = {
    SignIn: undefined;
    SignUp: undefined;
    ResetPasswordScreen: undefined;
    ForgotPasswordScreen: undefined;
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
            <Stack.Screen 
                name="ResetPasswordScreen"
                component={ResetPasswordScreen}
                options={{ 
                    title: 'Redefinir Senha',
                    headerShown: false 
                }}
            />
            <Stack.Screen 
                name="ForgotPasswordScreen"
                component={ForgotPasswordScreen}
                options={{ 
                    title: 'Esqueci minha senha',
                    headerShown: false 
                }}
            />
        </Stack.Navigator>
    )
}

export default AuthRoutes;