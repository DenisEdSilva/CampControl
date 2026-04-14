import React from 'react';
import { View, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../../assets/logo.svg';
import AuthRoutes from './auth.routes';
import BottomTabRoutes from './bottom.routes';

function Routes() {
    const { session, loading } = useAuth();

    const LOGO_WIDTH = 280;
    const LOGO_ASPECT_RATIO = 1.48;
    const LOGO_HEIGHT = LOGO_WIDTH / LOGO_ASPECT_RATIO;

    if (loading) {
        return (
            <View style={styles.centered}>
                <Logo 
                    width={LOGO_WIDTH}
                    height={LOGO_HEIGHT}
                    color="#878175"
                />
                <ActivityIndicator size={80} color="#878175" style={{marginTop: 16}} />
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
        backgroundColor: '#f6e9cf'
    },
});