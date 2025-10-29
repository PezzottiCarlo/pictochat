import { List, Flex, Typography } from 'antd';
import React, { useEffect } from 'react';
import DialogAvatar from './DialogAvatar';
import { Dialog } from 'telegram/tl/custom/dialog';
import Utils from '../../lib/Utils';
import { Controller } from '../../lib/Controller';
import { Api } from 'telegram';
import { router } from '../../routes/AppRoutes';

interface DialogItemProps {
    dialog: Dialog;
    // Accessibility/large UI tuning (optional)
    avatarSize?: number; // default 100
    titleSize?: number;  // px, default 18
    descSize?: number;   // px, default 14
    timeSize?: number;   // px, default 14
}

const DialogItem: React.FC<DialogItemProps> = ({ dialog, avatarSize = 100, titleSize = 18, descSize = 14, timeSize = 14 }) => {

    const [photo, setPhoto] = React.useState<Buffer>();
    const { id, name, date, message,entity } = dialog;
    const status = (entity as any).status;
    useEffect(() => {
        const fetchProfilePic = async () => {
            if (!id) return;
            const photo = await Controller.getProfilePic(id);
            setPhoto(photo);
        };
        fetchProfilePic();
    }, [id]);

    const handleClick = (id: bigInt.BigInteger|undefined) => {
        if (!id) return;
        Controller.markAsReadLocal(id);
        router.navigate(`/chat/${id}`,{state:Utils.serializeDialog(dialog)});
    };

    const formatDate = (date: number) => {
        const d = new Date(date * 1000);
        //return hh:mm with two digits
        return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    };

    const shortMessage = (message: Api.Message | undefined) => {
        if (!message) return '';
        if (message.message) {
            return message.message.length > 20 ? message.message.slice(0, 20) + '...' : message.message;
        } else if (message.media) {
            return 'Media';
        }
        return '';
    }

    return (
        <List.Item
            onClick={() => handleClick(id)}
            role="button"
            tabIndex={0}
            aria-label={`Apri chat con ${name}`}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(id); }}
            style={{ 
                padding: '12px 16px', 
                cursor: 'pointer',
                transition: 'background 0.2s',
                borderRadius: 12,
                margin: '4px 8px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--ios-gray-light)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
            <Flex align="center" justify='space-between' style={{ width: '100%', gap: 12 }} >
                <List.Item.Meta
                    style={{ alignItems:"center", minWidth: 0, flex: 1 }}
                    avatar={DialogAvatar({ 
                        unreadedMessages: dialog.unreadCount, 
                        name: (dialog.name as string) || 'Chat',
                        imageBuffer: photo, 
                        badge: true,
                        size: avatarSize,
                        isOnline: status === 'UserStatusOnline' 
                    })}
                    title={
                        <Typography.Text 
                            strong 
                            ellipsis 
                            style={{ fontSize: titleSize, fontWeight: 600, color: 'var(--ios-text)' }}
                        >
                            {name || 'Chat'}
                        </Typography.Text>
                    }
                    description={
                        <Typography.Text 
                            ellipsis 
                            style={{ fontSize: descSize, color: 'var(--ios-text-secondary)' }}
                        >
                            {shortMessage(message)}
                        </Typography.Text>
                    }
                />
                <Typography.Text 
                    style={{ 
                        fontSize: timeSize, 
                        color: 'var(--ios-text-secondary)',
                        whiteSpace: 'nowrap'
                    }}
                >
                    {formatDate(date)}
                </Typography.Text>
            </Flex>
        </List.Item>
    );
};

export default DialogItem;