import React, { useState, useEffect } from 'react';
import { Button, Card, Space, Typography, Slider, Avatar, Steps, Row, Col } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    RocketOutlined, 
    FontSizeOutlined, 
    UserOutlined, 
    BgColorsOutlined,
    CheckCircleFilled,
    ArrowRightOutlined,
    SoundOutlined
} from '@ant-design/icons';
import { HairColor, SkinColor, Pictogram } from '../lib/AAC';
import { Controller } from '../lib/Controller';
import { router } from './AppRoutes';
import PageLayout from '../components/Other/PageLayout';
import ChatBubble from '../components/ChatBubble/ChatBubble';
import ChatHintsPicto from '../components/Chat/ChatHintsPicto';
import ChatHints from '../components/Chat/ChatHintsText';
import predefinedPhrases from '../data/predefined_phrases.json';

const { Title, Text } = Typography;

const WelcomePage: React.FC = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [fontSize, setFontSize] = useState(14);
    const [hairColor, setHairColor] = useState<HairColor>(HairColor.BLACK);
    const [skinColor, setSkinColor] = useState<SkinColor>(SkinColor.WHITE);
    
    // Tutorial state
    const [tutorialQuestion, setTutorialQuestion] = useState<{question: string, answers: string[]}>({question: '', answers: []});
    const [tutorialPictos, setTutorialPictos] = useState<Pictogram[]>([]);
    const [answerPictos, setAnswerPictos] = useState<Pictogram[]>([]);
    const [showPictoHints, setShowPictoHints] = useState(false);
    const [showTextHints, setShowTextHints] = useState(false);
    const [showQuestionHints, setShowQuestionHints] = useState(false);

    // Check if user already completed welcome setup
    useEffect(() => {
        const welcomeCompleted = localStorage.getItem('welcomeCompleted');
        if (welcomeCompleted === 'true') {
            router.navigate('/contacts');
        }
    }, []);

    // Prepare tutorial data
    useEffect(() => {
        // Random question for tutorial
        const randomQ = predefinedPhrases[Math.floor(Math.random() * predefinedPhrases.length)];
        setTutorialQuestion(randomQ);
        
        // Get pictograms for tutorial
        const loadPictos = async () => {
            const pictos = await Controller.extractSuggestedPictograms("Cosa vuoi per cena?");
            if (pictos) setTutorialPictos(pictos.slice(0, 4));
        };
        loadPictos();
    }, []);

    // Load answer pictograms when question changes
    useEffect(() => {
        const loadAnswers = async () => {
            const pictos: Pictogram[] = [];
            for (const ans of tutorialQuestion.answers) {
                const p = await Controller.extractSuggestedPictograms(ans);
                if (p && p[0]) pictos.push(p[0]);
            }
            setAnswerPictos(pictos);
        };
        if (tutorialQuestion.answers.length > 0) loadAnswers();
    }, [tutorialQuestion]);

    const nextStep = () => {
        setCurrentStep((prev) => prev + 1);
        // Reset tutorial hints when moving to next step
        setShowPictoHints(false);
        setShowTextHints(false);
        setShowQuestionHints(false);
    };
    
    const handleFinish = () => {
        // Save settings
        Controller.setSettings({
            fontSize,
            hairColor,
            skinColor,
            theme: 'light'
        });
        localStorage.setItem('welcomeCompleted', 'true');
        window.location.hash = '/';
        window.location.reload();
    };

    const face = 'https://api.arasaac.org/v1/pictograms/2684?color=true&skin=';
    const hair = 'https://api.arasaac.org/v1/pictograms/38535?hair=';

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { duration: 0.5, ease: "easeOut" }
        },
        exit: { 
            opacity: 0, 
            y: -20,
            transition: { duration: 0.3 }
        }
    };

    const logoVariants = {
        initial: { scale: 0, rotate: -180 },
        animate: { 
            scale: 1, 
            rotate: 0,
            transition: { type: "spring", stiffness: 200, damping: 15 }
        }
    };

    const renderWelcome = () => (
        <motion.div key="welcome" variants={containerVariants} initial="hidden" animate="visible" exit="exit">
            <Space direction="vertical" size="middle" style={{ width: '100%', textAlign: 'center' }}>
                <motion.div variants={logoVariants} initial="initial" animate="animate">
                    <Avatar size={100} icon={<RocketOutlined />} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }} />
                </motion.div>
                <Title level={3}>Benvenuto! 👋</Title>
                <Text type="secondary">Configura in pochi step</Text>
                <Button type="primary" size="large" block icon={<ArrowRightOutlined />} onClick={nextStep}>Inizia</Button>
            </Space>
        </motion.div>
    );

    const renderFontSizeStep = () => (
        <motion.div key="fontSize" variants={containerVariants} initial="hidden" animate="visible" exit="exit">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div style={{ textAlign: 'center' }}>
                    <Avatar size={64} icon={<FontSizeOutlined />} style={{ background: '#1890ff', marginBottom: 8 }} />
                    <Title level={4}>Dimensione testo</Title>
                </div>
                <Card style={{ background: 'var(--surface)', padding: '12px' }}>
                    <Text style={{ fontSize: fontSize }}>Esempio ({fontSize}px)</Text>
                    <Slider min={12} max={24} value={fontSize} onChange={setFontSize} marks={{ 12: '12', 18: '18', 24: '24' }} style={{ marginTop: 12 }} />
                </Card>
                <Button type="primary" size="large" block icon={<ArrowRightOutlined />} onClick={nextStep}>Continua</Button>
            </Space>
        </motion.div>
    );

    const renderSkinColorStep = () => (
        <motion.div key="skinColor" variants={containerVariants} initial="hidden" animate="visible" exit="exit">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div style={{ textAlign: 'center' }}>
                    <Avatar size={64} icon={<UserOutlined />} style={{ background: '#52c41a', marginBottom: 8 }} />
                    <Title level={4}>Colore pelle</Title>
                    <Text type="secondary" style={{ fontSize: 13 }}>Personalizza il tuo avatar</Text>
                </div>
                <Card style={{ background: 'var(--surface)', padding: '8px' }}>
                    <div style={{ textAlign: 'center', marginBottom: 12 }}>
                        <motion.img key={skinColor} src={face + skinColor} alt="Avatar" style={{ width: 100, height: 100 }} initial={{ scale: 0.8 }} animate={{ scale: 1 }} />
                    </div>
                    <Row gutter={[8, 8]}>
                        {Object.values(SkinColor).map((color) => (
                            <Col span={8} key={color}>
                                <motion.div whileTap={{ scale: 0.95 }}>
                                    <Card hoverable onClick={() => setSkinColor(color)} style={{ border: skinColor === color ? '2px solid #1890ff' : '1px solid #d9d9d9', padding: 2 }}>
                                        <img src={face + color} alt={color} style={{ width: '100%' }} />
                                    </Card>
                                </motion.div>
                            </Col>
                        ))}
                    </Row>
                </Card>
                <Button type="primary" size="large" block icon={<ArrowRightOutlined />} onClick={nextStep}>Continua</Button>
            </Space>
        </motion.div>
    );

    const renderHairColorStep = () => (
        <motion.div key="hairColor" variants={containerVariants} initial="hidden" animate="visible" exit="exit">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div style={{ textAlign: 'center' }}>
                    <Avatar size={64} icon={<BgColorsOutlined />} style={{ background: '#faad14', marginBottom: 8 }} />
                    <Title level={4}>Colore capelli</Title>
                    <Text type="secondary" style={{ fontSize: 13 }}>Completa il tuo profilo</Text>
                </div>
                <Card style={{ background: 'var(--surface)', padding: '8px' }}>
                    <div style={{ textAlign: 'center', marginBottom: 12 }}>
                        <motion.img key={hairColor} src={hair + hairColor} alt="Hair" style={{ width: 100, height: 100 }} initial={{ scale: 0.8 }} animate={{ scale: 1 }} />
                    </div>
                    <Row gutter={[8, 8]}>
                        {Object.values(HairColor).map((color) => (
                            <Col span={8} key={color}>
                                <motion.div whileTap={{ scale: 0.95 }}>
                                    <Card hoverable onClick={() => setHairColor(color)} style={{ border: hairColor === color ? '2px solid #1890ff' : '1px solid #d9d9d9', padding: 2 }}>
                                        <img src={hair + color} alt={color} style={{ width: '100%' }} />
                                    </Card>
                                </motion.div>
                            </Col>
                        ))}
                    </Row>
                </Card>
                <Button type="primary" size="large" block icon={<ArrowRightOutlined />} onClick={nextStep}>Continua</Button>
            </Space>
        </motion.div>
    );

    const renderComplete = () => (
        <motion.div key="complete" variants={containerVariants} initial="hidden" animate="visible" exit="exit">
            <Space direction="vertical" size="middle" style={{ width: '100%', textAlign: 'center' }}>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}>
                    <CheckCircleFilled style={{ fontSize: 80, color: '#52c41a' }} />
                </motion.div>
                <Title level={3}>Configurazione completa! 🎉</Title>
                <Text type="secondary">Ora vediamo come usare l'app</Text>
                <Button type="primary" size="large" block icon={<ArrowRightOutlined />} onClick={nextStep}>Tutorial</Button>
            </Space>
        </motion.div>
    );

    // Tutorial Steps
    const renderTutorialBubble = () => {
        // Create mock message for demo
        const mockMessage = {
            className: 'Message',
            id: 1,
            message: 'Ciao! Premi qui per ascoltare il messaggio 🔊',
            date: Math.floor(Date.now() / 1000),
            out: false,
            fromId: { userId: '123' }
        } as any;

        return (
            <motion.div key="tutorial-bubble" variants={containerVariants} initial="hidden" animate="visible" exit="exit" style={{ width: '100%' }}>
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <div style={{ textAlign: 'center' }}>
                        <SoundOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 8 }} />
                        <Title level={3}>Messaggio vocale</Title>
                        <Text type="secondary" style={{ fontSize: 14, display: 'block', marginBottom: 4 }}>
                            Comunicazione audio
                        </Text>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                            Premi il messaggio per ascoltare la sintesi vocale
                        </Text>
                    </div>
                    <div style={{ background: 'var(--ios-gray-bg)', padding: '20px', borderRadius: 12 }}>
                        <ChatBubble message={mockMessage} chatWith={'0' as any} />
                    </div>
                    <Button type="primary" size="large" block icon={<ArrowRightOutlined />} onClick={nextStep}>Avanti</Button>
                </Space>
            </motion.div>
        );
    };

    const renderTutorialHintsPicto = () => {
        const mockMessage = {
            className: 'Message',
            id: 2,
            message: 'Cosa vuoi per cena? 🍽️',
            date: Math.floor(Date.now() / 1000),
            out: false,
            fromId: { userId: '123' }
        } as any;

        return (
            <motion.div key="tutorial-picto" variants={containerVariants} initial="hidden" animate="visible" exit="exit" style={{ width: '100%' }}>
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <div style={{ textAlign: 'center' }}>
                        <Title level={3}>Suggerimenti con pittogrammi</Title>
                        <Text type="secondary" style={{ fontSize: 14, display: 'block', marginBottom: 4 }}>
                            Costruisci frasi visive
                        </Text>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                            Tocca il messaggio per vedere i pittogrammi suggeriti
                        </Text>
                    </div>
                    <div style={{ background: 'var(--ios-gray-bg)', padding: '20px', borderRadius: 12 }}>
                        <ChatBubble message={mockMessage} chatWith={'0' as any} />
                        {showPictoHints && tutorialPictos.length > 0 && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }} 
                                animate={{ opacity: 1, y: 0 }}
                                style={{ marginTop: 16 }}
                            >
                                <ChatHintsPicto 
                                    pictos={tutorialPictos} 
                                    onPictoClick={() => {}}
                                />
                            </motion.div>
                        )}
                    </div>
                    {!showPictoHints ? (
                        <Button type="primary" size="large" block onClick={() => setShowPictoHints(true)}>
                            Tocca il messaggio sopra
                        </Button>
                    ) : (
                        <Button type="primary" size="large" block icon={<ArrowRightOutlined />} onClick={nextStep}>
                            Avanti
                        </Button>
                    )}
                </Space>
            </motion.div>
        );
    };

    const renderTutorialHintsText = () => {
        const mockMessage = {
            className: 'Message',
            id: 3,
            message: 'Come stai oggi? 😊',
            date: Math.floor(Date.now() / 1000),
            out: false,
            fromId: { userId: '123' }
        } as any;

        return (
            <motion.div key="tutorial-text" variants={containerVariants} initial="hidden" animate="visible" exit="exit" style={{ width: '100%' }}>
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <div style={{ textAlign: 'center' }}>
                        <Title level={3}>Frasi veloci</Title>
                        <Text type="secondary" style={{ fontSize: 14, display: 'block', marginBottom: 4 }}>
                            Risposte rapide preconfigurate
                        </Text>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                            Tocca il messaggio per vedere le frasi veloci
                        </Text>
                    </div>
                    <div style={{ background: 'var(--ios-gray-bg)', padding: '20px', borderRadius: 12 }}>
                        <ChatBubble message={mockMessage} chatWith={'0' as any} />
                        {showTextHints && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }} 
                                animate={{ opacity: 1, y: 0 }}
                                style={{ marginTop: 16, maxHeight: '250px', overflowY: 'auto' }}
                            >
                                <ChatHints 
                                    hints={Controller.getHints().slice(0, 5)}
                                    onHintClick={() => {}}
                                />
                            </motion.div>
                        )}
                    </div>
                    {!showTextHints ? (
                        <Button type="primary" size="large" block onClick={() => setShowTextHints(true)}>
                            Tocca il messaggio sopra
                        </Button>
                    ) : (
                        <Button type="primary" size="large" block icon={<ArrowRightOutlined />} onClick={nextStep}>
                            Avanti
                        </Button>
                    )}
                </Space>
            </motion.div>
        );
    };

    const renderTutorialQuestion = () => {
        const mockMessage = {
            className: 'Message',
            id: 4,
            message: tutorialQuestion.question,
            date: Math.floor(Date.now() / 1000),
            out: false,
            fromId: { userId: '123' }
        } as any;

        return (
            <motion.div key="tutorial-question" variants={containerVariants} initial="hidden" animate="visible" exit="exit" style={{ width: '100%' }}>
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <div style={{ textAlign: 'center' }}>
                        <Title level={3}>Domanda e risposta</Title>
                        <Text type="secondary" style={{ fontSize: 14, display: 'block', marginBottom: 4 }}>
                            Rispondi facilmente alle domande
                        </Text>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                            Tocca il messaggio per vedere le risposte suggerite
                        </Text>
                    </div>
                    <div style={{ background: 'var(--ios-gray-bg)', padding: '20px', borderRadius: 12 }}>
                        <ChatBubble message={mockMessage} chatWith={'0' as any} />
                        {showQuestionHints && answerPictos.length > 0 && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }} 
                                animate={{ opacity: 1, y: 0 }}
                                style={{ marginTop: 16 }}
                            >
                                <ChatHintsPicto 
                                    pictos={answerPictos}
                                    onPictoClick={() => {}}
                                />
                            </motion.div>
                        )}
                    </div>
                    {!showQuestionHints ? (
                        <Button type="primary" size="large" block onClick={() => setShowQuestionHints(true)}>
                            Tocca il messaggio sopra
                        </Button>
                    ) : (
                        <Button type="primary" size="large" block icon={<ArrowRightOutlined />} onClick={nextStep}>
                            Avanti
                        </Button>
                    )}
                </Space>
            </motion.div>
        );
    };

    const renderFinalStep = () => (
        <motion.div key="final" variants={containerVariants} initial="hidden" animate="visible" exit="exit">
            <Space direction="vertical" size="middle" style={{ width: '100%', textAlign: 'center' }}>
                <CheckCircleFilled style={{ fontSize: 80, color: '#52c41a' }} />
                <Title level={3}>Sei pronto! 🚀</Title>
                <Text>Inizia a comunicare con PictoChat!</Text>
                <Button type="primary" size="large" block icon={<ArrowRightOutlined />} onClick={handleFinish}>Vai ai Contatti</Button>
            </Space>
        </motion.div>
    );

    return (
        <PageLayout title="Configurazione" footer={null}>
            <div className="login-wrap" style={{ 
                minHeight: 'auto', 
                padding: currentStep >= 5 ? '0' : '0 8px',
                maxWidth: currentStep >= 5 ? '100%' : '480px',
                margin: '0 auto'
            }}>
                {/* Progress Steps - Only numbers */}
                <div style={{ marginBottom: 16, padding: currentStep >= 5 ? '0 16px' : '0' }}>
                    <Steps
                        current={currentStep}
                        size="small"
                        direction="horizontal"
                        responsive={false}
                        items={[
                            { title: '1' },
                            { title: '2' },
                            { title: '3' },
                            { title: '4' },
                            { title: '5' },
                            { title: '6' },
                            { title: '7' },
                            { title: '8' },
                            { title: '9' }
                        ]}
                    />
                </div>

                <Card 
                    bordered={false}
                    style={{ 
                        background: 'var(--surface)',
                        boxShadow: currentStep >= 5 ? 'none' : 'var(--shadow-md)',
                        borderRadius: currentStep >= 5 ? 0 : 16,
                        padding: currentStep >= 5 ? '24px 16px' : '16px'
                    }}
                >
                    <AnimatePresence mode="wait">
                        {currentStep === 0 && renderWelcome()}
                        {currentStep === 1 && renderFontSizeStep()}
                        {currentStep === 2 && renderSkinColorStep()}
                        {currentStep === 3 && renderHairColorStep()}
                        {currentStep === 4 && renderComplete()}
                        {currentStep === 5 && renderTutorialBubble()}
                        {currentStep === 6 && renderTutorialHintsPicto()}
                        {currentStep === 7 && renderTutorialHintsText()}
                        {currentStep === 8 && renderTutorialQuestion()}
                        {currentStep === 9 && renderFinalStep()}
                    </AnimatePresence>
                </Card>
            </div>
        </PageLayout>
    );
};

export default WelcomePage;
