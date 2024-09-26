import "../styles/Login.css"
import React, { useEffect, useState } from 'react';
import { Layout, Form, Input, Button, Typography, message } from 'antd';
import { Controller } from '../lib/Controller';
import { router } from './AppRoutes';
import { useSession } from "../context/SessionContext";

const { Content } = Layout;
const { Title } = Typography;

const Login: React.FC = () => {
    const [phone, setPhone] = useState<string>('');
    const [code, setCode] = useState<string>('');
    const [isCodeSent, setIsCodeSent] = useState<boolean>(false);
    

    const [authResult, setAuthResult] = useState<{ phoneCodeHash: string, isCodeViaApp: boolean }>();
    const session = useSession();

    useEffect(()=>{
        if(session.session !== null){
            router.navigate("/contacts");
        }
    },[])

    const handleSendCode = async () => {
        if (phone) {
            setIsCodeSent(true);
            let res = await Controller.tgApi.sendCode(phone);
            setAuthResult(res);
            message.success('Code sent to your phone!');
        } else {
            message.error('Please enter a valid phone number.');
        }
    };

    const handleVerifyCode = async () => {
        if (code) {
            try {
                let stringSession = await Controller.tgApi.singIn(phone, code, authResult?.phoneCodeHash as string);
                if (stringSession) {
                    message.success('Logged in successfully!');
                    localStorage.setItem('stringSession', stringSession);
                    Controller.tgApi.setClient(stringSession);
                    router.navigate('/contacts');
                }
            } catch (e : any) {
                message.error(e.message);
            }
        } else {
            message.error('Please enter the verification code.');
        }
    };

    return (
        <Layout className="layout">
            <Content className="content">
                <div className="form-container">
                    <Title level={2} style={{ textAlign: 'center' }}>Login</Title>
                    <Form layout="vertical">
                        <Form.Item label="Phone Number">
                            <Input
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="Enter your phone number"
                                disabled={isCodeSent}
                            />
                        </Form.Item>
                        {isCodeSent && (
                            <Form.Item label="Verification Code">
                                <Input
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    placeholder="Enter the code sent to your phone"
                                />
                            </Form.Item>
                        )}
                        <Form.Item>
                            {!isCodeSent ? (
                                <Button type="primary" onClick={handleSendCode} block>
                                    Send Code
                                </Button>
                            ) : (
                                <Button type="primary" onClick={handleVerifyCode} block>
                                    Verify Code
                                </Button>
                            )}
                        </Form.Item>
                    </Form>
                </div>
            </Content>
        </Layout>
    );
};

export default Login;
