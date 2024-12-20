import React, { useEffect, useState } from 'react';
import { List, Flex } from 'antd';
import { Api } from 'telegram';
import BubbleMedia from './ChatBubbleMedia';
import '../../styles/Bubble.css';
import { Pictogram } from '../../lib/AAC';
import { PictogramImage } from '../Other/PictogramImage';
import { Controller, PictogramContext } from '../../lib/Controller';

interface ChatBubbleProps {
    message: Api.Message;
    name?: Promise<string | undefined>;
    chatWith: bigInt.BigInteger;
}

const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, name,chatWith}) => {
    const bubbleClass = message.out ? 'outgoing' : 'incoming';
    const [pictoSuggestions, setPictoSuggestions] = useState<Pictogram[] | null>(null);
    const [iName, setIName] = useState<string | undefined>(undefined);

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

        let me = Controller.getMe();
        let context ={
            me: (message.out) ? me.id : chatWith,
            you: (message.out) ? chatWith : me.id,
        } as PictogramContext;

        setPictoSuggestions(Controller.extractPictograms(message.message, context));
    }, [message]);

    return (
        <List.Item className={`bubble`} onClick={() => Controller.textToSpeech(message.message)}>
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
