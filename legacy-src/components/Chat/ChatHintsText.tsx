import React from 'react';
import { List } from 'antd';
import { motion } from 'framer-motion';
import { Controller, Hint } from '../../lib/Controller';
import { PictogramImage } from '../Other/PictogramImage';

interface ChatHintsProps {
    hints: Hint[];
    onHintClick: (text: string) => void;
}

const ChatHints: React.FC<ChatHintsProps> = ({ hints, onHintClick }) => {
    const handleClick = (text: string) => {
        onHintClick(text);
    };

    const renderIcon = (icon: string) => {
        let pictogram = Controller.extractPictograms(icon);
        if (pictogram && pictogram[0]) {
            return <PictogramImage picto={pictogram[0]} height={79} width={70} text={false} />;
        }
        return <span>{icon}</span>;
    };

    return (
        <List
            dataSource={hints}
            renderItem={(hint) => (
                <motion.div
                    onClick={() => handleClick(hint.text)}
                    whileTap={{ scale: 0.9 }}
                    style={{
                        display: 'flex',
                        alignItems: 'center', // Centra il contenuto verticalmente
                        justifyContent: 'space-between',
                        padding: '8px 0',
                        cursor: 'pointer',
                    }}
                >
                    <span style={{ marginRight: '1rem', flex: 1, textAlign: 'left' }}>
                        {hint.text}
                    </span>
                    <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                        {renderIcon(hint.icon)}
                    </div>
                </motion.div>
            )}
        />
    );
};

export default ChatHints;
