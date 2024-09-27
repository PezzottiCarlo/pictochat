import "../styles/Login.css";
import React, { useEffect, useState } from 'react';
import { Layout, Form, Input, Button, Typography, message, Row, Col, Image } from 'antd';
import { motion } from 'framer-motion'; // Animazioni
import { Controller } from '../lib/Controller';
import { router } from './AppRoutes';
import { useSession } from "../context/SessionContext";
import { PhoneOutlined, LockOutlined } from '@ant-design/icons'; // Icone Ant Design

const { Content } = Layout;
const { Title, Text } = Typography;

const Login: React.FC = () => {
    const [phonePrefix, setPhonePrefix] = useState<string>('+41'); // Prefisso del numero di telefono
    const [phoneNumber, setPhoneNumber] = useState<string>(''); // Numero di telefono
    const [code, setCode] = useState<string>(''); // Codice di verifica
    const [isCodeSent, setIsCodeSent] = useState<boolean>(false); // Stato invio codice
    const [authResult, setAuthResult] = useState<{ phoneCodeHash: string, isCodeViaApp: boolean }>();
    const session = useSession();

    useEffect(() => {
        if (session.session !== null) {
            router.navigate("/contacts");
        }
    }, [session]);

    const handleSendCode = async () => {
        const fullPhoneNumber = `${phonePrefix}${phoneNumber}`; // Combina prefisso e numero di telefono
        if (phoneNumber) {
            setIsCodeSent(true);
            let res = await Controller.tgApi.sendCode(fullPhoneNumber);
            setAuthResult(res);
            message.success('Codice inviato al tuo telefono!');
        } else {
            message.error('Inserisci un numero di telefono valido.');
        }
    };

    const handleVerifyCode = async () => {
        const fullPhoneNumber = `${phonePrefix}${phoneNumber}`;
        if (code) {
            try {
                let stringSession = await Controller.tgApi.singIn(fullPhoneNumber, code, authResult?.phoneCodeHash as string);
                if (stringSession) {
                    message.success('Login effettuato con successo!');
                    localStorage.setItem('stringSession', stringSession);
                    Controller.tgApi.setClient(stringSession);
                    router.navigate('/contacts');
                }
            } catch (e: any) {
                message.error(e.message);
            }
        } else {
            message.error('Inserisci il codice di verifica.');
        }
    };

    return (
        <Layout className="layout">
            <Content className="content">
                <motion.div
                    className="form-container"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Title level={2} className="login-title" style={{ textAlign: 'center' }}>
                        Pictochat
                    </Title>
                    <Text type="secondary" style={{ textAlign: 'center', display: 'block', marginBottom: '2rem' }}>
                        Inserisci il tuo numero di telefono per accedere.
                    </Text>
                    <Form layout="vertical">
                        {/* Campo Prefisso e Numero di Telefono */}
                        <Form.Item label="Numero di Telefono">
                            <Row gutter={8}>
                                <Col span={6}>
                                    <Input
                                        prefix={<PhoneOutlined />}
                                        value={phonePrefix}
                                        onChange={(e) => setPhonePrefix(e.target.value)}
                                        disabled={isCodeSent}
                                        placeholder="+41"
                                    />
                                </Col>
                                <Col span={18}>
                                    <Input
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        disabled={isCodeSent}
                                        placeholder="es. 76 815 99 577"
                                    />
                                </Col>
                            </Row>
                        </Form.Item>

                        {/* Campo Codice di Verifica */}
                        {isCodeSent && (
                            <Form.Item label="Codice di Verifica">
                                <Input
                                    prefix={<LockOutlined />}
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    placeholder="Inserisci il codice"
                                />
                            </Form.Item>
                        )}

                        {/* Pulsanti Invia e Verifica */}
                        <Form.Item>
                            {!isCodeSent ? (
                                <motion.div whileTap={{ scale: 0.95 }}>
                                    <Button type="primary" onClick={handleSendCode} block>
                                        Invia Codice
                                    </Button>
                                </motion.div>
                            ) : (
                                <motion.div whileTap={{ scale: 0.95 }}>
                                    <Button type="primary" onClick={handleVerifyCode} block>
                                        Verifica Codice
                                    </Button>
                                </motion.div>
                            )}
                        </Form.Item>
                    </Form>
                </motion.div>
            </Content>
        </Layout>
    );
};

export default Login;
