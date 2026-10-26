import React, { useCallback, useEffect, useState } from 'react';
import {
    Avatar, Button, Typography, Skeleton, Space, Card, message
} from 'antd';
import { UserOutlined, PhoneOutlined, LogoutOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CustomFooter } from '../components/CustomFooter/CustomFooter';
import PageLayout from '../components/Other/PageLayout';
import { Controller, Settings } from '../lib/Controller';
import { Api } from 'telegram/tl/api';
import DialogAvatar from '../components/DialogItem/DialogAvatar';
import { HairColor, SkinColor } from '../lib/AAC';
import HintsManager from '../components/Profile/HintsManager';
import { ThemeManager } from '../components/Profile/ThemeManager';
import { CharacterManager } from '../components/Profile/CharacterManager';
import { FontManager } from '../components/Profile/FontSizeManager';

const { Title, Text } = Typography;

const Profile: React.FC = () => {
    const [user, setUser] = useState<Api.User | null>(null);
    const [avatar, setAvatar] = useState<JSX.Element | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [settings, setSettings] = useState<Settings | null>(null);

    const navigate = useNavigate();

    useEffect(() => {
        const loadData = async () => {
            try {
                const currentUser = Controller.getMe();
                const userSettings = Controller.getSettings();
                setUser(currentUser);
                setSettings(userSettings);
            } catch (error) {
                message.error('Errore nel caricamento del profilo.');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const getUserAvatar = useCallback(async () => {
        if (user?.id) {
            try {
                const pic = await Controller.getProfilePic(user.id as bigInt.BigInteger);
                setAvatar(
                    pic ? (
                        <DialogAvatar
                            imageBuffer={pic}
                            name={user.username || ''}
                            size={200}
                            badge={false}
                            unreadedMessages={0}
                        />
                    ) : (
                        <Avatar size={150} icon={<UserOutlined />} />
                    )
                );
            } catch {
                setAvatar(<Avatar size={150} icon={<UserOutlined />} />);
            }
        } else {
            setAvatar(<Avatar size={150} icon={<UserOutlined />} />);
        }
    }, [user]);

    useEffect(() => {
        getUserAvatar();
    }, [getUserAvatar]);

    const updateSettings = (key: keyof Settings, value: any) => {
        if (!settings) return;
        const updatedSettings = { ...settings, [key]: value };
        Controller.updateSettings(key, value);
        setSettings(updatedSettings);
        console.log('Settings updated:', updatedSettings);
    };

    const handleCharacter = (hairColor: HairColor, skinColor: SkinColor) => {
        if (!settings) return;
        if (hairColor !== settings.hairColor) {
            updateSettings('hairColor', hairColor);
        }
        if (skinColor !== settings.skinColor) {
            updateSettings('skinColor', skinColor);
        }

    };

    const handleHints = (hints: { text: string; icon: string }[]) => {
        Controller.setHints(hints);
    };

    const handleFontSize = (fontSize: number) => {
        updateSettings('fontSize', fontSize);
    };

    const handleTheme = (theme: string) => {
        updateSettings('theme', theme);
    };

    if (loading) {
        return (
            <PageLayout title="Profilo" footer={<CustomFooter activeTab={2} />}>
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <Card style={{ background: 'var(--surface)', borderRadius: 16, padding: 16 }}>
                        <Skeleton avatar={{ size: 150 }} paragraph={{ rows: 2 }} active />
                    </Card>
                    <Card style={{ background: 'var(--surface)', borderRadius: 16, padding: 16 }}>
                        <Skeleton paragraph={{ rows: 3 }} active />
                    </Card>
                </Space>
            </PageLayout>
        );
    }

    return (
        <PageLayout
            title="Profilo"
            headerExtra={(
                <Button
                    type="text"
                    size="large"
                    icon={<LogoutOutlined style={{ fontSize: '24px' }} />}
                    onClick={() => navigate('/logout')}
                    aria-label="Esci"
                />
            )}
            footer={<CustomFooter activeTab={2} />}
        >
            <Space direction="vertical" size="large" style={{ display: 'flex', width: '100%' }}>
                {/* User Info Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <Card 
                        style={{ 
                            background: 'var(--surface)', 
                            borderRadius: 16, 
                            boxShadow: 'var(--shadow-md)',
                            border: 'none'
                        }}
                    >
                        <Space direction="vertical" size="middle" style={{ width: '100%', textAlign: 'center' }}>
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-around', 
                                alignItems: 'center',
                                gap: 16,
                                flexWrap: 'wrap',
                                padding: '8px 0'
                            }}>
                                {avatar}
                                <DialogAvatar
                                    imageBuffer={null}
                                    name={user?.username || ''}
                                    size={100}
                                    badge={false}
                                    unreadedMessages={0}
                                    aac={true}
                                    hairColor={settings?.hairColor}
                                    skinColor={settings?.skinColor}
                                />
                            </div>
                            <div>
                                <Title level={3} style={{ margin: '8px 0 4px', fontSize: 24, fontWeight: 600 }}>
                                    {user?.firstName} {user?.lastName}
                                </Title>
                                <Text type="secondary" style={{ fontSize: 16, display: 'block', marginBottom: 4 }}>
                                    @{user?.username}
                                </Text>
                                <Text type="secondary" style={{ fontSize: 15 }}>
                                    <PhoneOutlined /> {user?.phone}
                                </Text>
                            </div>
                        </Space>
                    </Card>
                </motion.div>

                {/* Settings Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                >
                    <Title level={4} style={{ fontSize: 20, fontWeight: 600, marginBottom: 16, marginLeft: 4 }}>
                        Impostazioni
                    </Title>
                </motion.div>

                {/* Character Manager */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.15 }}
                >
                    <Card 
                        style={{ 
                            background: 'var(--surface)', 
                            borderRadius: 16, 
                            boxShadow: 'var(--shadow-sm)',
                            border: 'none'
                        }}
                    >
                        <CharacterManager
                            callback={handleCharacter}
                            currentHairColor={settings?.hairColor}
                            currentSkinColor={settings?.skinColor}
                        />
                    </Card>
                </motion.div>

                {/* Hints Manager */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                >
                    <Card 
                        style={{ 
                            background: 'var(--surface)', 
                            borderRadius: 16, 
                            boxShadow: 'var(--shadow-sm)',
                            border: 'none'
                        }}
                    >
                        <HintsManager
                            callback={handleHints}
                            currentHints={Controller.getHints() || []}
                        />
                    </Card>
                </motion.div>

                {/* Font Manager */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.25 }}
                >
                    <Card 
                        style={{ 
                            background: 'var(--surface)', 
                            borderRadius: 16, 
                            boxShadow: 'var(--shadow-sm)',
                            border: 'none'
                        }}
                    >
                        <FontManager
                            callback={handleFontSize}
                            currentFontSize={settings?.fontSize || 14}
                        />
                    </Card>
                </motion.div>

                {/* Theme Manager */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                >
                    <Card 
                        style={{ 
                            background: 'var(--surface)', 
                            borderRadius: 16, 
                            boxShadow: 'var(--shadow-sm)',
                            border: 'none'
                        }}
                    >
                        <ThemeManager
                            callback={handleTheme}
                            currentTheme={settings?.theme || 'light'}
                        />
                    </Card>
                </motion.div>
            </Space>
        </PageLayout>
    );
};

export default Profile;
