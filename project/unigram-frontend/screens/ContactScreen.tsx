import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { RouteProp } from '@react-navigation/native';
import { AAC } from '../lib/AAC';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Dialog, Friend, User } from '../model/Types';
import { Avatar } from '@rneui/themed';
import { charToColor, dateToShortDate, displayMessage } from '../lib/Utils';
import { TelegramAPI } from '../lib/TgAPI';
import storage from '../lib/storage';

type ContactListScreenProps = {
    navigation: StackNavigationProp<RootStackParamList, 'ContactList'>;
    route: RouteProp<RootStackParamList, 'ContactList'>; // Aggiungi RouteProp per accedere ai parametri della rotta
};

const ContactListScreen: React.FC<ContactListScreenProps> = ({ navigation, route }) => {

    const [contacts, setContacts] = useState<Dialog[]>(route.params.contacts);
    const [me, setMe] = useState<User>();
    const aac = new AAC('it');

    useEffect(() => {
        TelegramAPI.getMe().then((data) => {
            setMe(data);
        })

        navigation.setOptions({
            title: "Contatti",
            headerRight: () => (
                <TouchableOpacity onPress={() => {
                    storage.remove({
                        key: 'token'
                    }).then(() => {
                        navigation.navigate('Index');
                    });

                    //restart app
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'Index' }],
                    });
                }}>
                    <Text style={{ color: 'blue', marginRight: 10 }}>Logout</Text>
                </TouchableOpacity>
            ),
            headerLeft: () => (null)
        });
    }, []);

    return (
        <View>
            <ScrollView>
                {contacts && contacts.length > 0 && contacts.map((contact, index) => (
                    <TouchableOpacity key={index} onPress={() => navigation.navigate('Chat', { friend: contact, me: me as User })}>

                        <View key={index} style={{ flexDirection: 'row', alignItems: "center", padding: 10 }}>
                            <View style={styles.avatarContainer}>
                                {contact.image ? (
                                    <Image source={{ uri: "data:image/gif;base64," + contact.image }} style={styles.avatar} />
                                ) : (
                                    <Avatar
                                        size={100}
                                        title={(contact.entity.first_name)?(contact.entity.first_name)[0]:":("}
                                        rounded
                                        titleStyle={{ fontSize: 40 }}
                                        containerStyle={{ backgroundColor: charToColor((contact.entity.first_name)?(contact.entity.first_name)[0]:":(") }}
                                    />
                                )}
                            </View>
                            <View style={{ alignItems: "flex-start", marginLeft: 30 }}>
                                <Text style={{ fontSize: 23 }}>{contact.entity.first_name} {contact.entity.last_name}</Text>
                                <Text style={{ fontSize: 23 }}>{displayMessage(contact.message, me as User)}</Text>
                            </View>

                        </View>

                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50, // rende l'immagine rotonda
        overflow: 'hidden', // assicura che l'immagine rotonda non esca dai bordi
        marginVertical: 10,
    },
    avatar: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover', // ridimensiona l'immagine per coprire l'intera area rotonda
    },
});

export default ContactListScreen;
