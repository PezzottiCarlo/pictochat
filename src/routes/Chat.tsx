import React, { useEffect, useState, useRef, useCallback, useLayoutEffect } from 'react';
import { Layout, Input, Button, List, Skeleton, Popover, Row, Col, Empty } from 'antd';
import { BulbFilled, PlusOutlined, SendOutlined } from '@ant-design/icons';
import { useLocation, useParams } from 'react-router-dom';
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
import { Dialog } from 'telegram/tl/custom/dialog';
import { updateManager } from '../MyApp';
import { ChatSendMedia } from '../components/Chat/ChatSendMedia';
import ChatPictograms from '../components/Chat/ChatPictograms';
import { PersonalPictogramsCategory } from './PersonalPictograms';

const { Content, Footer } = Layout;

interface ChatProps {
    chatId: bigInt.BigInteger;
}

export const ChatWrapper: React.FC = () => {
    const { chatId } = useParams<{ chatId: string }>();
    return chatId ? <Chat chatId={bigInt(chatId)} /> : null;
};

export const Chat: React.FC<ChatProps> = ({ chatId }) => {
    const location = useLocation();
    const dialog = location.state as Dialog;
    const contentRef = useRef<HTMLDivElement>(null);
    const messageBatchSize = 20;

    const [messages, setMessages] = useState<Api.Message[]>([]);
    const [inputValue, setInputValue] = useState<string>('');
    const [showHints, setShowHints] = useState<boolean>(false);
    const [pictoHints, setPictoHints] = useState<Map<number, Pictogram>>(new Map());
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [loading, setLoading] = useState<boolean>(true);
    const [prevScrollTop, setPrevScrollTop] = useState(0);
    const [media, setMedia] = useState<File>();

    

    const fetchPictogramsHints = useCallback(async (messages: Api.Message[]) => {
        console.log('Fetching pictograms hints...');
        const lastMessage = messages[messages.length - 1];
        if (!lastMessage) return;
        Controller.extractSuggestedPictograms(lastMessage.message).then((pictograms) => {
            const pictoMap = new Map();
            if (!pictograms) return;
            pictograms.forEach((picto, index) => {
                pictoMap.set(index, picto);
            });
            setPictoHints(pictoMap);
        });
    }, []);

    useEffect(() => {
        updateManager.set("chat", (update, type) => {
            let mes = update.message as Api.Message;
            if (!mes || !mes.fromId) return;
            if (((mes.fromId as any).userId as bigInt.BigInteger).equals(dialog.id as bigInt.BigInteger)) {
                setMessages((prevMessages) => [...prevMessages, mes]);
            }
            fetchPictogramsHints([mes]);
        });
    }, [messages, dialog, fetchPictogramsHints]);

    useEffect(() => {
        fetchMessages().then(scrollToBottom);
    }, [chatId, fetchPictogramsHints]);

    const fetchMessages = async () => {
        try {
            let fetchedMessages = await Controller.tgApi.getMessages(chatId, { limit: messageBatchSize });
            fetchedMessages = fetchedMessages.filter((message) => message.className === "Message");
            
            //aggiunta setting via messaggio 
            fetchedMessages.forEach((message) => {
                if (message.message.trim().toLowerCase().includes("oggetto:") && message.media){
                    let splitted = message.message.split(":");
                    Controller.importPersonalPictogramFromMessage((splitted[0].toLowerCase()==="soggetto")?PersonalPictogramsCategory.SOGGETTO:PersonalPictogramsCategory.OGGETTO, splitted[1], message);
                }
            });

            if (fetchedMessages.length < messageBatchSize) {
                setHasMore(false);
            }
            setMessages(fetchedMessages.reverse());
            setLoading(false);
            fetchPictogramsHints(fetchedMessages);
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        }
    };

    const fetchMoreMessages = useCallback(async () => {
        if (!messages.length || !contentRef.current) return;
        setPrevScrollTop(contentRef.current.scrollTop);
        const lastMessageId = messages[0]?.id;
        try {
            const moreMessages = await Controller.tgApi.getMessages(chatId, { limit: messageBatchSize, max_id: lastMessageId });
            setMessages(prevMessages => [...moreMessages.reverse(), ...prevMessages]);
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

        if (media) {
            Controller.sendMedia(chatId, media, inputValue).then((update) => {
                fetchMessages();
            });
        }

        const tempMessage: Api.Message = {
            id: Math.random(),
            message: inputValue,
            date: Math.floor(Date.now() / 1000),
            out: true,
            fromId: { userId: 1 },
            peerId: { channelId: 1 },

        } as unknown as Api.Message;

        setMessages(prevMessages => [...prevMessages, tempMessage]);
        scrollToBottom();
        setInputValue('');

        if (media) {
            setMedia(undefined)
            return;
        }

        try {
            await Controller.tgApi.sendMessage(chatId, inputValue);
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    const handleHints = async (text: string) => {
        try {
            setInputValue(text);
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
        setPictoHints(new Map());
    }

    const scrollToBottom = () => {
        setTimeout(() => {
            if (contentRef.current) {
                contentRef.current.scrollTop = contentRef.current.scrollHeight;
            }
        }, 0);
    };


    async function getName(message: Api.Message): Promise<string | undefined> {
        if (!(dialog.entity?.className === "Channel")) return Promise.resolve(undefined);
        let id = (message.fromId as any).userId
        return id.toString();
    }

    return (
        <Layout style={{ height: '100vh' }}>
            <ChatHeader id={chatId} />
            <Content
                id="scrollableDiv"
                style={{
                    padding: '0.5rem',
                    overflowY: 'scroll',
                    overflowX: 'hidden',
                    display: 'flex',
                    flexDirection: 'column-reverse',
                }}
                ref={contentRef}
            >
                <InfiniteScroll
                    dataLength={messages.length}
                    next={fetchMoreMessages}
                    hasMore={hasMore}
                    inverse={true}
                    loader={
                        !loading &&
                        <Skeleton paragraph={{ rows: 0 }} active round />
                    }
                    scrollableTarget="scrollableDiv"
                    style={{
                        display: 'flex',
                        flexDirection: 'column-reverse',
                    }}
                >
                    <List
                        loading={loading}
                        itemLayout="horizontal"
                        locale={{
                            emptyText: <Empty description={null} image={null} />
                        }}
                        dataSource={messages}
                        renderItem={item => <ChatBubble message={item} name={getName(item)} />}
                        className='chat-list'
                    />
                </InfiniteScroll>
            </Content>

            <Footer style={{ padding: '0.5rem', paddingBottom: '1.5rem' }}>
                <Row justify="center" align="middle" style={{ marginBottom: '0.5rem' }}>
                    {pictoHints.size === 0 ? (
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <Popover
                                open={showHints}
                                content={<ChatHints onHintClick={handleHints} hints={hints} />}
                                placement="top"
                                trigger="click"
                                onOpenChange={setShowHints}
                            >
                                <motion.div whileTap={{ scale: 0.9 }} className="motion-div">
                                    <BulbFilled style={{ fontSize: '2rem', color: 'var(--ant-color-primary)' }} />
                                </motion.div>
                            </Popover>
                            <ChatPictograms callback={function (pictogram: Pictogram): void {
                                setInputValue(inputValue +" "+ pictogram.word);
                            }} />
                        </div>
                    ) : (
                        <ChatHintsPicto pictos={Array.from(pictoHints.values())} onPictoClick={handleHintsPicto} />
                    )}
                </Row>

                <Row justify="space-between" align="middle" gutter={2} style={{ whiteSpace: 'nowrap', flexWrap: 'nowrap' }}>
                    <Col span={16} style={{ marginRight: '2px' }}>
                        <Input.Group compact>
                            <ChatCustomMessage callback={handleCustomMessage} />
                            <Input
                                style={{ width: 'calc(100% - 35px)' }}
                                value={inputValue}
                                onChange={e => setInputValue(e.target.value)}
                                onPressEnter={handleSend}
                                placeholder="Type a message"
                            />
                            <Button type="primary" icon={<SendOutlined />} onClick={handleSend} />
                        </Input.Group>
                    </Col>
                    <Col span={3} style={{ marginRight: '.5rem' }}>
                        <ChatSendMedia media={media} setMedia={setMedia} />
                    </Col>
                </Row>
            </Footer>
        </Layout>
    );
};
