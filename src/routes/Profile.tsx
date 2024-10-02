import React, { useCallback, useEffect, useState } from 'react';
import { Avatar, Button, Typography, Skeleton, Space, Divider, Row, Col, Select, Slider, Radio } from 'antd';
import { UserOutlined, PhoneOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { CustomFooter } from '../components/CustomFooter/CustomFooter';
import { Controller } from '../lib/Controller';
import { Api } from 'telegram/tl/api';
import DialogAvatar from '../components/DialogItem/DialogAvatar';
import { HairColor, SkinColor } from '../lib/AAC';

const { Title, Text } = Typography;
const { Option } = Select;

const Profile: React.FC = () => {
    const [user, setUser] = useState<Api.User>();
    const [avatar, setAvatar] = useState<JSX.Element | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [fontSize, setFontSize] = useState(14);
    const [hairColor, setHairColor] = useState<HairColor>(HairColor.RED);
    const [skinColor, setSkinColor] = useState<SkinColor>(SkinColor.WHITE);
    const [theme, setTheme] = useState<string>('light');
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

    const handleFinish = () => {
        console.log('Impostazioni finali:', { fontSize, hairColor, skinColor, theme });
    };

    return (
        <>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
                padding: '20px',
                backgroundColor: '#f0f2f5',
                paddingBottom: '100px',
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
                                <Col style={{ display: 'flex', justifyContent: 'space-between', alignItems: "center", width: "100%" }}>
                                    {avatar}
                                    <DialogAvatar
                                        imageBuffer={null}
                                        name={user?.username || ''}
                                        size={150}
                                        badge={false}
                                        unreadedMessages={0}
                                        aac={true}
                                        hairColor={hairColor as HairColor}
                                        skinColor={skinColor as SkinColor}
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

                            <h3>Dimensione del Font</h3>
                            <Slider
                                min={12}
                                max={24}
                                value={fontSize}
                                onChange={(value) => setFontSize(value)}
                                tooltip={{ open: true }}
                            />

                            <h3>Colore dei Capelli</h3>
                            <Select
                                value={hairColor}
                                onChange={(value) => setHairColor(value as HairColor)}
                                style={{ width: '100%' }}
                                placeholder="Seleziona un colore"
                            >
                                {Object.values(HairColor).map((color) => (
                                    <Option key={color} value={color}>
                                        {color}
                                    </Option>
                                ))}
                            </Select>

                            <h3>Colore della Pelle</h3>
                            <Select
                                value={skinColor}
                                onChange={(value) => setSkinColor(value as SkinColor)}
                                style={{ width: '100%' }}
                                placeholder="Seleziona un colore"
                            >
                                {Object.values(SkinColor).map((color) => (
                                    <Option key={color} value={color}>
                                        {color}
                                    </Option>
                                ))}
                            </Select>

                            <h3>Tema</h3>
                            <Radio.Group
                                onChange={(e) => setTheme(e.target.value)}
                                value={theme}
                                style={{ width: '100%' }}
                            >
                                <Radio.Button value="light" style={{ width: '100%', textAlign: 'center' }}>
                                    Light
                                </Radio.Button>
                                <Radio.Button value="dark" style={{ width: '100%', textAlign: 'center', marginTop: '10px' }}>
                                    Dark
                                </Radio.Button>
                                <Radio.Button value="high-contrast" style={{ width: '100%', textAlign: 'center', marginTop: '10px' }}>
                                    High Contrast
                                </Radio.Button>
                            </Radio.Group>

                            <Button type="primary" block onClick={handleFinish} style={{ marginTop: '20px' }}>
                                Conferma Impostazioni
                            </Button>
                        </Space>
                    </div>
                )}
            </div>

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
};

export default Profile;
