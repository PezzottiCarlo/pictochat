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
}

const DialogAvatar: React.FC<DialogAvatarProps> = ({ unreadedMessages, name, imageBuffer, badge, size, aac, hairColor, skinColor }) => {
    const renderAvatar = () => {
        const aacLink = `https://api.arasaac.org/v1/pictograms/31807?resolution=2500&skin=${skinColor}&hair=${hairColor}&download=false`;
        if(aac){
            return (
                (badge) ?
                    <Badge count={unreadedMessages} size="small">
                        <Avatar src={aacLink} size={size} style={{ marginRight: '10px' }} />
                    </Badge>
                    :
                    <Avatar src={aacLink} size={size} style={{ marginRight: '10px' }} />
            );
        }

        const base64String = (imageBuffer) ? Buffer.from(imageBuffer).toString('base64') : null;
        const imageSrc = `data:image/png;base64,${base64String}`;
        if (imageBuffer) {
            if (imageBuffer.data) {
                if (imageBuffer.data.length === 0)
                    return (
                        (badge) ?
                            <Badge count={unreadedMessages} size="small">
                                <Avatar style={{ backgroundColor: Utils.charToColor(name.charAt(0).toUpperCase()) }} size={size}>{name.charAt(0).toUpperCase()}</Avatar>
                            </Badge>
                            :
                            <Avatar style={{ backgroundColor: Utils.charToColor(name.charAt(0).toUpperCase()) }} size={size}>{name.charAt(0).toUpperCase()}</Avatar>
                    );
            }
            return (
                (badge) ?
                    <Badge count={unreadedMessages} size="small">
                        <Avatar src={imageSrc} size={size} style={{ marginRight: '10px' }} />
                    </Badge>
                    :
                    <Avatar src={imageSrc} size={size} style={{ marginRight: '10px' }} />
            )
        }
        return <Avatar src={
            <Spin />
        } size={size} style={{ marginRight: '10px' }} />;
    }

    return (
        renderAvatar()
    );
}

export default DialogAvatar;
