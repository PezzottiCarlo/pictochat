import "../styles/Login.css";
import React, { useState, useEffect } from "react";
import { Layout, Form, Input, Button, Typography, message, Row, Col } from "antd";
import { motion } from "framer-motion";
import { Controller } from "../lib/Controller";
import { PhoneOutlined, LockOutlined } from "@ant-design/icons";

const { Content } = Layout;
const { Title, Text } = Typography;

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
  }, [phonePrefix, phoneNumber]);

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
                setTimeout(() => window.location.reload(), 500);
              });
            });
          }
        })
        .catch((err) => {
          switch (err.code) {
            case 400:
              message.error("Codice di verifica non valido.");
              //reload page
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

  return (
    <Layout className="layout">
      <Content className="content">
        <motion.div
          className="form-container"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Title level={2} className="login-title" style={{ textAlign: "center" }}>
            Pictochat
          </Title>
          <Text
            type="secondary"
            style={{ textAlign: "center", display: "block", marginBottom: "2rem" }}
          >
            Inserisci il tuo numero di telefono per accedere.
          </Text>
          <Form layout="vertical">
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
                    accept="number"
                    autoFocus={true}
                  />
                </Col>
              </Row>
            </Form.Item>

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

            <Form.Item>
              {!isCodeSent ? (
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button
                    type="primary"
                    onClick={handleSendCode}
                    block
                    disabled={!isPhoneValid}
                  >
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
