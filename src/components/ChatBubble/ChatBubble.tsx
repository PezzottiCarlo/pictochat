import React, { useEffect, useState } from 'react';
import { List, Flex, Image } from 'antd';
import { Api } from 'telegram';
import BubbleMedia from './ChatBubbleMedia';
import '../../styles/Bubble.css';
import { Pictogram } from '../../lib/AAC';
import { WordsService } from '../../lib/WordsService';
import { PictogramImage } from '../Other/PictogramImage';

interface ChatBubbleProps {
    message: Api.Message;
    name?: Promise<string | undefined>;
}

const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp * 1000); // Telegram date is in seconds
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, name }) => {
    const bubbleClass = message.out ? 'outgoing' : 'incoming';
    const [pictoSuggestions, setPictoSuggestions] = useState<Pictogram[] | null>(null);
    const [iName, setIName] = useState<string | undefined>(undefined);

    //when name is resolved, update the component
    useEffect(() => {
        name?.then((name) => {
            if (name) {
                setIName(name);
            }
        });
    }, [name]);

    useEffect(() => {
        if (!message) return;
        if (message.message === null) return;
        WordsService.extractSubjects(message.message).then((soggetto) => {
            setPictoSuggestions(soggetto);
        });
    }, [message]);

    return (
        <List.Item className={`bubble`} onClick={() => WordsService.textToSpeech(message.message)}>
            <Flex align="center" justify={message.out ? "flex-end" : "flex-start"} style={{ width: '100%' }}>
                <div className={`bubble-content ${bubbleClass}`}>
                    {name && <div className="name">{iName}</div>}
                    <div className="message">{message.message}</div>
                    {message.media && <BubbleMedia media={message.media} />}
                    {pictoSuggestions && (
                        <div className="bubble-picto">
                            {pictoSuggestions.map((picto, index) => (
                                <PictogramImage
                                    key={index}
                                    picto={picto}
                                    width={70}
                                    height={70} />
                            ))}
                        </div>
                    )}
                    <div className="timestamp">{formatDate(message.date)}</div>
                </div>
            </Flex>
        </List.Item>
    );
};

export default ChatBubble;
