import React, { useState, useEffect } from 'react';
import { Api } from 'telegram';
import { Image, Modal, Spin } from 'antd';
import { Controller } from '../../lib/Controller';
import {
    FileOutlined,
    FilePdfFilled,
    FileImageFilled,
    FileWordFilled,
    FileExcelFilled,
    FilePptFilled,
    FileZipFilled,
    FileTextFilled,
    PlayCircleFilled,
    AudioFilled
} from '@ant-design/icons';
import DialogAvatar from '../DialogItem/DialogAvatar';

interface MediaProps {
    message: Api.Message;
}

// Helpers to support both live Api objects and plain-deserialized objects from IndexedDB
const getClassName = (x: any): string | undefined => (x && (x as any).className) || undefined;
const isPhotoMedia = (m: any) => !!m && (m instanceof Api.MessageMediaPhoto || getClassName(m) === 'MessageMediaPhoto' || !!(m as any).photo);
const isDocMedia = (m: any) => !!m && (m instanceof Api.MessageMediaDocument || getClassName(m) === 'MessageMediaDocument' || !!(m as any).document);
const isGeoMedia = (m: any) => !!m && (m instanceof Api.MessageMediaGeo || getClassName(m) === 'MessageMediaGeo' || !!(m as any).geo);
const isGeoLiveMedia = (m: any) => !!m && (m instanceof Api.MessageMediaGeoLive || getClassName(m) === 'MessageMediaGeoLive' || !!(m as any).geo);
const isContactMedia = (m: any) => !!m && (m instanceof Api.MessageMediaContact || getClassName(m) === 'MessageMediaContact');

// Helper to get file icon based on mime type
const getFileIcon = (mimeType: string, fileName?: string) => {
    const iconStyle = { fontSize: '3rem' };

    if (mimeType.startsWith('image/')) return <FileImageFilled style={iconStyle} />;
    if (mimeType === 'application/pdf') return <FilePdfFilled style={iconStyle} />;
    if (mimeType.includes('word') || mimeType === 'application/msword') return <FileWordFilled style={iconStyle} />;
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return <FileExcelFilled style={iconStyle} />;
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return <FilePptFilled style={iconStyle} />;
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return <FileZipFilled style={iconStyle} />;
    if (mimeType.startsWith('text/')) return <FileTextFilled style={iconStyle} />;
    if (mimeType.startsWith('video/')) return <PlayCircleFilled style={iconStyle} />;
    if (mimeType.startsWith('audio/')) return <AudioFilled style={iconStyle} />;

    return <FileOutlined style={iconStyle} />;
};

// Helper to format file size
const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

const BubbleMedia: React.FC<MediaProps> = ({ message }) => {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [docPreviewSrc, setDocPreviewSrc] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [videoSrc, setVideoSrc] = useState<string | null>(null);
    const [fullImageSrc, setFullImageSrc] = useState<string | null>(null);
    const [fullLoading, setFullLoading] = useState(false);



    useEffect(() => {
        const fetchMedia = async () => {
            const media = message ? (message as any).media as Api.TypeMessageMedia : null;
            setFullImageSrc(null);
            if (media === null) return;

            // Build cache ids
            let baseId: string | null = null;
            let thumbCacheId: string | null = null;
            try {
                if (isPhotoMedia(media)) {
                    const photo = (media as any).photo as Api.Photo | any;
                    const pid = (photo?.id?.toString?.()) ?? photo?.id;
                    if (pid) baseId = `photo:${pid}`;
                } else if (isDocMedia(media)) {
                    const doc = (media as any).document as Api.Document | any;
                    const did = (doc?.id?.toString?.()) ?? doc?.id;
                    if (did) {
                        if (doc?.mimeType?.startsWith('image/')) {
                            baseId = `doc:${did}:image`;
                        } else {
                            baseId = `doc:${did}`;
                        }
                    }
                }
            } catch { }

            if (baseId) {
                // thumbnails use :t1 suffix
                thumbCacheId = isDocMedia(media) && !(media as any).document?.mimeType?.startsWith('image/')
                    ? baseId
                    : `${baseId}:t1`;
                const cached = await Controller.storage.getMedia(thumbCacheId);
                if (cached) {
                    const buf: any = cached;
                    const ab: ArrayBuffer = (buf as any).buffer ? (buf as any).buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) : (buf as ArrayBuffer);
                    const base64 = Buffer.from(new Uint8Array(ab)).toString('base64');
                    let mimeType = 'image/png';
                    if (isDocMedia(media)) {
                        const doc = (media as any).document;
                        mimeType = doc?.mimeType || 'application/octet-stream';
                    }
                    setImageSrc(`data:${mimeType};base64,${base64}`);
                    return;
                }
            }

            // Download and cache THUMBNAIL for photos and image documents
            if (isPhotoMedia(media) || (isDocMedia(media) && (media as any).document?.mimeType?.startsWith('image/'))) {
                const result = await Controller.tgApi.downloadMedia(message as any, 1);
                if (result) {
                    const base64 = Buffer.from(result).toString('base64');
                    const mimeType = isDocMedia(media) ? ((media as any).document?.mimeType || 'image/png') : 'image/png';
                    setImageSrc(`data:${mimeType};base64,${base64}`);
                    if (thumbCacheId) {
                        try {
                            const ab = (result as any).buffer ? (result as any).buffer.slice(result.byteOffset, result.byteOffset + result.byteLength) : (result as ArrayBuffer);
                            await Controller.storage.addMedia(thumbCacheId, ab);
                        } catch { }
                    }
                }
            }
        };
        fetchMedia();
    }, [message]);

    const handleDocumentClick = async () => {
        const media = message ? (message as any).media as Api.TypeMessageMedia : null;
        if (!isDocMedia(media)) return;

        const document = (media as any).document as Api.Document | any;
        const mimeType = document?.mimeType || 'application/octet-stream';

        setLoading(true);

        try {
            // Check cache first
            const did = (document?.id?.toString?.()) ?? document?.id;
            const cacheId = did ? `doc:${did}:full` : null;

            let fileData: ArrayBuffer | Buffer | null = null;

            if (cacheId) {
                const cached = await Controller.storage.getMedia(cacheId);
                if (cached) {
                    fileData = cached;
                }
            }

            if (!fileData) {
                fileData = await Controller.tgApi.downloadOriginalMedia(media as Api.TypeMessageMedia);
                if (fileData && cacheId) {
                    try {
                        const ab = (fileData as any).buffer ?
                            (fileData as any).buffer.slice((fileData as any).byteOffset, (fileData as any).byteOffset + (fileData as any).byteLength) :
                            (fileData as ArrayBuffer);
                        await Controller.storage.addMedia(cacheId, ab);
                    } catch { }
                }
            }

            if (fileData) {
                const buf: any = fileData;
                const ab: ArrayBuffer = (buf as any).buffer ?
                    (buf as any).buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) :
                    (buf as ArrayBuffer);
                const base64 = Buffer.from(new Uint8Array(ab)).toString('base64');
                const src = `data:${mimeType};base64,${base64}`;

                if (mimeType === 'application/pdf') {
                    setDocPreviewSrc(src);
                    setPreviewOpen(true);
                } else if (mimeType.startsWith('video/')) {
                    setVideoSrc(src);
                    setPreviewOpen(true);
                } else if (mimeType.startsWith('image/')) {
                    setDocPreviewSrc(src);
                    setPreviewOpen(true);
                } else {
                    // For other files, trigger download
                    const blob = new Blob([ab], { type: mimeType });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = (document.attributes?.find((attr: any) => attr.className === 'DocumentAttributeFilename')?.fileName) || 'download';
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                }
            }
        } catch (error) {
            console.error('Error downloading document:', error);
        } finally {
            setLoading(false);
        }
    };
    const media = message ? (message as any).media as Api.TypeMessageMedia : null;
    // Photo rendering
    if (isPhotoMedia(media) && imageSrc) {
        const handlePhotoClick = async () => {
            const m = message ? (message as any).media as Api.TypeMessageMedia : null;
            if (!m) return;
            setPreviewOpen(true);
            setFullLoading(true);
            setFullImageSrc(null);
            // Build IDs
            let baseId: string | null = null;
            try {
                const photo = (m as any).photo as Api.Photo | any;
                const pid = (photo?.id?.toString?.()) ?? photo?.id;
                if (pid) baseId = `photo:${pid}`;
            } catch { }
            const fullId = baseId ? `${baseId}:full` : null;
            console.log('Full image id:', fullId);
            try {
                if (fullId) {
                    const cached = await Controller.storage.getMedia(fullId);
                    if (cached) {
                        const buf: any = cached;
                        const ab: ArrayBuffer = (buf as any).buffer ? (buf as any).buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) : (buf as ArrayBuffer);
                        const base64 = Buffer.from(new Uint8Array(ab)).toString('base64');
                        setFullImageSrc(`data:image/png;base64,${base64}`);
                        return;
                    }
                }
                const fileData = await Controller.tgApi.downloadMedia(message,(message.media as any).photo.sizes.length - 1);
                if (fileData) {
                    const buf: any = fileData;
                    const ab: ArrayBuffer = (buf as any).buffer ? (buf as any).buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) : (buf as ArrayBuffer);
                    const base64 = Buffer.from(new Uint8Array(ab)).toString('base64');
                    setFullImageSrc(`data:image/png;base64,${base64}`);
                    if (fullId) {
                        try { await Controller.storage.addMedia(fullId, ab); } catch {}
                    }
                }
            } finally {
                setFullLoading(false);
            }
        };
        return (
            <>
                <Image
                    src={imageSrc}
                    alt="Photo"
                    style={{ maxWidth: '15rem', maxHeight: '15rem', cursor: 'pointer', borderRadius: '8px' }}
                    onClick={handlePhotoClick}
                    preview={false}
                />
                <Modal
                    open={previewOpen}
                    onCancel={() => setPreviewOpen(false)}
                    footer={null}
                    width="90vw"
                    centered
                    styles={{
                        content: { padding: 0 },
                        body: { padding: 0 }
                    }}
                >
                    <div style={{ position: 'relative' }}>
                        {fullLoading && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Spin />
                            </div>
                        )}
                        <img
                            src={fullImageSrc || imageSrc}
                            alt="Preview"
                            style={{
                                width: '100%',
                                height: 'auto',
                                maxHeight: '90vh',
                                objectFit: 'contain',
                                display: 'block'
                            }}
                        />
                    </div>
                </Modal>
            </>
        );
    }

    // Document rendering
    if (isDocMedia(media)) {
        const document = (media as any).document as Api.Document | any;
        const mimeType = document?.mimeType || 'application/octet-stream';
        const fileName = document.attributes?.find((attr: any) =>
            attr.className === 'DocumentAttributeFilename'
        )?.fileName || 'Document';
        const fileSize = document?.size || 0;

        // If it's an image document and we have it loaded
        if (mimeType.startsWith('image/') && imageSrc) {
            return (
                <>
                    <div style={{ position: 'relative' }}>
                        <Image
                            src={imageSrc}
                            alt={fileName}
                            style={{ maxWidth: '15rem', maxHeight: '15rem', cursor: 'pointer', borderRadius: '8px' }}
                            onClick={handleDocumentClick}
                            preview={false}
                        />
                        <div style={{ fontSize: '0.8rem', marginTop: '4px', color: '#666' }}>
                            {fileName} ({formatFileSize(fileSize)})
                        </div>
                    </div>
                    <Modal
                        open={previewOpen}
                        onCancel={() => setPreviewOpen(false)}
                        footer={null}
                        width="90vw"
                        centered
                        styles={{
                            content: { padding: 0 },
                            body: { padding: 0 }
                        }}
                    >
                        {docPreviewSrc ? (
                            <img
                                src={docPreviewSrc}
                                alt={fileName}
                                style={{
                                    width: '100%',
                                    height: 'auto',
                                    maxHeight: '90vh',
                                    objectFit: 'contain',
                                    display: 'block'
                                }}
                            />
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
                                <Spin />
                            </div>
                        )}
                    </Modal>
                </>
            );
        }

        // Other document types
        return (
            <>
                <div
                    onClick={handleDocumentClick}
                    style={{
                        cursor: 'pointer',
                        padding: '10px',
                        borderRadius: '8px',
                        backgroundColor: '#f0f0f0',
                        display: 'inline-flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        minWidth: '120px'
                    }}
                >
                    <Spin spinning={loading}>
                        {getFileIcon(mimeType, fileName)}
                        <div style={{ fontSize: '0.8rem', marginTop: '8px', textAlign: 'center' }}>
                            <div style={{ fontWeight: 'bold' }}>{fileName}</div>
                            <div style={{ color: '#666' }}>{formatFileSize(fileSize)}</div>
                        </div>
                    </Spin>
                </div>

                <Modal
                    open={previewOpen}
                    onCancel={() => {
                        setPreviewOpen(false);
                        setDocPreviewSrc(null);
                        setVideoSrc(null);
                    }}
                    footer={null}
                    width={mimeType === 'application/pdf' ? '90vw' : '80vw'}
                    centered
                    styles={{
                        content: { padding: 0 },
                        body: { padding: 0, height: mimeType === 'application/pdf' ? '80vh' : 'auto' }
                    }}
                >
                    {docPreviewSrc && mimeType === 'application/pdf' && (
                        <iframe
                            title="PDF Preview"
                            src={docPreviewSrc}
                            style={{ width: '100%', height: '80vh', border: 0 }}
                        />
                    )}
                    {docPreviewSrc && mimeType.startsWith('image/') && (
                        <img
                            src={docPreviewSrc}
                            alt={fileName}
                            style={{
                                width: '100%',
                                height: 'auto',
                                maxHeight: '90vh',
                                objectFit: 'contain',
                                display: 'block'
                            }}
                        />
                    )}
                    {videoSrc && mimeType.startsWith('video/') && (
                        <video
                            controls
                            style={{ width: '100%', maxHeight: '80vh' }}
                            src={videoSrc}
                        />
                    )}
                </Modal>
            </>
        );
    }

    // Geo location rendering
    if (isGeoMedia(media) || isGeoLiveMedia(media)) {
        const geo = ((media as any).geo ?? {}) as Api.GeoPoint | any;
        const lat = geo.lat || geo.latitude;
        const lon = geo.long || geo.longitude;

        if (!lat || !lon) return <div>Invalid location data</div>;

        // Using OpenStreetMap tile with markers
        const zoom = 20;
        const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.01},${lat - 0.01},${lon + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lon}&zoom=${zoom}`;
        const googleMapsUrl = `https://maps.google.com/?q=${lat},${lon}`;

        return (
            <>
                <div
                    style={{
                        position: 'relative',
                        width: '20rem',
                        height: '15rem',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: '1px solid #ddd',
                    }}
                    onClick={() => setPreviewOpen(true)}
                >
                    <iframe
                        title={`osm-embed-${lat}-${lon}`}
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        scrolling="no"
                        src={mapUrl}
                        style={{ pointerEvents: 'none', borderRadius: '8px' }}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: 'rgba(0,0,0,0.6)',
                            color: 'white',
                            padding: '4px 8px',
                            fontSize: '0.8rem'
                        }}
                    >
                        📍 {lat.toFixed(4)}, {lon.toFixed(4)}
                    </div>
                </div>

                <Modal
                    open={previewOpen}
                    onCancel={() => setPreviewOpen(false)}
                    footer={null}
                    width="80vw"
                    centered
                    title={
                        <div>
                            Location: {lat.toFixed(6)}, {lon.toFixed(6)}
                            <a
                                href={googleMapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ marginLeft: '20px', fontSize: '14px' }}
                            >
                                Open in Google Maps →
                            </a>
                        </div>
                    }
                >
                    <iframe
                        title={`osm-modal-${lat}-${lon}`}
                        width="100%"
                        height="500px"
                        frameBorder="0"
                        scrolling="no"
                        src={mapUrl}
                    />
                </Modal>
            </>
        );
    }

    // Contact rendering
    if (isContactMedia(media)) {
        const contact = media as any;
        const firstName = contact.firstName || '';
        const lastName = contact.lastName || '';
        const phoneNumber = contact.phoneNumber || '';
        const vcard = contact.vcard || '';

        return (
            <div
                style={{
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: '#f0f0f0',
                    minWidth: '200px'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <DialogAvatar name={`${firstName} ${lastName}`} size={48} badge={false} unreadedMessages={0} imageBuffer={undefined} />
                    <div>
                        <div style={{ fontWeight: 'bold' }}>
                            {firstName} {lastName}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#666' }}>
                            📞 {phoneNumber}
                        </div>
                    </div>
                </div>
                {vcard && (
                    <button
                        style={{
                            marginTop: '10px',
                            padding: '4px 12px',
                            borderRadius: '4px',
                            border: '1px solid #1890ff',
                            backgroundColor: 'white',
                            color: '#1890ff',
                            cursor: 'pointer',
                            fontSize: '0.85rem'
                        }}
                        onClick={() => {
                            const blob = new Blob([vcard], { type: 'text/vcard' });
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${firstName}_${lastName}.vcf`;
                            document.body.appendChild(a);
                            a.click();
                            window.URL.revokeObjectURL(url);
                            document.body.removeChild(a);
                        }}
                    >
                        Save Contact
                    </button>
                )}
            </div>
        );
    }

    return null;
};

export default React.memo(BubbleMedia);