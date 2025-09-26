import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

import AuthRoutes from './auth.routes';
import AppRoutes from './app.routes';

function Routes() {
    const { session, loading } = useAuth();

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        )
    }

    return session ? <AppRoutes /> : <AuthRoutes />;
}

export default Routes;