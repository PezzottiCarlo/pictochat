import React, { useEffect, useState } from 'react';
import { List, Avatar, Flex, Image } from 'antd';
import { SendOutlined, UserOutlined } from '@ant-design/icons';
import { Api } from 'telegram';
import BubbleMedia from './BubbleMedia';
import '../../styles/Bubble.css'
import { HairColor, Pictogram, SkinColor } from '../../lib/AAC';
import { Words } from '../../lib/Words';

interface ChatBubbleProps {
    message: Api.Message;
}

const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp * 1000); // Telegram date is in seconds
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
    const bubbleClass = message.out ? 'outgoing' : 'incoming';

    const [pictoSuggestions, setPictoSuggestions] = useState<Pictogram[] | null>(null);

    useEffect(() => {
        if (!message) return;
        if (message.message === null) return;
        let subject = Words.estraiSoggetto(message.message);
        if (subject) {
            setPictoSuggestions(subject);
        }
    }, [message]);

    return (

        <List.Item className={`bubble`}>
            <Flex align="center" justify={message.out ? "flex-end" : "flex-start"} style={{ width: '100%' }} >
                <div className={`bubble-content ${bubbleClass}`}>
                    <div className="message">{message.message}</div>
                    {message.media && <BubbleMedia media={message.media} />}
                    {(pictoSuggestions)
                        ?
                        <div className='bubble-picto'>
                            {pictoSuggestions.map((picto, index) => (
                                <Image
                                    key={index}
                                    src={picto.url}
                                    alt={`Pictogram ${index}`}
                                    width={70}
                                />
                            ))}
                        </div>
                        :
                        <></>
                    }
                    <div className="timestamp">{formatDate(message.date)}</div>
                </div>
            </Flex>
        </List.Item>
    );
};

export default ChatBubble;
