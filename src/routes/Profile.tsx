import React, { useCallback, useEffect, useState } from 'react';
import { Avatar, Button, Typography, Skeleton, Space, Divider, Row, Col } from 'antd';
import { UserOutlined, PhoneOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { CustomFooter } from '../components/CustomFooter/CustomFooter';
import { Controller } from '../lib/Controller';
import { Api } from 'telegram/tl/api';
import DialogAvatar from '../components/DialogItem/DialogAvatar';

const { Title, Text } = Typography;

const Profile: React.FC = () => {
    const [user, setUser] = useState<Api.User>();
    const [avatar, setAvatar] = useState<JSX.Element | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const navigate = useNavigate();

    useEffect(() => {
        Controller.tgApi.getMe().then((user) => {
            setUser(user);
            setLoading(false);
        });
    }, []);

    // Funzione per ottenere l'avatar dell'utente
    const getUserAvatar = useCallback(() => {
        if (user?.id) {
            Controller.getProfilePic(user.id as bigInt.BigInteger).then((pic) => {
                if (pic) {
                    setAvatar(
                        <DialogAvatar
                            imageBuffer={pic}
                            name={user.username || ''}
                            size={200}
                            badge={false}
                            unreadedMessages={0}
                        />
                    );
                } else {
                    setAvatar(<Avatar size={150} icon={<UserOutlined />} />);
                }
            });
        } else {
            setAvatar(<Avatar size={150} icon={<UserOutlined />} />);
        }
    }, [user]);

    useEffect(() => {
        getUserAvatar();
    }, [getUserAvatar]);

    return (
        <>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
                padding: '20px',
                backgroundColor: '#f0f2f5',
            }}>
                {loading ? (
                    <Skeleton avatar paragraph={{ rows: 3 }} active />
                ) : (
                    <div style={styles.content}>
                        <div style={{
                            textAlign: 'left',
                            marginBottom: '20px',
                        }}>
                            <Title level={2} style={{ margin: 0 }}>Profilo</Title>
                        </div>
                        <Space direction="vertical" size="middle" style={{ display: 'flex', width: '100%' }}>
                            <Row gutter={24}>
                                <Col xs={24} sm={8} md={6} lg={4}>
                                    {avatar}

                                </Col>
                                <Divider />
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
                        </Space>
                    </div>
                )}
            </div >

            <CustomFooter activeTab={2} />
        </>
    );
};

const styles = {
    container: {},
    content: {
        width: '100%',
        maxWidth: '800px',
        margin: '0 auto',
    },
    alignRight: {
        textAlign: 'right' as 'right',
    },
};

export default Profile;