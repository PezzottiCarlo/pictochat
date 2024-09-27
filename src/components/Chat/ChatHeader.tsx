import React, { useEffect, useState } from 'react';
import { Layout, Avatar, Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import DialogAvatar from '../DialogItem/DialogAvatar';
import { Dialog } from "telegram/tl/custom/dialog";
import { Controller } from '../../lib/Controller';

interface ChatHeaderProps {
    id: bigInt.BigInteger;
}

const { Header } = Layout;

const ChatHeader: React.FC<ChatHeaderProps> = ({ id }) => {
    const [dialog, setDialog] = useState<Dialog | null>(null);
    const [photo, setPhoto] = useState<Buffer>();

    useEffect(() => {
        const fetchDialog = async () => {
            try {
                const dialog = await Controller.getDialog(id);
                setDialog(dialog);
                if (dialog) {
                    const photo = await Controller.getProfilePic(dialog.id as bigInt.BigInteger);
                    setPhoto(photo);
                }
            } catch (error) {
                console.error('Failed to fetch dialog:', error);
            }
        };
        fetchDialog();
    }, [id]);

    const handleGoBack = () => {
        window.history.back();
    };

    return (
        <div className="chat-header" style={styles.container}>
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={handleGoBack} style={styles.backButton} />

            <div style={styles.contactInfo}>
                <span style={styles.contactName}>{dialog?.name}</span>
            </div>

            <div style={styles.avatarContainer}>
                <DialogAvatar badge={false} imageBuffer={photo} name={dialog?.name as string} unreadedMessages={0} size={60} />
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '60px',
        borderBottom: '1px solid #e8e8e8', // Sottolineatura
        padding: "3rem .6rem",
    },
    backButton: {
        fontSize: '18px',
        color: '#1890ff', // Colore del pulsante
    },
    avatarContainer: {
        flex: '0 0 auto',
        marginRight: '10px',
    },
    contactInfo: {
        overflow: 'hidden',
        textOverflow: 'ellipsis'
    },
    contactName: {
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#333', // Colore del testo del nome del contatto
    },
};

export default ChatHeader;
