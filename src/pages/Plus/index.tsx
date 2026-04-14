import React from 'react';
import { View, Text, Button, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { StackScreenProps } from '@react-navigation/stack';
import { PlusStackParamList } from '../../routes/plus.stack.routes';
import { SafeAreaView } from 'react-native-safe-area-context';
import Logo from '../../../assets/logo.svg';

import Icon from 'react-native-vector-icons/Feather';

type Props = StackScreenProps<PlusStackParamList, 'PlusMenu'>;

type MenuItem = {
    title: string;
    icon: string;
    route: keyof PlusStackParamList;
}

export default function Plus({ navigation }: Props) {
    const { signOut, profile } = useAuth();

    const LOGO_WIDTH = 250;
    const LOGO_ASPECT_RATIO = 1.48
    const LOGO_HEIGHT = LOGO_WIDTH / LOGO_ASPECT_RATIO;

    const menuItems: MenuItem[] = [
        {
            title: 'Acampamentos',
            icon: 'map-pin',
            route: 'CampsList',
        },
        {
            title: 'Formas de Pagamento',
            icon: 'credit-card',
            route: 'PaymentMethodsList',
        },
        {
            title: 'Congregações',
            icon: 'home',
            route: 'CongregationsList',
        },
        {
            title: 'Tipos de Inscrição',
            icon: 'users',
            route: 'ParticipantTiersList',
        },
        {
            title: 'Pacotes de Inscrição',
            icon: 'box',
            route: 'RegistrationPackagesList',
        },
        {
            title: 'Tesoureiros',
            icon: 'dollar-sign',
            route: 'TreasurersList'
        },
        {
            title: 'Auditoria de Pagamentos',
            icon: 'list',
            route: 'AuditTrail',
        },
        {
            title: 'Configurações',
            icon: 'settings',
            route: 'Settings',
        },
    ];

    const handleNavigate = (routeName: keyof PlusStackParamList) => {
        navigation.navigate(routeName as any); 
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.profileHeader}>
                <Text style={styles.profileName}>{profile?.name || 'Administrador'}</Text>
                <Text style={styles.profileEmail}>{profile?.email || ''}</Text>
                <Logo 
                    width={LOGO_WIDTH}
                    height={LOGO_HEIGHT}
                    color='#878175'
                />
            </View>
                
            <ScrollView>
                <View style={styles.menuContainer}>
                    {menuItems.map((item) => (
                        <TouchableOpacity 
                            key={item.title}
                            style={styles.menuItem} 
                            onPress={() => handleNavigate(item.route)}
                        >
                            <Icon name={item.icon} size={22} color="#555" />
                            <Text style={styles.menuText}>{item.title}</Text>
                            <Icon name="chevron-right" size={22} color="#878175" />
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity style={styles.buttonContainer} onPress={signOut}>
                    <Text style={styles.buttonText}>Sair</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f6e9cf',
    },
    profileHeader: {
        backgroundColor: '#f6e9cf',
        padding: 24,
        alignItems: 'center'
    },
    profileName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#878175',
    },
    profileEmail: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#878175',
        marginTop: 4,
        marginBottom: 4
    },
    menuContainer: {
        marginTop: 0,
    },
    menuItem: {
        width: '80%',
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f6e9cf',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderColor: '#878175',
    },
    menuText: {
        flex: 1,
        fontSize: 18,
        marginLeft: 20,
        color: '#333'
    },
    buttonContainer: {
        alignSelf: 'center',
        width: '80%',
        borderRadius: 10,
        backgroundColor: '#878175',
        padding: 8,
        marginTop: 25,
        alignItems: 'center',
        marginBottom: 25
    },
    buttonText: {
        fontSize: 18,
        color: '#f6e9cf'

    }
});