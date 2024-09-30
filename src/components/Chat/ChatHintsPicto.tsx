import React from 'react';
import { Card } from 'antd';
import { Pictogram } from '../../lib/AAC';
import { motion } from 'framer-motion';

interface ChatHintsPictoProps {
    pictos: Pictogram[];
    onPictoClick: (picto: Pictogram) => void;
}

const ChatHintsPicto: React.FC<ChatHintsPictoProps> = ({ pictos, onPictoClick }) => {

    const handlePictoClick = (picto: any) => {
        picto.word = picto.keywords[0].keyword;
        onPictoClick(picto);
    }

    return (
        <div style={{ display: 'flex', overflowX: 'auto', overflowY:"hidden", whiteSpace: 'nowrap', padding: '10px' }}>
            {pictos.map((picto, index) => (
                <motion.div
                    key={index}
                    style={{ display: 'inline-block', marginRight: '10px', textAlign: 'center', width: '100px', height: '100px' }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handlePictoClick(picto)}
                >
                    <Card
                        style={{ width: '100px', height: '100px' }}
                        hoverable
                        cover={<img alt={`Pictogram ${index}`} src={picto.url} />}
                    />
                </motion.div>
            ))}
        </div>
    );
};

export default ChatHintsPicto;
