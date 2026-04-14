import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, Animated } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Feather';

import HomeStackRoutes from './home.stack.routes';
import PlusStackRoutes from './plus.stack.routes';
import RegistrationStackRoutes from './registration.stack.routes';
import { theme } from '../styles/theme';

export type BottomTabParamList = {
    Home: undefined;
    Cadastrar: undefined;
    Mais: undefined;
};

const BottomTab = createBottomTabNavigator<BottomTabParamList>();

function CustomTabBar({ state, descriptors, navigation }) {
    const { width } = useWindowDimensions();
    const TAB_WIDTH = width / state.routes.length;

    const slideAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(slideAnim, {
            toValue: state.index * TAB_WIDTH,
            useNativeDriver: true,
            bounciness: 5,
        }).start();
    }, [state.index, TAB_WIDTH, slideAnim]);

    return (
        <View style={styles.tabBar}>
            <Animated.View
                style={[
                    styles.activeIndicator, 
                    { 
                        width: TAB_WIDTH,
                        transform: [{ translateX: slideAnim }]
                    }
                ]}
            />
            {state.routes.map((route, index) => {
                const { options } = descriptors[route.key];
                const label = options.title !== undefined ? options.title : route.name;
                const isFocused = state.index === index;

                const onPress = () => {
                    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name);
                    }
                };

                const iconName = route.name === 'Home' ? 'home' : route.name === 'Cadastrar' ? 'user-plus' : 'more-horizontal';

                return (
                    <TouchableOpacity
                        key={route.key}
                        accessibilityRole="button"
                        accessibilityState={isFocused ? { selected: true } : {}}
                        onPress={onPress}
                        style={styles.tabItemContainer}
                    >
                        <Icon 
                            name={iconName} 
                            size={24} 
                            color={isFocused ? theme.colors.textPrimary : theme.colors.textSecondary} 
                        />
                        <Text style={[styles.tabLabel, { color: isFocused ? theme.colors.textPrimary : theme.colors.textSecondary }]}>
                            {label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

function BottomTabRoutes() {
    return (
        <BottomTab.Navigator
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{ headerShown: false }}
        >
            <BottomTab.Screen name="Home" component={HomeStackRoutes} options={{ title: "Início" }} />
            <BottomTab.Screen name="Cadastrar" component={RegistrationStackRoutes} options={{ title: "Cadastrar" }} />
            <BottomTab.Screen name="Mais" component={PlusStackRoutes} options={{ title: "Mais" }} />
        </BottomTab.Navigator>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        flexDirection: 'row',
        backgroundColor: theme.colors.card,
        borderTopWidth: 1,
        borderTopColor: theme.colors.background,
        height: 80,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    tabItemContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeIndicator: {
        position: 'absolute',
        top: 0,
        height: 3,
        backgroundColor: theme.colors.textPrimary,
        borderBottomLeftRadius: 3,
        borderBottomRightRadius: 3,
    },
    tabLabel: {
        fontSize: 12,
        marginTop: 4,
        fontWeight: '600',
    }
});

export default BottomTabRoutes;