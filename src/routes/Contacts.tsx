import React, { useEffect, useState } from 'react';
import { List, Input, Divider, Skeleton, Button, Space } from 'antd';
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { Dialog } from 'telegram/tl/custom/dialog';
import DialogItem from '../components/DialogItem/DialogItem';
import InfiniteScroll from 'react-infinite-scroll-component';
import { Controller } from '../lib/Controller';

const { Search } = Input;

const Contacts: React.FC = () => {
    const [contactsData, setContactsData] = useState<Dialog[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [filteredContacts, setFilteredContacts] = useState<Dialog[]>([]);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [loading, setLoading] = useState<boolean>(true);
    const [showGroups, setShowGroups] = useState<boolean>(true);

    useEffect(() => {
        const fetchContacts = async () => {
            let dialogs = await Controller.getDialogs();
            dialogs.sort((a, b) => b.date - a.date);
            setContactsData(dialogs);
            setFilteredContacts(dialogs.slice(0, 10));
            setLoading(false);
        };
        fetchContacts();
    }, []);

    const loadMoreData = () => {
        const additionalContacts = contactsData.filter(contact => 
            (contact.name as string).toLowerCase().includes(searchQuery.toLowerCase()) &&
            (showGroups || !contact.isGroup)
        );
        
        if (filteredContacts.length >= additionalContacts.length) {
            setHasMore(false);
            return;
        }
        setFilteredContacts(additionalContacts.slice(0, filteredContacts.length + 10));
    };

    useEffect(() => {
        let filtered = contactsData.filter(contact =>
            (contact.name as string).toLowerCase().includes(searchQuery.toLowerCase())
        );

        if (!showGroups) {
            filtered = filtered.filter(contact => !contact.isGroup);
        }

        setFilteredContacts(filtered.slice(0, 10));
        setHasMore(filtered.length > 10);
    }, [searchQuery, contactsData, showGroups]);

    const handleSearch = (value: string) => {
        setSearchQuery(value);
    };

    const toggleShowGroups = () => {
        setShowGroups(!showGroups);
    };

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px', display: 'flex', alignItems: 'center'}}>
                <Search
                    placeholder="Search contacts"
                    enterButton
                    onSearch={handleSearch}
                    onChange={(e) => handleSearch(e.target.value)}
                    style={{ marginRight: '10px' }}
                />
                <Space>
                    <Button
                        type={showGroups ? 'primary' : 'default'}
                        onClick={toggleShowGroups}
                        icon={showGroups ? <EyeOutlined /> : <EyeInvisibleOutlined />}>
                        Groups
                    </Button>
                </Space>
            </div>
            <div
                id="scrollableDiv"
                style={{
                    flex: 1,
                    overflow: 'auto',
                    padding: '0 16px',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                <InfiniteScroll
                    style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
                    dataLength={filteredContacts.length}
                    next={loadMoreData}
                    hasMore={hasMore}
                    loader={<Skeleton avatar paragraph={{ rows: 1 }} active />}
                    scrollableTarget="scrollableDiv">
                    <List
                        itemLayout="horizontal"
                        dataSource={filteredContacts}
                        renderItem={item => (
                            <DialogItem dialog={item} />
                        )}
                        loading={loading}
                    />
                </InfiniteScroll>
            </div>
        </div>
    );
};

export default Contacts;
