import React, { useEffect, useState } from 'react';
import { List, Input, Skeleton, Button, Space, Tabs, Typography, message, Flex, Layout } from 'antd';
import { EyeOutlined, EyeInvisibleOutlined, MessageOutlined, SettingOutlined, UserOutlined } from '@ant-design/icons';
import { Dialog } from 'telegram/tl/custom/dialog';
import DialogItem from '../components/DialogItem/DialogItem';
import InfiniteScroll from 'react-infinite-scroll-component';
import { Controller } from '../lib/Controller';
import { router } from './AppRoutes';
import { CustomFooter } from '../components/CustomFooter/CustomFooter';
import { updateManager } from '../MyApp';
import { Api } from 'telegram/tl/api';

const { Search } = Input;
const { Title } = Typography;

const Contacts: React.FC = () => {
    const [contactsData, setContactsData] = useState<Dialog[]>([]);
    const [filteredContacts, setFilteredContacts] = useState<Dialog[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [loading, setLoading] = useState<boolean>(true);
    const [showGroups, setShowGroups] = useState<boolean>(true);


    useEffect(() => {
        updateManager.set("contacts", (update, type) => {
            if (type === 0) {
                let shortMess = update.originalUpdate as Api.UpdateShortMessage;
                let fromID = shortMess.userId;
                for (let dialog of contactsData) {
                    if (dialog.id?.toString() === fromID.toString()) {
                        dialog.message = shortMess as any as Api.Message;
                        dialog.unreadCount++;
                        contactsData.splice(contactsData.indexOf(dialog), 1);
                        contactsData.unshift(dialog);
                        setContactsData([...contactsData]);
                        message.info(`${dialog.name}: ${dialog.message.message}`);
                        break;
                    }
                }
            } else if (type === 1) {
                let userStatus = update as Api.UpdateUserStatus;
                let fromID = userStatus.userId;
                for (let dialog of contactsData) {
                    if (dialog.id?.toString() === fromID.toString()) {
                        if (dialog.entity) {
                            (dialog.entity as any).status = userStatus.status.className;
                        }
                        setContactsData([...contactsData]);
                    }
                }
            }
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
                dialogs.sort((a, b) => b.date - a.date); // Sorting dialogs by date
                if (isMounted) {
                    setContactsData(dialogs);
                    setFilteredContacts(dialogs.slice(0, 10)); // Initial load of 10 dialogs
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

    // Function to load more contacts when scrolling
    const loadMoreData = () => {
        const filtered = contactsData.filter(contact =>
            (contact.name as string).toLowerCase().includes(searchQuery.toLowerCase()) &&
            (showGroups || !contact.isGroup)
        );

        if (filteredContacts.length >= filtered.length) {
            setHasMore(false);
            return;
        }

        setFilteredContacts(prev => [
            ...prev,
            ...filtered.slice(prev.length, prev.length + 10)
        ]);
    };

    // Update the filtered contacts based on search query or showGroups toggle
    useEffect(() => {
        const filtered = contactsData.filter(contact =>
            (contact.name as string).toLowerCase().includes(searchQuery.toLowerCase()) &&
            (showGroups || !contact.isGroup)
        );

        setFilteredContacts(filtered.slice(0, 10)); // Reset filtered contacts to initial 10
        setHasMore(filtered.length > 10); // Check if more contacts are available
    }, [searchQuery, contactsData, showGroups]);

    // Handle search input changes
    const handleSearch = (value: string) => {
        setSearchQuery(value);
    };

    // Toggle showing groups in the list
    const toggleShowGroups = () => {
        setShowGroups(prev => !prev);
    };

    return (
        <Layout style={{ height: '100vh', display: "flex", flexDirection: 'column' }}>
            <div
                id="scrollableDiv"
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '0 16px',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {/* Title */}
                <div style={{ textAlign: 'left' }}>
                    <Title level={2}>Chats</Title>
                </div>

                {/* Search and Hide Group Button */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Search
                        placeholder="Search contacts"
                        enterButton
                        onSearch={handleSearch}
                        onChange={(e) => handleSearch(e.target.value)}
                        style={{ marginRight: '10px', flex: 1 }}
                    />
                    <Button
                        type="default"
                        onClick={toggleShowGroups}
                        icon={showGroups ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                        shape="circle"
                    />
                </div>

                <InfiniteScroll
                    dataLength={filteredContacts.length}
                    next={loadMoreData}
                    hasMore={hasMore}
                    loader={<Skeleton avatar paragraph={{ rows: 1 }} active />}
                    scrollableTarget="scrollableDiv"
                >
                    <List
                        itemLayout="horizontal"
                        dataSource={filteredContacts}
                        renderItem={(item) => <DialogItem key={item.id?.toString()} dialog={item} />}
                        loading={loading}
                    />
                </InfiniteScroll>
            </div>
            <CustomFooter activeTab={1} />
        </Layout >
    );
};

export default Contacts;