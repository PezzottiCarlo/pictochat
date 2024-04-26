import React, { MutableRefObject, useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Button, Image, TouchableHighlight, StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { RouteProp } from '@react-navigation/native';
import { ScrollView } from 'react-native-gesture-handler';
import { TelegramAPI } from '../lib/TgAPI';
import { HairColor, Message, SkinColor } from '../model/Types';
import { Avatar } from '@rneui/themed';
import { charToColor, confrontaFraseConLista, estraiSoggetto } from '../lib/Utils';
import { AAC } from '../lib/AAC';
import storage from '../lib/storage';
import { message } from 'telegram/client';
import { BlurView } from 'expo-blur';
import * as Speech from 'expo-speech';
import ModalSelector from 'react-native-modal-selector'


import { IconFill, IconOutline } from "@ant-design/icons-react-native";

import { SafeAreaView } from 'react-native-safe-area-context';
import { PlayCircleFilled } from '@ant-design/icons';
import BubbleMessage from './message/BubbleMessage';


type ChatScreenProps = {
    navigation: StackNavigationProp<RootStackParamList, 'Chat'>;
    route: RouteProp<RootStackParamList, 'Chat'>;
};

const ChatScreen: React.FC<ChatScreenProps> = ({ navigation, route }) => {
    const aac = new AAC("it");
    const { friend, me } = route.params;
    const [messages, setMessages] = useState<Message[]>([]);
    const [messageText, setMessageText] = useState('');
    const [scrollRef, setScrollRef] = useState(null as any)
    const [hints, setHints] = useState<{ name: string, url: string }[]>([]);
    const [images, setImages] = useState({} as any);
    const [newMessage, setNewMessage] = useState(true);
    const [userStatus, setUserStatus] = useState('' as string);

    const [timeoutRef, setTimeoutRef] = useState(null as any);
    const modalRef = useRef<ModalSelector>();

    const commonSentences = [
        { key: 0, label: 'Ciao! Sto bene, grazie!  🙂' },
        { key: 1, label: 'Come ti chiami?  🍨' },
        { key: 2, label: 'Quanti anni hai? 📸' },
        { key: 3, label: 'Dove abiti?  🏡' },
    ];

    function saveMessages(msgs: Message[]) {
        storage.save({
            key: 'messages',
            data: {
                [friend.entity.phone ? friend.entity.phone : friend.entity.username]: msgs
            }
        })
    }

    function refreshMessages() {
        TelegramAPI.getMessagesLimited(friend.entity.phone ? friend.entity.phone : friend.entity.username, 20).then((msgs) => {
            setMessages(msgs);
            setNewMessage(false);
            msgs.forEach((msg) => {
                if (!images[msg.id] && !msg.from_id) {
                    subjectToImage(msg);
                }
            });
            setTimeoutRef(setTimeout(() => {
                refreshMessages();
            }, 5000));
        });
    }


    useEffect(() => {
        refreshMessages();
        //getDialogStatus();

        navigation.setOptions({
            headerTransparent: true,
            headerBackTitleVisible: false,
            headerBackground: () => (
                <BlurView intensity={100} style={StyleSheet.absoluteFill} />
            ),

            headerLeftContainerStyle: { marginBottom: 20 },

            headerTitle: () => (
                <View style={{ flexDirection: 'column', alignItems: 'center' }}>
                    <Text style={{ color: '#000', fontSize: 20 }}>{friend.entity.first_name} {friend.entity.last_name}</Text>
                    <Text style={{ color: '#444', fontSize: 15 }}>{userStatus}</Text>
                </View>
            ),

            headerRight: () => (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginRight: 10 }}>
                    {friend.image ? (
                        <Image source={{ uri: "data:image/gif;base64," + friend.image }} style={{ height: 60, width: 60, borderRadius: 50 }} />
                    ) : (
                        <Avatar
                            size={60}
                            title={(friend.entity.first_name) ? (friend.entity.first_name)[0] : ":("}
                            rounded
                            titleStyle={{ fontSize: 20 }}
                            containerStyle={{ backgroundColor: charToColor((friend.entity.first_name) ? (friend.entity.first_name)[0] : ":(") }}
                        />
                    )}
                </View>
            )
        });
    }, [userStatus]);


    async function subjectToImage(message: Message) {
        let estratto = estraiSoggetto(message.message) as string;
        if (estratto === null) return;
        let tmp = (await aac.getImageFromId((await aac.searchKeyword(estratto, true))[0]._id, true, SkinColor.WHITE, HairColor.RED)).url;
        let tmpImages = images;
        tmpImages[message.id] = tmp;
        setImages(tmpImages);
    }

    const fetchHints = async () => {
        if (messages.length !== 0) {
            if (messages.length > 0 && !messages[messages.length - 1].from_id) {
                const sentence = confrontaFraseConLista(messages[messages.length - 1].message);
                const result: { name: string, url: string }[] = [];
                for (let i = 0; i < sentence.length; i++) {
                    const res = await aac.searchKeyword(sentence[i], true);
                    if (res.length > 0) {
                        const url = (await aac.getImageFromId(res[0]._id, true, SkinColor.WHITE, HairColor.RED)).url;
                        result.push({ name: sentence[i], url: url as string });
                    }
                }
                const dunno = (await aac.getImageFromId(7180, true, SkinColor.WHITE, HairColor.RED)).url;
                result.unshift({ name: 'Non so', url: dunno as string });
                setHints(result);
                if (scrollRef) {
                    setTimeout(() => {
                        scrollRef.scrollToEnd({ animated: true });
                    }, 0);
                }
            } else {
                setHints([]);
            }
        }
    }

    useEffect(() => {
        fetchHints();
        if (scrollRef && newMessage) {
            setTimeout(() => {
                scrollRef.scrollToEnd({ animated: true });
            }, 0);
        }
    }, [messages]);

    const sendMessage = (message: string) => {
        TelegramAPI.sendMessage(friend.entity.phone ? friend.entity.phone : friend.entity.username, message).then((msg) => {
            refreshMessages();
        });
    };

    const handleSendHint = async (imageLink: string, caption: string) => {



        TelegramAPI.sendImage(friend.entity.phone ? friend.entity.phone : friend.entity.username, imageLink, caption).then((msg) => {
            refreshMessages();
        });
    }


    const renderHintOrCommon = (hint: boolean) => {
        if (hint) {
            return (
                <ScrollView
                    style={{ padding: 5 }}
                    contentContainerStyle={{ flexDirection: 'row' }}
                    horizontal={true}>
                    {hints.map((text, index) => (
                        <TouchableHighlight
                            key={index}
                            style={{ margin: 5, padding: 1, borderColor: "#007bff", borderWidth: 3, borderRadius: 10 }}
                            onPress={() => {
                                handleSendHint(text.url, text.name);
                                setMessageText('');
                                setHints([]);
                                handleListenMessage(text.name);
                            }}
                        >
                            <Image source={{ uri: text.url }} style={{ width: 80, height: 80 }} />
                        </TouchableHighlight>
                    ))}
                </ScrollView>
            )
        } else {
            return (
                <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 5 }}>
                    <TouchableHighlight
                        style={{ padding: 5, borderRadius: 50, backgroundColor: '#007bff' }}
                        onPress={() => {
                            modalRef.current?.open();
                        }}>
                        <IconOutline name="bulb" size={40} color="#fff" />
                    </TouchableHighlight>
                </View>
            )
        }
    }

    const handleListenMessage = async (message: Message | string) => {
        Speech.speak((typeof message === 'string') ? message : message.message, {
            language: 'it-IT',
            pitch: 1,
            rate: 1,
        })
    }

    const getDialogStatus = async () => {
        const res = await TelegramAPI.getDialog(friend.entity.phone ? friend.entity.phone : friend.entity.username);
        console.log('getDialogStatus');
        console.log(res.status["_"]);

        if (res.status["_"] === 'UserStatusOnline') {
            setUserStatus('online');
        } else {
            const date = new Date(res.status.was_online);
            const hours = date.getHours();
            const minutes = "0" + date.getMinutes();
            const seconds = "0" + date.getSeconds();
            const formattedTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
            setUserStatus('last seen ' + formattedTime);
        }

        setTimeout(getDialogStatus, 1000);
    }

    return (
        <SafeAreaView style={{ position: "relative", flex: 1 }}>
            <ModalSelector
                data={commonSentences}
                initValue="Frasi"
                ref={modalRef as MutableRefObject<ModalSelector<{ key: any; label: string; }> | null>}
                onChange={(option: { key: any, label: string }) => {
                    sendMessage(option.label);
                }}

                optionTextStyle={{ fontSize: 25 }}
                cancelTextStyle={{ fontSize: 25 }}

                cancelText='Annulla'
            />

            <View style={{ flex: 1, padding: 10, marginTop: -70 }}>
                <ScrollView ref={setScrollRef} style={{ flex: 1 }}>
                    {messages.map((msg, index) => (
                        <BubbleMessage
                            key={index}
                            msg={msg}
                            index={index}
                            handleListenMessage={handleListenMessage}
                            images={images}
                            bubbleStyle={{ marginVertical: 5 }}
                        />
                    ))}
                </ScrollView>
                <View style={{ flexDirection: 'column' }}>
                    {renderHintOrCommon((hints.length > 0))}

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                        <TextInput
                            style={{ flex: 1, height: 40, borderWidth: 1, borderColor: '#ccc', paddingHorizontal: 10, borderRadius: 20, fontSize: 20 }}
                            value={messageText}
                            onChangeText={setMessageText}
                            placeholder="Scrivi un messaggio..."
                        />
                        <TouchableHighlight
                            style={{ marginLeft: 10, justifyContent: "flex-end", alignItems: "center" }}
                            onPress={() => {
                                sendMessage(messageText);
                                setMessageText('');
                            }}>
                            <IconOutline name="send" size={40} color="#007bff" />
                        </TouchableHighlight>
                    </View>
                </View>
            </View>
        </SafeAreaView>
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
        width: 80,
        height: 80,
        borderRadius: 50,
        resizeMode: 'cover', // ridimensiona l'immagine per coprire l'intera area rotonda
    }
});

export default ChatScreen;
