import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

import AuthRoutes from './auth.routes';
import BottomTabRoutes from './bottom.routes';

function Routes() {
    const { session, loading } = useAuth();

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        )
    }

    return session ? <BottomTabRoutes /> : <AuthRoutes />;
}

export default Routes;

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});