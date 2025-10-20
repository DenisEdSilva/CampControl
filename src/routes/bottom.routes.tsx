import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Feather';

import HomeStackRoutes from './home.stack.routes';
import PlusStackRoutes from './plus.stack.routes';
import RegistrationStackRoutes from './registration.stack.routes';

export type BottomTabParamList = {
    Home: undefined;
    Cadastrar: undefined;
    Mais: undefined;
};

const BottomTab = createBottomTabNavigator<BottomTabParamList>();

function BottomTabRoutes() {
    return (
        <BottomTab.Navigator>
            <BottomTab.Screen 
                name="Home"
                component={HomeStackRoutes}
                options={{ 
                    title: "Início",
                    headerShown: false,
                    tabBarIcon: ({ color, size }) => 
                        <Icon name="home" color={color} size={size} 
                    />
                }}
            />
            <BottomTab.Screen 
                name="Cadastrar"
                component={RegistrationStackRoutes}
                options={{ 
                    title: "Cadastrar",
                    headerShown: false,
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="user-plus" color={color} size={size} />
                    )
                }}
            />
            <BottomTab.Screen 
                name="Mais"
                component={PlusStackRoutes}
                options={{ 
                    title: "Mais",
                    headerShown: false,
                    tabBarIcon: ({ color, size }) => 
                        <Icon name="more-horizontal" color={color} size={size} 
                    />
                }}
            />
           
        </BottomTab.Navigator>
    )
}

export default BottomTabRoutes;