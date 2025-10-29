import "../styles/Login.css";
import React, { useState, useEffect } from "react";
import { Form, Input, Button, Typography, message, Row, Col, Space, Card, Avatar, Divider } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import { Controller } from "../lib/Controller";
import { PhoneOutlined, CheckCircleFilled, LockOutlined } from "@ant-design/icons";
import PageLayout from '../components/Other/PageLayout';
import { router } from './AppRoutes';

const { Title, Text, Paragraph } = Typography;

const Login: React.FC = () => {
  const [phonePrefix, setPhonePrefix] = useState<string>("+41");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [isCodeSent, setIsCodeSent] = useState<boolean>(false);
  const [authResult, setAuthResult] = useState<{
    phoneCodeHash: string;
    isCodeViaApp: boolean;
  }>();
  const [isPhoneValid, setIsPhoneValid] = useState<boolean>(false);

  const validatePhoneNumber = () => {
    const phonePrefixPattern = /^\+\d{1,3}$/;
    const phoneNumberPattern = /^\d{9}$/;
    const isPrefixValid = phonePrefixPattern.test(phonePrefix);
    const isNumberValid = phoneNumberPattern.test(phoneNumber);

    setIsPhoneValid(isPrefixValid && isNumberValid);
  };

  useEffect(() => {
    validatePhoneNumber();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phonePrefix, phoneNumber]);

  useEffect(() => {
    // Auto-submit when OTP is complete (5 digits)
    if (code.length === 5 && isCodeSent) {
      handleVerifyCode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const handleSendCode = () => {
    const fullPhoneNumber = `${phonePrefix}${phoneNumber}`;
    if (phoneNumber) {
      setIsCodeSent(true);
      Controller.tgApi.sendCode(fullPhoneNumber).then((res) => {
        setAuthResult(res);
        message.success("Codice inviato al tuo telefono!");
      });
    } else {
      message.error("Inserisci un numero di telefono valido.");
    }
  };

  const handleVerifyCode = () => {
    const fullPhoneNumber = `${phonePrefix}${phoneNumber}`;
    if (code) {
      Controller.tgApi
        .signIn(fullPhoneNumber, code, authResult?.phoneCodeHash as string)
        .then((stringSession) => {
          if (stringSession) {
            message.success("Login effettuato con successo!");
            Controller.tgApi.setClient(stringSession).then(() => {
              Controller.firstLogin(stringSession).then(() => {
                // Navigate to Welcome page for first-time setup
                setTimeout(() => {
                  router.navigate('/welcomePage');
                }, 100);
              });
            });
          }
        })
        .catch((err) => {
          switch (err.code) {
            case 400:
              message.error("Codice di verifica non valido.");
              window.location.reload();
              break;
            default:
              message.error("Errore, riprova più tardi.");
              window.location.reload();
              break;
          }
        });
    } else {
      message.error("Inserisci il codice di verifica.");
    }
  };

  const handleChangeNumber = () => {
    setIsCodeSent(false);
    setCode("");
    setAuthResult(undefined);
    setPhoneNumber("");
  };

  return (
    <PageLayout title="Pictochat" footer={null} fullWidth>
      <div className="login-wrap">
        {/* Hero animated */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Space direction="vertical" size={16} style={{ width: '100%', textAlign: 'center' }}>
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Avatar
                src={`${process.env.PUBLIC_URL}/icon/logo_128x128.png`}
                size={80}
                style={{ boxShadow: 'var(--shadow-md)' }}
              />
            </motion.div>
            <div>
              <Title level={2} style={{ margin: 0, lineHeight: 1.2 }}>
                Benvenuto
              </Title>
              <Paragraph type="secondary" style={{ margin: '8px 0 0', fontSize: 16 }}>
                Comunica con semplicità: testi e pittogrammi insieme.
              </Paragraph>
            </div>
          </Space>
        </motion.div>

        <Divider />

        {/* Form card animated */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card
            bordered={false}
            style={{
              boxShadow: 'var(--shadow-md)',
              borderRadius: 16
            }}
          >
            <Form layout="vertical" size="large">
              <AnimatePresence mode="wait">
                {!isCodeSent ? (
                  <motion.div
                    key="phone-step"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Form.Item label={<Text strong style={{ fontSize: 16 }}>Numero di telefono</Text>}>
                      <Row gutter={8} wrap={false}>
                        <Col flex="120px">
                          <Input
                            prefix={<PhoneOutlined />}
                            value={phonePrefix}
                            onChange={(e) => setPhonePrefix(e.target.value)}
                            placeholder="+41"
                            size="large"
                            style={{ height: 48, fontSize: 17 }}
                          />
                        </Col>
                        <Col flex="auto">
                          <Input
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="767 159 957"
                            autoFocus={true}
                            size="large"
                            style={{ height: 48, fontSize: 17 }}
                          />
                        </Col>
                      </Row>
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0 }}>
                      <Button
                        type="primary"
                        onClick={handleSendCode}
                        block
                        disabled={!isPhoneValid}
                        size="large"
                        icon={<PhoneOutlined />}
                        style={{ height: 52, fontSize: 17, fontWeight: 600 }}
                      >
                        Invia codice
                      </Button>
                    </Form.Item>
                  </motion.div>
                ) : (
                  <motion.div
                    key="code-step"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Space direction="vertical" size={16} style={{ width: '100%' }}>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      >
                        <CheckCircleFilled style={{ fontSize: 48, color: '#52c41a' }} />
                      </motion.div>

                      <div>
                        <Title level={4} style={{ margin: 0 }}>Codice inviato!</Title>
                        <Paragraph type="secondary" style={{ margin: '4px 0 0' }}>
                          Controlla il tuo telefono o l'app Telegram
                        </Paragraph>
                      </div>

                      <Form.Item label={<Text strong style={{ fontSize: 16 }}>Inserisci il codice</Text>} style={{ marginBottom: 12 }}>
                        <Input.OTP
                          length={5}
                          value={code}
                          onChange={(v) => setCode(v)}
                          size="large"
                        />
                      </Form.Item>

                      <Form.Item style={{ marginBottom: 0 }}>
                        <Space direction="vertical" size={8} style={{ width: '100%' }}>
                          <Button
                            type="primary"
                            onClick={handleVerifyCode}
                            block
                            size="large"
                            icon={<LockOutlined />}
                            style={{ height: 52, fontSize: 17, fontWeight: 600 }}
                          >
                            Verifica e accedi
                          </Button>
                          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                            <Button type="link" onClick={handleSendCode}>
                              Reinvia codice
                            </Button>
                            <Button type="link" onClick={handleChangeNumber}>
                              Cambia numero
                            </Button>
                          </Space>
                        </Space>
                      </Form.Item>
                    </Space>
                  </motion.div>
                )}
              </AnimatePresence>
            </Form>
          </Card>
        </motion.div>

        {/* Footer animated */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          style={{ textAlign: 'center', marginTop: 16 }}
        >
          <Text type="secondary" style={{ fontSize: 14 }}>
            Accedendo, accetti le nostre linee guida di utilizzo.
          </Text>
        </motion.div>
      </div>
    </PageLayout>
  );
};

export default Login;
