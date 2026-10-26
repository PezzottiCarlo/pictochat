import React from 'react';
import { Card } from 'antd';
import { Pictogram } from '../../lib/AAC';
import { motion } from 'framer-motion';
import { PictogramImage } from '../Other/PictogramImage';

interface ChatHintsPictoProps {
    pictos: Pictogram[];
    onPictoClick: (picto: Pictogram) => void;
}

const ChatHintsPicto: React.FC<ChatHintsPictoProps> = ({ pictos, onPictoClick }) => {

    const handlePictoClick = (picto: any) => {
        onPictoClick(picto);
    }

    return (
        <div style={{ display: 'flex', overflowX: 'auto', overflowY: "hidden", whiteSpace: 'nowrap', padding: '10px' }}>
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
                        cover={<PictogramImage picto={picto} width={100} height={100} />}
                    />
                </motion.div>
            ))}
        </div>
    );
};

export default ChatHintsPicto;
