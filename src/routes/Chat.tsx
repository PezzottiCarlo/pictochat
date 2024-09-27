import React, { useEffect, useState, useRef, useCallback, useLayoutEffect } from 'react';
import { Layout, Input, Button, List, Skeleton, Popover } from 'antd';
import { BulbFilled, SendOutlined, TranslationOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import bigInt from 'big-integer';
import { motion } from 'framer-motion';
import InfiniteScroll from 'react-infinite-scroll-component';
import ChatBubble from '../components/ChatBubble/Bubble';
import ChatHeader from '../components/Chat/ChatHeader';
import ChatHints from '../components/Chat/ChatHintsText';
import ChatHintsPicto from '../components/Chat/ChatHintsPicto';
import { Api } from 'telegram';
import { Pictogram, HairColor, SkinColor } from '../lib/AAC';
import hints from '../data/hints.json';
import "../styles/Chat.css";
import { Controller } from '../lib/Controller';
import Icon from '@ant-design/pro-chat/es/Icon';

const { Content, Footer } = Layout;

interface ChatProps {
    chatId: bigInt.BigInteger;
}

export const ChatWrapper: React.FC = () => {
    const { chatId } = useParams<{ chatId: string }>();
    return chatId ? <Chat chatId={bigInt(chatId)} /> : null;
};

export const Chat: React.FC<ChatProps> = ({ chatId }) => {
    const [messages, setMessages] = useState<Api.Message[]>([]);
    const [inputValue, setInputValue] = useState<string>('');
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [loading, setLoading] = useState<boolean>(true);
    const [showHints, setShowHints] = useState<boolean>(false);
    const [pictoHints, setPictoHints] = useState<Map<number, Pictogram>>(new Map());
    const [isFirstLoad, setIsFirstLoad] = useState<boolean>(true);
    const [lastScrollHeight, setLastScrollHeight] = useState<number>(0);

    const contentRef = useRef<HTMLDivElement>(null);
    const messageBatchSize = 20;



    const fetchPictogramsHints = useCallback(async (messages: Api.Message[]) => {
        const lastMessage = messages[messages.length - 1];
        if (!lastMessage) return;

        const pictograms = Words.pictoExtractor(lastMessage.message);
        if (pictograms.length === 0) return;

        const pictoHints = new Map<number, Pictogram>();
        for (const picto of pictograms) {
            const pictoData = (await Controller.aac.searchKeyword(picto, false))[0];
            const p = await Controller.aac.getImageFromId(pictoData._id, true, SkinColor.WHITE, HairColor.RED);
            pictoHints.set(pictoData._id, p);
        }
        setPictoHints(pictoHints);
    }, []);

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const fetchedMessages = await Controller.tgApi.getMessages(chatId, { limit: messageBatchSize });
                setMessages(fetchedMessages.reverse());
                setLoading(false);
                scrollToBottom();
                fetchPictogramsHints(fetchedMessages);
            } catch (error) {
                console.error('Failed to fetch messages:', error);
                setLoading(false);
            }
        };
        fetchMessages();
        setInterval(fetchMessages,5000);
    }, [chatId, fetchPictogramsHints]);

    useLayoutEffect(() => {
        if (isFirstLoad) {
            setIsFirstLoad(false);
            scrollToBottom();
            setLastScrollHeight(contentRef.current?.scrollHeight || 0);
        }
    }, [messages]);

    const fetchMoreMessages = useCallback(async () => {
        if (!messages.length) return;
        const lastMessageId = messages[0]?.id;
        try {
            const moreMessages = await Controller.tgApi.getMessages(chatId, { limit: messageBatchSize, max_id: lastMessageId });
            if (moreMessages.length === 0) {
                setHasMore(false);
                return;
            }
            setMessages(prevMessages => [...moreMessages.reverse(), ...prevMessages]);
            scrollToBottom();
        } catch (error) {
            console.error('Failed to fetch more messages:', error);
        }
    }, [messages, chatId]);

    const handleSend = async () => {
        if (!inputValue) return;

        try {
            await Controller.tgApi.sendMessage(chatId, inputValue);
            setInputValue('');
            const newMessages = await Controller.tgApi.getMessages(chatId, { limit: messageBatchSize });
            setMessages(newMessages.reverse());
            scrollToBottom();
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    const handleHints = async (text: string) => {
        try {
            await Controller.tgApi.sendMessage(chatId, text);
            setInputValue('');
            setShowHints(false);
        } catch (error) {
            console.error('Failed to send hint message:', error);
        }
    };

    const handleCustomMessage = (subjects: Pictogram[], verbs: Pictogram[], objects: Pictogram[]) => {
        const subjectText = subjects.map(subject => subject.word).join(' e ');  // Unisce i soggetti con una virgola
        const verbText = verbs.map(verb => verb.word).join(' ');              // Unisce i verbi con una virgola
        const objectText = objects.map(object => object.word).join(', ');      // Unisce gli oggetti con una virgola

        // Crea la frase completa
        const message = `${subjectText} ${verbText} ${objectText}.`;
        setInputValue(message);
        console.log("aweqwe")
    };

    const handleHintsPicto = (picto: Pictogram) => {
        const message = `${picto.word}`;
        setInputValue(message);
        handleSend();
    }

    const scrollToBottom = () => {
        setTimeout(() => {
            if (contentRef.current) {
                contentRef.current.scrollTop = contentRef.current.scrollHeight;
            }
        }, 0);
    };

    return (
        <Layout style={{ height: '100vh' }}>
            <ChatHeader id={chatId} />
            <Content id="scrollableDiv" style={{ padding: '1rem', overflowY: 'scroll' }} ref={contentRef}>
                <InfiniteScroll
                    dataLength={messages.length}
                    next={fetchMoreMessages}
                    hasMore={hasMore}
                    inverse={true}
                    loader={<Skeleton avatar paragraph={{ rows: 0 }} active />}
                    scrollableTarget="scrollableDiv"
                    style={{ display: 'flex', flexDirection: 'column-reverse' }}
                    onScroll={() => {
                        if (contentRef.current) {
                            const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
                            if (scrollTop === 0 && hasMore) {
                                fetchMoreMessages();
                            }
                        }
                    }}>
                    <List
                        itemLayout="horizontal"
                        dataSource={messages}
                        renderItem={item => <ChatBubble message={item} />}
                        className='chat-list'
                    />
                </InfiniteScroll>
            </Content>


            <Footer style={{ padding: '10px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', marginBottom: '1rem', height: '5rem' }}>
                    {pictoHints.size === 0 ? (
                        <Popover
                            open={showHints}
                            content={<ChatHints onHintClick={handleHints} hints={hints} />}
                            placement="bottom"
                            trigger="click"
                            onOpenChange={setShowHints}
                        >
                            <motion.div whileTap={{ scale: 0.9 }}>
                                <BulbFilled style={{ fontSize: 50, color: '#1890ff' }} />
                            </motion.div>
                        </Popover>
                    ) : (
                        <ChatHintsPicto pictos={Array.from(pictoHints.values())} onPictoClick={handleHintsPicto} />
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                    <Input
                        style={{ width: 'calc(100% - 100px)' }}
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onPressEnter={handleSend}
                        placeholder="Type a message"
                    />
                    <Button type="primary" icon={<SendOutlined />} onClick={handleSend} />
                    <TranslationOutlined />
                </div>
            </Footer>
        </Layout>
    );
};
