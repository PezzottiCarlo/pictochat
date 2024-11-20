import React from 'react';
import { Avatar, Badge, Spin } from 'antd';
import Utils from '../../lib/Utils';
import { HairColor, SkinColor } from '../../lib/AAC';

interface DialogAvatarProps {
    unreadedMessages: number;
    name: string;
    imageBuffer: any;
    badge: boolean;
    size: number;
    aac?: boolean;
    hairColor?: HairColor;
    skinColor?: SkinColor;
    isOnline?: boolean;
}

const DialogAvatar: React.FC<DialogAvatarProps> = ({ unreadedMessages, name, imageBuffer, badge, size, aac, hairColor, skinColor, isOnline }) => {
    const renderAvatar = () => {
        const aacLink = `https://api.arasaac.org/v1/pictograms/31807?resolution=2500&skin=${skinColor}&hair=${hairColor}&download=false`;
        const avatarElement = (src?: string) => {
            const avatar = src ? (
                <Avatar src={src} size={size}/>
            ) : (
                <Avatar style={{ backgroundColor: Utils.charToColor(name.charAt(0).toUpperCase()) }} size={size}>
                    {name.charAt(0).toUpperCase()}
                </Avatar>
            );
            
            return (
                (badge) ?
                    <Badge count={unreadedMessages} size="small">
                        {avatar}
                    </Badge>
                    : avatar
            );
        };

        if (aac) {
            return avatarElement(aacLink);
        }

        const base64String = imageBuffer ? Buffer.from(imageBuffer).toString('base64') : null;
        const imageSrc = base64String ? `data:image/png;base64,${base64String}` : undefined;

        if (imageBuffer && imageBuffer.data && imageBuffer.data.length === 0) {
            return avatarElement();
        }

        return imageSrc ? avatarElement(imageSrc) : (
            <Avatar src={<Spin />} size={size} />
        );
    };

    return (
        <Badge
            status='success'
            dot={isOnline}
            offset={[0,100]}
            >
            {renderAvatar()}
        </Badge>
    );
}

export default DialogAvatar;
