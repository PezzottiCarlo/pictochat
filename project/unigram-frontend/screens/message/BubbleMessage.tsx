import React from 'react';
import { View, Text, TouchableHighlight, Image, StyleProp, ViewStyle } from 'react-native';
import { IconOutline } from '@ant-design/icons-react-native';
import { Message } from '../../model/Types';
import { dateToString } from '../../lib/Utils';


interface Props {
    msg: Message;
    index: number;
    handleListenMessage: (msg: Message | string) => void;
    images: { [key: string]: string };
    bubbleStyle?: StyleProp<ViewStyle>;
}

const BubbleMessage: React.FC<Props> = ({ msg, index, handleListenMessage, images, bubbleStyle }) => {
    return (
        <TouchableHighlight
            onPress={() => handleListenMessage(msg)}
            underlayColor='transparent'
            onLongPress={
                () => handleListenMessage("mi piace il pesce")
            }
        >
            <View key={index} style={[{ alignSelf: !msg.from_id ? 'flex-start' : 'flex-end', marginVertical: 5 }, bubbleStyle]}>
                <View style={{ padding: msg.media_extra ? 6 : 10, backgroundColor: !msg.from_id ? '#eee' : '#007bff', borderRadius: 10 }}>
                    {msg.media_extra && (
                        <View>
                            <Image source={{ uri: `data:image/gif;base64,${msg.media_extra}` }} style={{ width: 355, height: 355, borderRadius: 10 }} />
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Text style={{ color: !msg.from_id ? '#000' : '#fff', fontSize: 25 }}>{msg.message}</Text>
                                <TouchableHighlight onPress={() => handleListenMessage(msg)} style={{ marginLeft: 10 }}>
                                    <IconOutline name="sound" size={30} color={!msg.from_id ? '#000' : '#fff'} />
                                </TouchableHighlight>
                            </View>
                        </View>
                    )}
                    {!msg.media_extra && (
                        <View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Text style={{ color: !msg.from_id ? '#000' : '#fff', fontSize: 25 }}>{msg.message}</Text>
                                <TouchableHighlight onPress={() => handleListenMessage(msg)} style={{ marginLeft: 10 }}>
                                    <IconOutline name="sound" size={30} color={!msg.from_id ? '#000' : '#fff'} />
                                </TouchableHighlight>
                            </View>
                        </View>
                    )}
                    {images[msg.id] && (
                        <View style={{ alignItems: 'center' }}>
                            <Image source={{ uri: images[msg.id] }} style={{ width: 200, height: 200, borderRadius: 10 }} />
                        </View>
                    )}
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ color: !msg.from_id ? '#000' : '#fff' }}>{dateToString(new Date(msg.date))}</Text>
                    </View>
                </View>
            </View>
        </TouchableHighlight>
    );
};

export default BubbleMessage;
