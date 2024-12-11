import "../styles/Profile.css";

import React, { useCallback, useEffect, useState } from 'react';
import {
    Avatar, Button, Typography, Skeleton, Space, Divider,
    Row, Col, Layout, message
} from 'antd';
import { UserOutlined, PhoneOutlined, LogoutOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { CustomFooter } from '../components/CustomFooter/CustomFooter';
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
            <Layout>
                <Skeleton avatar paragraph={{ rows: 3 }} active />
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="profile-container">
                <div className="profile-header">
                    <Title level={2} style={{ margin: 0 }}>Profilo</Title>
                    <LogoutOutlined
                        style={{ fontSize: '24px', cursor: 'pointer' }}
                        onClick={() => navigate('/logout')}
                    />
                </div>

                <Space direction="vertical" size="middle" style={{ display: 'flex', width: '100%' }}>
                    <Row gutter={24}>
                        <Col className="profile-avatar-container"  xs={24} sm={8} md={6} lg={4}>
                            {avatar}
                            <DialogAvatar
                                imageBuffer={null}
                                name={user?.username || ''}
                                size={150}
                                badge={false}
                                unreadedMessages={0}
                                aac={true}
                                hairColor={settings?.hairColor}
                                skinColor={settings?.skinColor}
                            />
                        </Col>
                        <Divider />
                        <Col xs={24} sm={16} md={18} lg={20}>
                            <Title level={3} style={{ margin: 0 }}>
                                {user?.firstName} {user?.lastName}
                            </Title>
                            <Text type="secondary">@{user?.username}</Text>
                            <br />
                            <Text type="secondary">
                                <PhoneOutlined /> {user?.phone}
                            </Text>
                        </Col>
                    </Row>
                    <Divider />
                    <Title level={3}>Impostazioni</Title>
                    <CharacterManager
                        callback={handleCharacter}
                        currentHairColor={settings?.hairColor}
                        currentSkinColor={settings?.skinColor}
                    />
                    <Divider />
                    <HintsManager
                        callback={handleHints}
                        currentHints={Controller.getHints() || []}
                    />
                    <Divider />
                    <FontManager
                        callback={handleFontSize}
                        currentFontSize={settings?.fontSize || 14}
                    />
                    <Divider />
                    <ThemeManager
                        callback={handleTheme}
                        currentTheme={settings?.theme || 'light'}
                    />
                </Space>
            </div>
            <CustomFooter activeTab={2} />
        </Layout>
    );
};

export default Profile;
