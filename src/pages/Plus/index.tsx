import React from 'react';
import { View, Text, Button, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { StackScreenProps } from '@react-navigation/stack';
import { PlusStackParamList } from '../../routes/plus.stack.routes';
import { SafeAreaView } from 'react-native-safe-area-context';

import Icon from 'react-native-vector-icons/Feather';

type Props = StackScreenProps<PlusStackParamList, 'PlusMenu'>;

type MenuItem = {
    title: string;
    icon: string;
    route: keyof PlusStackParamList;
}

export default function Plus({ navigation }: Props) {
    const { signOut, profile } = useAuth();

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
            title: 'Pacotes de Inscrição',
            icon: 'box',
            route: 'RegistrationPackagesList',
        },
        {
            title: 'Congregações',
            icon: 'home',
            route: 'CongregationsList',
        },
        {
            title: 'Níveis de Participante',
            icon: 'users',
            route: 'ParticipantTiersList',
        },
        {
            title: 'Tesoureiros',
            icon: 'dollar-sign',
            route: 'TreasurersList'
        },
        {
            title: 'Trilha de Auditoria de Pagamentos',
            icon: 'list',
            route: 'AuditTrail',
        },
    ];

    const handleNavigate = (routeName: keyof PlusStackParamList) => {
        navigation.navigate(routeName as any); 
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                <View style={styles.profileHeader}>
                    <Text style={styles.profileName}>{profile?.name || 'Administrador'}</Text>
                    <Text style={styles.profileEmail}>{profile?.email || ''}</Text>
                </View>
                
                <View style={styles.menuContainer}>
                    {menuItems.map((item) => (
                        <TouchableOpacity 
                            key={item.title}
                            style={styles.menuItem} 
                            onPress={() => handleNavigate(item.route)}
                        >
                            <Icon name={item.icon} size={22} color="#555" />
                            <Text style={styles.menuText}>{item.title}</Text>
                            <Icon name="chevron-right" size={22} color="#ccc" />
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.buttonContainer}>
                    <Button 
                        title="Sair (Logout)" 
                        onPress={signOut} 
                        color="#ff4757"
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    profileHeader: {
        backgroundColor: '#fff',
        padding: 24,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    profileName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
    },
    profileEmail: {
        fontSize: 16,
        color: 'gray',
        marginTop: 4,
    },
    menuContainer: {
        marginTop: 20,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#eee',
        marginBottom: -1,
    },
    menuText: {
        flex: 1,
        fontSize: 18,
        marginLeft: 20,
        color: '#333',
    },
    buttonContainer: {
        padding: 20,
        marginTop: 20,
    }
});