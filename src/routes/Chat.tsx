import React, { useEffect, useState, useRef, useCallback, useLayoutEffect } from 'react';
import { Layout, Input, Button, List, Skeleton, Popover, Row, Col } from 'antd';
import { BulbFilled, SendOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import bigInt from 'big-integer';
import { motion } from 'framer-motion';
import InfiniteScroll from 'react-infinite-scroll-component';
import ChatBubble from '../components/ChatBubble/ChatBubble';
import ChatHeader from '../components/Chat/ChatHeader';
import ChatHints from '../components/Chat/ChatHintsText';
import ChatHintsPicto from '../components/Chat/ChatHintsPicto';
import { Api } from 'telegram';
import { Pictogram, HairColor, SkinColor } from '../lib/AAC';
import hints from '../data/hints.json';
import "../styles/Chat.css";
import { Controller } from '../lib/Controller';
import ChatCustomMessage from '../components/Chat/ChatCustomMessagge';
import { WordsService } from '../lib/WordsService';

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
    const [showHints, setShowHints] = useState<boolean>(false);
    const [pictoHints, setPictoHints] = useState<Map<number, Pictogram>>(new Map());

    const [prevScrollTop, setPrevScrollTop] = useState(0);

    const contentRef = useRef<HTMLDivElement>(null);
    const messageBatchSize = 20;

    const fetchPictogramsHints = useCallback(async (messages: Api.Message[]) => {
        const lastMessage = messages[messages.length - 1];
        if (!lastMessage) return;
        let pictograms = WordsService.extractPictograms(lastMessage.message)
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
                fetchPictogramsHints(fetchedMessages);

            } catch (error) {
                console.error('Failed to fetch messages:', error);
            }
        };

        fetchMessages().then(scrollToBottom);
        //const intervalId = setInterval(fetchMessages, 5000); // Aggiornamento ogni 5 secondi
        //return () => clearInterval(intervalId); // Clear interval on component unmount
    }, [chatId, fetchPictogramsHints]);


    const fetchMoreMessages = useCallback(async () => {
        if (!messages.length || !contentRef.current) return;

        // Salviamo la posizione corrente dello scroll e l'altezza precedente del contenitore
        setPrevScrollTop(contentRef.current.scrollTop);

        const lastMessageId = messages[0]?.id;
        try {
            const moreMessages = await Controller.tgApi.getMessages(chatId, { limit: messageBatchSize, max_id: lastMessageId });
            if (moreMessages.length === 0) {
                setHasMore(false);
                return;
            }

            setMessages(prevMessages => [...moreMessages.reverse(), ...prevMessages]);

            // Usiamo un timeout per assicurarci che la UI abbia renderizzato i nuovi messaggi prima di modificare lo scroll
            setTimeout(() => {
                if (contentRef.current) {
                    contentRef.current.scrollTop = prevScrollTop;
                    console.log('Scrolling to:', prevScrollTop);
                }
            }, 0);
        } catch (error) {
            console.error('Failed to fetch more messages:', error);
        }
    }, [messages, chatId, prevScrollTop]);

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const tempMessage: Api.Message = {
            id: Math.random(), // ID temporaneo
            message: inputValue,
            date: Math.floor(Date.now() / 1000),
            out: true,
            fromId: { userId: 1 }, // Valore temporaneo
            peerId: { channelId: 1 }, // Valore temporaneo
        } as unknown as Api.Message;

        setMessages(prevMessages => [...prevMessages, tempMessage]);
        scrollToBottom();
        setInputValue('');

        try {
            await Controller.tgApi.sendMessage(chatId, inputValue);
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
        const subjectText = subjects.map(subject => subject.word).join(' e ');
        const verbText = verbs.map(verb => verb.word).join(' ');
        const objectText = objects.map(object => object.word).join(', ');

        const message = `${subjectText} ${verbText} ${objectText}.`;
        setInputValue(message);
    };

    const handleHintsPicto = (picto: Pictogram) => {
        const message = `${picto.word}`;
        setInputValue(message);
        setTimeout(handleSend, 100);
        //hide hints 
        setPictoHints(new Map());
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

            <Content id="scrollableDiv" style={{ padding: '0.5rem', overflowY: 'scroll', overflowX: 'hidden', display: 'flex', flexDirection: 'column-reverse' }} ref={contentRef}>
                <InfiniteScroll
                    dataLength={messages.length}
                    next={fetchMoreMessages}
                    hasMore={hasMore}
                    inverse={true}
                    loader={<Skeleton paragraph={{ rows: 0 }} active round />}
                    scrollableTarget="scrollableDiv"
                    style={{ display: 'flex', flexDirection: 'column-reverse' }}>
                    <List
                        itemLayout="horizontal"
                        dataSource={messages}
                        renderItem={item => <ChatBubble message={item} />}
                        className='chat-list'
                    />
                </InfiniteScroll>
            </Content>

            <Footer style={{ padding: '0.5rem', paddingBottom: '1.5rem' }}>
                <Row justify="center" align="middle" style={{ marginBottom: '0.5rem' }}>
                    {pictoHints.size === 0 ? (
                        <Popover
                            open={showHints}
                            content={<ChatHints onHintClick={handleHints} hints={hints} />}
                            placement="top"
                            trigger="click"
                            onOpenChange={setShowHints}
                        >
                            <motion.div whileTap={{ scale: 0.9 }} className="motion-div">
                                <BulbFilled style={{ fontSize: '2rem', color: '#1890ff' }} />
                            </motion.div>
                        </Popover>
                    ) : (
                        <ChatHintsPicto pictos={Array.from(pictoHints.values())} onPictoClick={handleHintsPicto} />
                    )}
                </Row>

                <Row justify="space-between" align="middle" gutter={10}>
                    <Col span={18}>
                        <Input
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            onPressEnter={handleSend}
                            placeholder="Type a message"
                            style={{ width: '100%' }}
                        />
                    </Col>
                    <Col>
                        <Button type="primary" icon={<SendOutlined />} onClick={handleSend} />
                    </Col>
                    <Col>
                        <ChatCustomMessage callback={handleCustomMessage} />
                    </Col>
                </Row>
            </Footer>
        </Layout>
    );
};
