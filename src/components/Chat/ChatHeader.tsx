import React, { useEffect, useMemo, useState } from 'react';
import { Layout, Button, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import DialogAvatar from '../DialogItem/DialogAvatar';
import { Dialog } from "telegram/tl/custom/dialog";
import { Controller } from '../../lib/Controller';
import { useNavigate } from 'react-router-dom';

interface ChatHeaderProps {
    id: bigInt.BigInteger;
}

const { Header } = Layout;
const { Text } = Typography;

const ChatHeader: React.FC<ChatHeaderProps> = ({ id }) => {
    const navigate = useNavigate();
    const [dialog, setDialog] = useState<Dialog | null>(null);
    const [photo, setPhoto] = useState<Buffer>();
    const [previewOpen, setPreviewOpen] = useState(false);
    const AVATAR_SIZE = 66; // 1.5x rispetto a 44

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

    const photoSrc = useMemo(() => {
        try {
            const buf: any = photo as any;
            if (!buf) return undefined;
            const ab: ArrayBuffer = buf.buffer ? buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) : (buf as ArrayBuffer);
            const bytes = new Uint8Array(ab);
            let binary = '';
            for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
            return `data:image/png;base64,${btoa(binary)}`;
        } catch {
            return undefined;
        }
    }, [photo]);

    const handleGoBack = () => {
        // Use router navigation to avoid being blocked by in-flight async work
        navigate(-1);
    };

    return (
        <Header
            style={{
                padding: '6px 12px',
                background: 'var(--ios-gray-bg)',
                color: 'var(--ios-text)',
                position: 'sticky',
                top: 0,
                zIndex: 10,
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                height: AVATAR_SIZE + 20,
                lineHeight: `${AVATAR_SIZE}px`,
            }}
        >
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: `${AVATAR_SIZE}px 1fr ${AVATAR_SIZE}px`,
                    alignItems: 'center',
                    columnGap: 12,
                    width: '100%'
                }}
            >
                <div style={{ width: AVATAR_SIZE, display: 'flex', alignItems: 'center' }}>
                    <Button
                        type="text"
                        icon={<ArrowLeftOutlined style={{ fontSize: 22, color: 'var(--ios-text)' }} />}
                        onClick={handleGoBack}
                        aria-label="Indietro"
                        style={{ color: 'var(--ios-text)', padding: 0, minWidth: 36, height: 36 }}
                    />
                </div>
                <Text ellipsis style={{ fontWeight: 700, color: '#1c1c1e', fontSize: 18, textAlign: 'center' }}>
                    {dialog?.name || 'Chat'}
                </Text>
                <div
                    role="button"
                    aria-label="Apri immagine profilo"
                    onClick={async () => {
                        if (!photoSrc) return;
                        setPreviewOpen(true);
                        // while viewing, fetch higher quality photo in background
                        try {
                            const hq = await Controller.getProfilePicHQ(id);
                            if (hq) setPhoto(hq);
                        } catch {}
                    }}
                    style={{ cursor: photoSrc ? 'pointer' : 'default', display: 'flex', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}
                >
                    <DialogAvatar
                        badge={false}
                        imageBuffer={photo}
                        name={(dialog?.name as string) || 'Chat'}
                        unreadedMessages={0}
                        size={AVATAR_SIZE}
                    />
                </div>
            </div>
            {previewOpen && photoSrc && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Anteprima immagine profilo"
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.92)',
                        zIndex: 2000,
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', minHeight: 56 }}>
                        <Button
                            type="text"
                            aria-label="Chiudi"
                            onClick={() => setPreviewOpen(false)}
                            style={{ color: '#fff' }}
                        >Chiudi</Button>
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img
                            src={photoSrc}
                            alt={(dialog?.name as string) || 'Profilo'}
                            style={{
                                width: '100vw',
                                height: 'auto',
                                objectFit: 'contain', // mantieni proporzioni, riempie in larghezza
                                display: 'block'
                            }}
                        />
                    </div>
                </div>
            )}
        </Header>
    );
};

export default ChatHeader;
