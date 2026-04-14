import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { PlusStackParamList } from '../../../routes/plus.stack.routes';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { theme } from '../../../styles/theme';

type Props = StackScreenProps<PlusStackParamList, 'Settings'>;

export default function SettingsScreen({ navigation }: Props) {

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <View style={styles.headerTitleContainer}>
                    <TouchableOpacity 
                        style={styles.backButton} 
                        onPress={() => navigation.goBack()}
                    >
                        <Icon name="chevron-left" size={30} color={theme.colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Configurações</Text>
                </View>
            </View>

            <ScrollView>
                <View style={styles.menuContainer}>
                    <TouchableOpacity 
                        style={styles.menuItem} 
                        onPress={() => navigation.navigate('ChangePassword')}
                    >
                        <Icon name="lock" size={22} color="#555" />
                        <Text style={styles.menuText}>Alterar Senha</Text>
                        <Icon name="chevron-right" size={22} color="#878175" />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.menuItem} 
                        onPress={() => {}}
                        disabled={true}
                    >
                        <Icon name="user" size={22} color="#ccc" />
                        <Text style={[styles.menuText, { color: '#ccc' }]}>Editar Perfil</Text>
                        <Icon name="chevron-right" size={22} color="#ccc" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={styles.menuItem} 
                        onPress={() => {}}
                        disabled={true}
                    >
                        <Icon name="sun" size={22} color="#ccc" />
                        <Text style={[styles.menuText, { color: '#ccc' }]}>Mudar Tema</Text>
                        <Icon name="chevron-right" size={22} color="#ccc" />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { 
        flex: 1, 
        backgroundColor: '#f6e9cf'
    },
    header: {
        width: '80%',
        alignSelf: 'center',
        marginVertical: theme.spacing.lg,
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        zIndex: 1, 
    },
    headerTitle: {
        ...theme.typography.header,
        position: 'absolute',
        left: 0,
        right: 0,
        textAlign: 'center',
        paddingHorizontal: 40, 
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
});