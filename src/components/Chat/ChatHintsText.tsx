import React from 'react';
import { List } from 'antd';
import { motion } from 'framer-motion';

type Hint = {
    text: string;
    emoji: string;
}

interface ChatHintsProps {
    hints: Hint[];
    onHintClick: (text: string) => void;
}

const ChatHints: React.FC<ChatHintsProps> = ({ hints, onHintClick }) => {
    const handleClick = (text: string) => {
        onHintClick(text); 
    };

    return (
        <List
            dataSource={hints}
            renderItem={(hint) => (
                <motion.div
                    onClick={() => handleClick(hint.text)}
                    whileTap={{ scale: 0.9 }}
                    style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', cursor: 'pointer' }}>
                    <span style={{ marginRight: '1rem' }}>{hint.text}</span>
                    <span>{hint.emoji}</span>
                </motion.div>
            )}
        />
    );
}

export default ChatHints;
