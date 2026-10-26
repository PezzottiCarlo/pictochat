import React, { useEffect, useState } from 'react';
import { List, Flex, Typography, Space, Card, Avatar } from 'antd';
import { Api } from 'telegram';
import BubbleMedia from './ChatBubbleMedia';
import { Pictogram } from '../../lib/AAC';
import { PictogramImage } from '../Other/PictogramImage';
import { Controller, PictogramContext } from '../../lib/Controller';

const { Text } = Typography;

interface ChatBubbleProps {
    message: Api.Message;
    name?: Promise<string | undefined>;
    chatWith: bigInt.BigInteger;
}

const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, name, chatWith }) => {
    const isOutgoing = (message as any).out;
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
        if (!message.message) return;

        let me = Controller.getMe();
        let context = {
            me: message.out ? me.id : chatWith,
            you: message.out ? chatWith : me.id,
        } as PictogramContext;

        setPictoSuggestions(Controller.extractPictograms(message.message, context));
    }, [message, chatWith]);

    return (
        <List.Item
            style={{ 
                border: 'none', 
                padding: '4px 12px',
                marginBottom: 0
            }}
        >
            <Flex
                align="flex-end"
                justify={isOutgoing ? 'flex-end' : 'flex-start'}
                style={{ width: '100%' }}
            >
                <Card
                    size="small"
                    onClick={() => Controller.textToSpeech(message.message)}
                    style={{
                        maxWidth: '75%',
                        cursor: 'pointer',
                        backgroundColor: isOutgoing 
                            ? 'var(--bubble-outgoing-bg, #007AFF)' 
                            : 'var(--bubble-incoming-bg, #E9E9EB)',
                        color: isOutgoing 
                            ? 'var(--bubble-outgoing-text, white)' 
                            : 'var(--bubble-incoming-text, black)',
                        borderRadius: 18,
                        borderBottomRightRadius: isOutgoing ? 4 : 18,
                        borderBottomLeftRadius: isOutgoing ? 18 : 4,
                        border: 'none',
                    }}
                    bodyStyle={{ 
                        padding: '10px 14px',
                    }}
                >
                    <Space direction="vertical" size={6} style={{ width: '100%' }}>
                        {/* Name */}
                        {name && iName && (
                            <Text
                                strong
                                style={{
                                    fontSize: 15,
                                    opacity: 0.9,
                                    color: 'inherit',
                                    display: 'block'
                                }}
                            >
                                {iName}
                            </Text>
                        )}

                        {/* Message text */}
                        {message.message && (
                            <Text
                                style={{
                                    fontSize: 17,
                                    lineHeight: 1.4,
                                    whiteSpace: 'pre-wrap',
                                    wordWrap: 'break-word',
                                    color: 'inherit',
                                    display: 'block'
                                }}
                            >
                                {message.message}
                            </Text>
                        )}

                        {/* Media */}
                        {message.media && <BubbleMedia message={message} />}

                        {/* Pictograms */}
                        {pictoSuggestions && pictoSuggestions.length > 0 && (
                            <Flex 
                                gap={8} 
                                wrap="nowrap"
                                style={{ 
                                    marginTop: 4,
                                    overflowX: 'auto',
                                    overflowY: 'hidden',
                                    width: '100%',
                                }}
                            >
                                {pictoSuggestions.map((picto, index) => (
                                    <div style={{ flexShrink: 0 }}>
                                        <PictogramImage
                                            key={index}
                                            picto={picto}
                                            width={60}
                                            height={60}
                                        />
                                    </div>
                                ))}
                            </Flex>
                        )}

                        {/* Timestamp */}
                        <Text
                            type="secondary"
                            style={{
                                fontSize: 12,
                                opacity: 0.7,
                                textAlign: 'right',
                                display: 'block',
                                color: 'inherit'
                            }}
                        >
                            {formatDate((message as any).date || Math.floor(Date.now() / 1000))}
                        </Text>
                    </Space>
                </Card>
            </Flex>
        </List.Item>
    );
};

export default React.memo(ChatBubble);