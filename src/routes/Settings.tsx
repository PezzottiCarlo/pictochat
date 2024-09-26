import React, { useEffect, useState } from 'react';
import { Button, Select, Radio, Slider, Image } from 'antd';
import 'antd/dist/reset.css';
import '../styles/SettingPage.css';
import { HairColor, SkinColor } from '../lib/AAC';
import { motion, useMotionValue } from 'framer-motion';
import { themeConfig } from '..';
import { CirculaCheckMark } from '../components/CircularCheckMark/CirculaCheckMark';
import { router } from './AppRoutes';

const { Option } = Select;

const SettingsPage: React.FC = () => {
    const [currentStep, setCurrentStep] = useState(-1);
    const [fontSize, setFontSize] = useState(14);
    const [hairColor, setHairColor] = useState<HairColor | null>(null);
    const [skinColor, setSkinColor] = useState<SkinColor | null>(null);
    const [theme, setTheme] = useState<string>('light'); // Default light theme
    let progress = useMotionValue(90);

    useEffect(() => {
        document.body.style.fontSize = `${fontSize}px`;
    }, [fontSize]);

    const nextStep = () => setCurrentStep((prev) => prev + 1);
    const nextPage = () =>{
        router.navigate('/login');
    }
    const handleFinish = () => {
        nextStep();
        console.log('Impostazioni finali:', { fontSize, hairColor, skinColor, theme });
    };

    const face = 'https://api.arasaac.org/v1/pictograms/2684?color=true&skin=';
    const hair = 'https://api.arasaac.org/v1/pictograms/38535?hair=';

    const renderFontSizeStep = () => (
        <div className="settings-content">
            <h2>Dimensione del font</h2>
            <Slider
                min={12}
                max={24}
                value={fontSize}
                onChange={(value) => setFontSize(value)}
                tooltip={{ open: true }}
            />
            <Button type="primary" block onClick={nextStep} style={{ marginTop: '20px' }}>
                Conferma
            </Button>
        </div>
    );

    const renderHairColorStep = () => (
        <div className="settings-content">
            <h2>Colore dei capelli</h2>
            <Select
                value={hairColor}
                onChange={(value) => setHairColor(value as HairColor)}
                style={{ width: '100%' }}
                placeholder="Seleziona un colore"
            >
                {Object.values(HairColor).map((color) => (
                    <Option key={color} value={color}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img
                                src={hair + color}
                                alt={color}
                                style={{ width: 50, height: 50 }} // Ridotto a 50x50
                            />
                        </div>
                    </Option>
                ))}
            </Select>
            <Button type="primary" block onClick={nextStep} style={{ marginTop: '20px' }}>
                Conferma
            </Button>
        </div>
    );

    const renderSkinColorStep = () => (
        <div className="settings-content">
            <h2>Colore della pelle</h2>
            <Select
                value={skinColor}
                onChange={(value) => setSkinColor(value as SkinColor)}
                style={{ width: '100%' }}
                placeholder="Seleziona un colore"
            >
                {Object.values(SkinColor).map((color) => (
                    <Option key={color} value={color}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img
                                src={face + color}
                                alt={color}
                                style={{ width: 50, height: 50 }} // Ridotto a 50x50
                            />
                        </div>
                    </Option>
                ))}
            </Select>
            <Button type="primary" block onClick={nextStep} style={{ marginTop: '20px' }}>
                Conferma
            </Button>
        </div>
    );

    const renderThemeStep = () => (
        <div className="settings-content">
            <h2>Seleziona il tema</h2>
            <Radio.Group
                onChange={(e) => setTheme(e.target.value)}
                value={theme}
                style={{ width: '100%' }}
            >
                <Radio.Button value="light" style={{ width: '100%', textAlign: 'center' }}>
                    Light
                </Radio.Button>
                <Radio.Button
                    value="dark"
                    style={{ width: '100%', textAlign: 'center', marginTop: '10px' }}
                >
                    Dark
                </Radio.Button>
                <Radio.Button
                    value="high-contrast"
                    style={{ width: '100%', textAlign: 'center', marginTop: '10px' }}
                >
                    High Contrast
                </Radio.Button>
            </Radio.Group>
            <Button type="primary" block onClick={handleFinish} style={{ marginTop: '20px' }}>
                Conferma
            </Button>
        </div>
    );

    const renderOK = () => {
        return (
            <div className="ok-content">
                <CirculaCheckMark duration={.7} />
                <h2>Congratulazioni! Le tue impostazioni sono state salvate con successo.</h2>
                <Button type="primary" style={{ marginTop: '20px' }} onClick={nextPage}>
                    Ultimo passo
                </Button>
            </div>
        );
    };

    const renderWelcome = () => {
        return (
            <div className="welcome-content">
                <Image src="https://api.arasaac.org/v1/pictograms/2485?color=false" width={150} />
                <h1>Personalizziamo il tuo profilo</h1>
                <Button type="primary" style={{ marginTop: '20px' }} onClick={nextStep}>
                    Iniziamo
                </Button>
            </div>
        );
    };

    // Applica il tema selezionato con il ConfigProvider di Ant Design
    return (
        <div className="settings-page">
            {currentStep === -1 && renderWelcome()}
            {currentStep === 0 && renderFontSizeStep()}
            {currentStep === 1 && renderSkinColorStep()}
            {currentStep === 2 && renderHairColorStep()}
            {currentStep === 3 && renderThemeStep()}
            {currentStep === 4 && renderOK()}
        </div>
    );
};

export default SettingsPage;
