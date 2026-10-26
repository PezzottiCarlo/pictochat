import React, { useEffect, useState, useMemo } from 'react';
import { List, Input, Skeleton, Button, Space, Tooltip, message } from 'antd';
import { EyeOutlined, EyeInvisibleOutlined, SearchOutlined } from '@ant-design/icons';
import { Dialog } from 'telegram/tl/custom/dialog';
import DialogItem from '../components/DialogItem/DialogItem';
import InfiniteScroll from 'react-infinite-scroll-component';
import { Controller } from '../lib/Controller';
import { CustomFooter } from '../components/CustomFooter/CustomFooter';
import PageLayout from '../components/Other/PageLayout';
import { updateManager } from '../MyApp';

// No local Title usage here because PageLayout renders it

const Contacts: React.FC = () => {
    const [contactsData, setContactsData] = useState<Dialog[]>([]);
    const [filteredContacts, setFilteredContacts] = useState<Dialog[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [loading, setLoading] = useState<boolean>(true);
    const [showGroups, setShowGroups] = useState<boolean>(true);

    const baseFiltered = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return contactsData.filter(contact => {
            const name = (contact.name as string | undefined)?.toLowerCase() || '';
            return name.includes(q) && (showGroups || !contact.isGroup);
        });
    }, [contactsData, searchQuery, showGroups]);

    useEffect(() => {
        updateManager.set("contacts", (update, type) => {
            Controller.handleContactUpdate(update, type, contactsData, setContactsData,(dialog,msg) => {
                message.info(`${dialog} : ${msg}`);
            });
        });
    }, [contactsData]);

    useEffect(() => {
        let isMounted = true;
        const fetchContacts = async () => {
            try {
                setLoading(true);
                let dialogs = await Controller.getDialogs((dialogs) => {
                    setContactsData(dialogs);
                    setFilteredContacts(dialogs.slice(0, 10));
                });
                dialogs.sort((a, b) => b.date - a.date);
                if (isMounted) {
                    setContactsData(dialogs);
                    setFilteredContacts(dialogs.slice(0, 10));
                }
            } catch (error) {
                console.error('Error fetching dialogs:', error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchContacts();

        return () => {
            isMounted = false;
        };
    }, []);

    const loadMoreData = () => {
        const start = filteredContacts.length;
        const nextChunk = baseFiltered.slice(start, start + 10);
        if (nextChunk.length === 0) {
            setHasMore(false);
            return;
        }
        setFilteredContacts(prev => [...prev, ...nextChunk]);
        if (start + nextChunk.length >= baseFiltered.length) {
            setHasMore(false);
        }
    };

    useEffect(() => {
        setFilteredContacts(baseFiltered.slice(0, 10));
        setHasMore(baseFiltered.length > 10);
    }, [baseFiltered]);

    const handleSearch = (value: string) => setSearchQuery(value);
    const toggleShowGroups = () => setShowGroups(prev => !prev);

    return (
        <PageLayout title="Contatti" footer={<CustomFooter activeTab={1} />} fullWidth>
            <div style={{ padding: 0 }}>
                <Space size={12} align="center" style={{ display: 'flex', width: '100%', marginBottom: 8 }}>
                    <Input
                        allowClear
                        prefix={<SearchOutlined style={{ fontSize: 18, color: 'var(--ios-text-secondary)' }} />}
                        placeholder="Cerca contatti..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        size="large"
                        style={{ 
                            flex: 1, 
                            height: 48, 
                            fontSize: 17,
                            borderRadius: 12,
                            background: 'var(--surface)'
                        }}
                    />
                    <Tooltip title={showGroups ? 'Nascondi gruppi' : 'Mostra tutti'}>
                        <Button
                            type="default"
                            onClick={toggleShowGroups}
                            icon={showGroups ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                            size="large"
                            style={{ 
                                width: 48, 
                                height: 48, 
                                fontSize: 20,
                                borderRadius: 12
                            }}
                            aria-label={showGroups ? 'Nascondi gruppi' : 'Mostra tutti'}
                        />
                    </Tooltip>
                </Space>

                <InfiniteScroll
                    key={`${searchQuery}-${showGroups}-${contactsData.length}`}
                    dataLength={filteredContacts.length}
                    next={loadMoreData}
                    hasMore={hasMore}
                    loader={<Skeleton avatar paragraph={{ rows: 1 }} active />}
                    scrollableTarget="scrollableDiv"
                    scrollThreshold={0.9}
                >
                    <List
                        itemLayout="horizontal"
                        dataSource={filteredContacts}
                        renderItem={(item) => (
                            <DialogItem
                                key={item.id?.toString()}
                                dialog={item}
                                avatarSize={64}
                                titleSize={18}
                                descSize={15}
                                timeSize={14}
                            />
                        )}
                        loading={loading}
                        style={{ 
                            background: 'transparent', 
                            borderRadius: 0, 
                            padding: 0, 
                            boxShadow: 'none' 
                        }}
                    />
                </InfiniteScroll>
            </div>
        </PageLayout>
    );
};

export default Contacts;