import React from 'react';
import { Avatar, Badge } from 'antd';
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
            // Safe fallback for undefined/null name
            const safeName = name || '?';
            const firstChar = safeName.charAt(0).toUpperCase();
            
            const avatar = src ? (
                <Avatar src={src} size={size}/>
            ) : (
                <Avatar style={{ backgroundColor: Utils.charToColor(firstChar) }} size={size}>
                    {firstChar}
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

        // Normalize image buffer into a data URL if possible
        let imageSrc: string | undefined;
        try {
            if (typeof imageBuffer === 'string') {
                imageSrc = imageBuffer;
            } else if (imageBuffer && (imageBuffer as any).byteLength !== undefined) {
                // ArrayBuffer or Buffer
                const ab: ArrayBuffer = (imageBuffer as any).buffer ?
                    // Buffer-like
                    (imageBuffer as any).buffer.slice((imageBuffer as any).byteOffset, (imageBuffer as any).byteOffset + (imageBuffer as any).byteLength)
                    : (imageBuffer as ArrayBuffer);
                const bytes = new Uint8Array(ab);
                let binary = '';
                for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
                imageSrc = `data:image/png;base64,${btoa(binary)}`;
            }
        } catch {}

        if (imageBuffer && (imageBuffer as any).data && (imageBuffer as any).data.length === 0) {
            return avatarElement();
        }

        // If imageBuffer is null/undefined or could not be parsed, show letter avatar
        if (!imageBuffer || !imageSrc) {
            return avatarElement();
        }

        return avatarElement(imageSrc);
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
