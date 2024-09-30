import React, { useState, useEffect } from 'react';
import { Api } from 'telegram';
import { Image, Card } from 'antd';
import { Controller } from '../../lib/Controller';

interface MediaProps {
    media: Api.TypeMessageMedia | null;
}

const BubbleMedia: React.FC<MediaProps> = ({ media }) => {
    const [imageSrc, setImageSrc] = useState<string | null>(null);

    useEffect(() => {
        const fetchMedia = async () => {
            if(media === null) return;
            const result = await Controller.tgApi.downloadMedia(media,0);
            setImageSrc(`data:image/png;base64,${(result)?Buffer.from(result).toString('base64'):null}`);
        };
        fetchMedia();
    }, [media]);

    if (media instanceof Api.MessageMediaPhoto && imageSrc) {
        return (
            <Image
                src={imageSrc}
                alt="Photo"
                style={{ width: '10rem' }}
            />
        );
    } else if (media instanceof Api.MessageMediaDocument) {
        const document = media.document as Api.Document;
        const fileName = ""
        const fileUrl = ""

        return (
            <Card title={fileName} extra={<a href={fileUrl}>Download</a>} style={{ width: 300 }}>
                <p>Document ID: {document.id.toString()}</p>
            </Card>
        );
    } else if (media instanceof Api.MessageMediaGeo) {
        const geo = media.geo as Api.GeoPoint;
        return (
            <div>
                <p>Location: {geo.lat}, {geo.long}</p>
                <a href={`https://maps.google.com/?q=${geo.lat},${geo.long}`} target="_blank" rel="noopener noreferrer">View on Google Maps</a>
            </div>
        );
    } else if (media instanceof Api.MessageMediaContact) {
        const contact = media as Api.MessageMediaContact;
        return (
            <div>
                <p>Contact: {contact.firstName} {contact.lastName}</p>
                <p>Phone: {contact.phoneNumber}</p>
            </div>
        );
    } else {
        return null;
    }
};

export default BubbleMedia;
