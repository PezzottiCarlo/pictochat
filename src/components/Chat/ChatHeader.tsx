import React, { useEffect, useState } from 'react';
import { Layout, Button, Typography, Flex } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import DialogAvatar from '../DialogItem/DialogAvatar';
import { Dialog } from "telegram/tl/custom/dialog";
import { Controller } from '../../lib/Controller';

interface ChatHeaderProps {
    id: bigInt.BigInteger;
}

const { Header } = Layout;
const { Text } = Typography;

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
        <Header style={{ padding: "0 .5rem" }}>
            <Flex align="center" justify='space-between' style={{ width: '100%' }} >
                <Button type="text" icon={<ArrowLeftOutlined />} onClick={handleGoBack} />
                <Text ellipsis style={{ maxWidth: 200, fontWeight: 'bold' }}>{dialog?.name}</Text>
                <DialogAvatar badge={false} imageBuffer={photo} name={dialog?.name as string} unreadedMessages={0} size={60} />
            </Flex>
        </Header>
    );
};

export default ChatHeader;
