import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import Dashboard from '../pages/Dashboard';

type AppRoutesParamList = {
    Dashboard: undefined;
};

const Stack = createStackNavigator<AppRoutesParamList>();

function AppRoutes() {
    return (
        <Stack.Navigator>
            <Stack.Screen 
                name="Dashboard"
                component={Dashboard}
                options={{ headerShown: false }}
            />
        </Stack.Navigator>
    )
}

export default AppRoutes;