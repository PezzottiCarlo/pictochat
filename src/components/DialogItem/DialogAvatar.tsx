import React from 'react';
import { Avatar, Badge, Spin } from 'antd';
import Utils from '../../lib/Utils';

interface DialogAvatarProps {
    unreadedMessages: number;
    name: string;
    imageBuffer: any;
    badge: boolean;
}

const DialogAvatar: React.FC<DialogAvatarProps> = ({ unreadedMessages, name, imageBuffer, badge }) => {

    const base64String = (imageBuffer) ? Buffer.from(imageBuffer).toString('base64') : null;
    const imageSrc = `data:image/png;base64,${base64String}`;

    const renderAvatar = () => {
        if (imageBuffer) {
            if (imageBuffer.data) {
                if (imageBuffer.data.length === 0)
                    return (
                        (badge) ?
                            <Badge count={unreadedMessages} size="small">
                                <Avatar style={{ backgroundColor: Utils.charToColor(name.charAt(0).toUpperCase()) }} size={100}>{name.charAt(0).toUpperCase()}</Avatar>
                            </Badge>
                            :
                            <Avatar style={{ backgroundColor: Utils.charToColor(name.charAt(0).toUpperCase()) }} size={100}>{name.charAt(0).toUpperCase()}</Avatar>
                    );
            }
            return (
                (badge) ?
                    <Badge count={unreadedMessages} size="small">
                        <Avatar src={imageSrc} size={100} style={{ marginRight: '10px' }} />
                    </Badge>
                    :
                    <Avatar src={imageSrc} size={100} style={{ marginRight: '10px' }} />
            )
        }
        return <Avatar src={
            <Spin />
        } size={100} style={{ marginRight: '10px' }} />;
    }

    return (
        renderAvatar()
    );
}

export default DialogAvatar;
