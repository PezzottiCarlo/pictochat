import { List, Avatar, Flex } from 'antd';
import React, { useEffect } from 'react';
import DialogAvatar from './DialogAvatar';
import { Dialog } from 'telegram/tl/custom/dialog';
import Utils from '../../lib/Utils';
import { Controller } from '../../lib/Controller';
import { Api } from 'telegram';
import { router } from '../../routes/AppRoutes';

interface DialogItemProps {
    dialog: Dialog;
}

const DialogItem: React.FC<DialogItemProps> = ({ dialog }) => {

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
        console.log('status',status);
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
        <List.Item onClick={() => handleClick(id)}>
            <Flex align="center" justify='center' style={{ width: '100%'}} >
                <List.Item.Meta
                    style={{alignItems:"center" }}
                    avatar={DialogAvatar({ unreadedMessages:dialog.unreadCount, name:dialog.name as string,imageBuffer: photo, badge:true,size:100,isOnline:status === 'UserStatusOnline' })}
                    title={name}
                    description={shortMessage(message)}
                />
                <span>{formatDate(date)}</span>
            </Flex>
        </List.Item>
    );
};

export default DialogItem;
