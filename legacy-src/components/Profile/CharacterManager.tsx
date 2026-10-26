import { Card, Row, Col, Typography, Avatar } from "antd";
import { UserOutlined, BgColorsOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { HairColor, SkinColor } from "../../lib/AAC";
import { useState } from "react";

const { Title, Text } = Typography;

interface CharacterManagerProps {
    callback: (hairColor: HairColor, skinColor: SkinColor) => void;
    currentHairColor: HairColor | undefined;
    currentSkinColor: SkinColor | undefined;
}

export const CharacterManager: React.FC<CharacterManagerProps> = ({ callback, currentHairColor, currentSkinColor }) => {
    const [hairColor, setHairColor] = useState<HairColor>(currentHairColor || HairColor.BLACK);
    const [skinColor, setSkinColor] = useState<SkinColor>(currentSkinColor || SkinColor.WHITE);

    const face = 'https://api.arasaac.org/v1/pictograms/2684?color=true&skin=';
    const hair = 'https://api.arasaac.org/v1/pictograms/38535?hair=';

    const handleHairColorChange = (value: HairColor) => {
        setHairColor(value);
        callback(value, skinColor);
    };

    const handleSkinColorChange = (value: SkinColor) => {
        setSkinColor(value);
        callback(hairColor, value);
    };

    return (
        <div>
            {/* Skin Color Section */}
            <div style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <Avatar size={40} icon={<UserOutlined />} style={{ background: '#52c41a' }} />
                    <div>
                        <Title level={5} style={{ margin: 0, fontSize: 18 }}>Colore pelle</Title>
                        <Text type="secondary" style={{ fontSize: 13 }}>Personalizza il tuo avatar</Text>
                    </div>
                </div>
                <div style={{ textAlign: 'center', marginBottom: 12 }}>
                    <motion.img 
                        key={skinColor} 
                        src={face + skinColor} 
                        alt="Avatar" 
                        style={{ width: 100, height: 100 }} 
                        initial={{ scale: 0.8 }} 
                        animate={{ scale: 1 }} 
                    />
                </div>
                <Row gutter={[8, 8]}>
                    {Object.values(SkinColor).map((color) => (
                        <Col span={8} key={color}>
                            <motion.div whileTap={{ scale: 0.95 }}>
                                <Card 
                                    hoverable 
                                    onClick={() => handleSkinColorChange(color)} 
                                    style={{ 
                                        border: skinColor === color ? '2px solid #1890ff' : '1px solid #d9d9d9', 
                                        padding: 2,
                                        cursor: 'pointer'
                                    }}
                                    bodyStyle={{ padding: 0 }}
                                >
                                    <img src={face + color} alt={color} style={{ width: '100%', display: 'block' }} />
                                </Card>
                            </motion.div>
                        </Col>
                    ))}
                </Row>
            </div>

            {/* Hair Color Section */}
            <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <Avatar size={40} icon={<BgColorsOutlined />} style={{ background: '#faad14' }} />
                    <div>
                        <Title level={5} style={{ margin: 0, fontSize: 18 }}>Colore capelli</Title>
                        <Text type="secondary" style={{ fontSize: 13 }}>Completa il tuo profilo</Text>
                    </div>
                </div>
                <div style={{ textAlign: 'center', marginBottom: 12 }}>
                    <motion.img 
                        key={hairColor} 
                        src={hair + hairColor} 
                        alt="Hair" 
                        style={{ width: 100, height: 100 }} 
                        initial={{ scale: 0.8 }} 
                        animate={{ scale: 1 }} 
                    />
                </div>
                <Row gutter={[8, 8]}>
                    {Object.values(HairColor).map((color) => (
                        <Col span={8} key={color}>
                            <motion.div whileTap={{ scale: 0.95 }}>
                                <Card 
                                    hoverable 
                                    onClick={() => handleHairColorChange(color)} 
                                    style={{ 
                                        border: hairColor === color ? '2px solid #1890ff' : '1px solid #d9d9d9', 
                                        padding: 2,
                                        cursor: 'pointer'
                                    }}
                                    bodyStyle={{ padding: 0 }}
                                >
                                    <img src={hair + color} alt={color} style={{ width: '100%', display: 'block' }} />
                                </Card>
                            </motion.div>
                        </Col>
                    ))}
                </Row>
            </div>
        </div>
    );
};
