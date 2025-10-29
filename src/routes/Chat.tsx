import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Layout, Input, Button, List, Skeleton, Popover, Empty } from 'antd';
import { BulbFilled, SendOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useParams } from 'react-router-dom';
import bigInt from 'big-integer';
import InfiniteScroll from 'react-infinite-scroll-component';
import ChatBubble from '../components/ChatBubble/ChatBubble';
import ChatHeader from '../components/Chat/ChatHeader';
import ChatHints from '../components/Chat/ChatHintsText';
import ChatHintsPicto from '../components/Chat/ChatHintsPicto';
import { Api } from 'telegram';
import { Pictogram } from '../lib/AAC';
import "../styles/Chat.css";
import { Controller } from '../lib/Controller';
import ChatCustomMessage from '../components/Chat/ChatCustomMessagge';
import { Dialog } from 'telegram/tl/custom/dialog';
import { updateManager } from '../MyApp';
import { ChatSendMedia } from '../components/Chat/ChatSendMedia';
import ChatPictograms from '../components/Chat/ChatPictograms';

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
    const [loadingMore, setLoadingMore] = useState<boolean>(false);
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
        const isSameDialog = (m: Api.Message) => {
            const peer: any = (m as any).peerId || {};
            const did = dialog.id as bigInt.BigInteger;
            const uid: bigInt.BigInteger | undefined = peer.userId;
            const cid: bigInt.BigInteger | undefined = peer.channelId;
            const chatId: bigInt.BigInteger | undefined = peer.chatId;
            return (
                (uid && (uid as any).equals?.(did)) ||
                (cid && (cid as any).equals?.(did)) ||
                (chatId && (chatId as any).equals?.(did))
            );
        };

        updateManager.set("chat", (update, type) => {
            const mes = update.message as Api.Message;
            if (!mes || (mes as any).className !== 'Message') return;
            if (!isSameDialog(mes)) return;

            setMessages(prev => {
                const exists = prev.some(p => (p as any).id === (mes as any).id);
                if (exists) return prev;
                const next = [...prev, mes].sort((a: any, b: any) => (a.id || 0) - (b.id || 0));
                return next;
            });
            // cache the incoming message
            try { Controller.storage.addMessage(mes); } catch {}
            // auto-scroll only if user is near bottom
            const container = contentRef.current;
            if (container) {
                const nearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120;
                if (nearBottom) requestAnimationFrame(scrollToBottom);
            }
            fetchPictogramsHints([mes]);
        });
        // only depend on dialog id and callback reference
    }, [dialog.id, fetchPictogramsHints]);

    useEffect(() => {
        // load cache-first immediately
        fetchMessages().then(scrollToBottom);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chatId, fetchPictogramsHints]);

    const fetchMessages = async () => {
        // Cache-first: use Controller to get cached messages immediately, then it refreshes in background
        setLoading(true);
        try {
            const fetched = await Controller.getMessages(chatId, messageBatchSize);
            const onlyMessages = fetched.filter((m: any) => m.className === 'Message');
            // Ensure ascending by id for consistent rendering with inverse scroll
            const sortedAsc = [...onlyMessages].sort((a: any, b: any) => (a.id || 0) - (b.id || 0));

            // process potential personal pictograms
            sortedAsc.forEach((message) => {
                const somethingNew = Controller.readPersonalPictogram(message);
                if (somethingNew) fetchPictogramsHints(sortedAsc);
            });

            // Do not prematurely disable hasMore based on cache size; older messages might still exist remotely
            setMessages(sortedAsc);
            setLoading(false);
            fetchPictogramsHints(sortedAsc);

            // One-time immediate sync from network to avoid stale state on first entry
            // This complements Controller's background refresh (which updates DB) by updating UI state now
            (async () => {
                try {
                    const fresh = await Controller.tgApi.getMessages(chatId, { limit: messageBatchSize });
                    const freshOnly = fresh.filter((m: any) => m.className === 'Message');
                    const freshAsc = [...freshOnly].sort((a: any, b: any) => (a.id || 0) - (b.id || 0));
                    setHasMore(freshOnly.length >= messageBatchSize);
                    setMessages(prev => {
                        const existing = new Set(prev.map((p: any) => p.id));
                        const merged = [...prev, ...freshAsc.filter((m: any) => !existing.has(m.id))];
                        return merged.sort((a: any, b: any) => (a.id || 0) - (b.id || 0));
                    });
                } catch {}
            })();
        } catch (error) {
            console.error('Failed to fetch messages:', error);
            setLoading(false);
        }
    };

    const fetchMoreMessages = useCallback(async () => {
        if (!messages.length || !contentRef.current) return;
        
        const container = contentRef.current;
        const oldScrollHeight = container.scrollHeight;
        const oldScrollTop = container.scrollTop;
        
        const lastMessageId = messages[0]?.id;
        try {
            setLoadingMore(true);
            // cache-first older page
            const onlyMessages = await Controller.getOlderMessages(chatId, lastMessageId, messageBatchSize);
            if (onlyMessages.length === 0) {
                setHasMore(false);
                return;
            }
            const sortedAsc = [...onlyMessages].sort((a: any, b: any) => (a.id || 0) - (b.id || 0));
            setMessages(prevMessages => {
                const existing = new Set(prevMessages.map((p: any) => p.id));
                const toAdd = sortedAsc.filter((m: any) => !existing.has(m.id));
                return [...toAdd, ...prevMessages];
            });
            
            // Mantieni la posizione di scroll dopo il caricamento
            setTimeout(() => {
                if (container) {
                    const newScrollHeight = container.scrollHeight;
                    const scrollDiff = newScrollHeight - oldScrollHeight;
                    container.scrollTop = oldScrollTop + scrollDiff;
                }
            }, 100);
        } catch (error) {
            console.error('Failed to fetch more messages:', error);
        } finally {
            setLoadingMore(false);
        }
    }, [messages, chatId]);



    const handleSend = async () => {
        if (!inputValue.trim() && !media) return;

        const textToSend = inputValue;
        setInputValue('');

        try {
            if (media) {
                await Controller.sendMedia(chatId, media, textToSend);
                setMedia(undefined);
                // Refresh messages after media upload
                setTimeout(() => {
                    fetchMessages().then(scrollToBottom);
                }, 500);
            } else {
                const sent = await Controller.tgApi.sendMessage(chatId, textToSend);
                if (sent) {
                    setMessages((prev) => [...prev, sent]);
                    requestAnimationFrame(scrollToBottom);
                }
            }
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
        if (contentRef.current) {
            contentRef.current.scrollTop = contentRef.current.scrollHeight;
        }
    };


    async function getName(message: Api.Message): Promise<string | undefined> {
        if (!(dialog.entity?.className === "Channel")) return Promise.resolve(undefined);
        let id = (message.fromId as any).userId
        return id.toString();
    }

    return (
        <Layout style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--ios-gray-bg)' }}>
            <ChatHeader id={chatId} />
            <Content
                id="scrollableDiv"
                style={{
                    padding: '12px 8px',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'var(--ios-gray-bg)',
                    flex: 1,
                }}
                ref={contentRef}
            >
                <InfiniteScroll
                    dataLength={messages.length}
                    next={fetchMoreMessages}
                    hasMore={hasMore}
                    inverse={false}
                    loader={loadingMore ? <Skeleton paragraph={{ rows: 1 }} active /> : undefined}
                    scrollableTarget="scrollableDiv"
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'visible',
                    }}
                >
                    {loading && messages.length === 0 ? (
                        <div style={{ padding: '8px 12px' }}>
                            <Skeleton active paragraph={{ rows: 2 }} title={false} />
                        </div>
                    ) : (
                        <List
                            itemLayout="horizontal"
                            locale={{
                                emptyText: <Empty description="Nessun messaggio" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                            }}
                            dataSource={messages}
                            renderItem={item => (
                                <ChatBubble
                                    key={(item as any).id}
                                    message={item}
                                    name={getName(item)}
                                    chatWith={dialog.id as bigInt.BigInteger}
                                />
                            )}
                            className='chat-list'
                            style={{ background: 'transparent', border: 0 }}
                        />
                    )}
                </InfiniteScroll>
            </Content>

            <Footer 
                style={{ 
                    padding: '16px', 
                    paddingBottom: 'calc(16px + env(safe-area-inset-bottom))', 
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
                    borderTop: '1px solid rgba(0,0,0,0.06)'
                }}
            >
                {/* Pictogram Hints Section */}
                <AnimatePresence mode="wait">
                    {pictoHints.size === 0 ? (
                        <motion.div
                            key="quick-actions"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            style={{ marginBottom: '12px' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16 }}>
                                <Popover
                                    open={showHints}
                                    content={<ChatHints onHintClick={handleHints} hints={Controller.getHints()} />}
                                    placement="top"
                                    trigger="click"
                                    onOpenChange={setShowHints}
                                >
                                    <motion.div whileTap={{ scale: 0.9 }}>
                                        <Button
                                            type="text"
                                            size="large"
                                            icon={<BulbFilled style={{ fontSize: '28px', color: 'var(--ios-orange)' }} />}
                                            aria-label="Suggerimenti rapidi"
                                            style={{ 
                                                height: 48, 
                                                width: 48,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        />
                                    </motion.div>
                                </Popover>
                                <ChatPictograms callback={function (pictogram: Pictogram): void {
                                    setInputValue(inputValue + " " + pictogram.word);
                                }} />
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="picto-hints"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            style={{ marginBottom: '12px' }}
                        >
                            <div style={{ 
                                overflowX: 'auto', 
                                overflowY: 'hidden', 
                                width: '100%',
                                background: 'var(--ios-gray-bg)',
                                borderRadius: 12,
                                padding: '8px 4px'
                            }}>
                                <ChatHintsPicto pictos={Array.from(pictoHints.values())} onPictoClick={handleHintsPicto} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Input Section */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                    <ChatCustomMessage callback={handleCustomMessage} />
                    <Input
                        className="chat-input"
                        style={{ flex: 1 }}
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onPressEnter={handleSend}
                        placeholder="Scrivi un messaggio..."
                        aria-label="Campo messaggio"
                    />
                    <ChatSendMedia media={media} setMedia={setMedia} />
                    <motion.div whileTap={{ scale: 0.9 }}>
                        <Button 
                            aria-label="Invia messaggio" 
                            type="primary" 
                            icon={<SendOutlined />} 
                            onClick={handleSend} 
                            size="large"
                            className="chat-send-btn"
                        />
                    </motion.div>
                </div>
            </Footer>
        </Layout>
    );
};
