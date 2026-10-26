import { Pictogram } from "../../lib/AAC";
import { Image } from 'antd';

interface PictogramProps {
    picto: Pictogram;
    style?: React.CSSProperties;
    width?: number;
    height?: number;
    text?: boolean;
    onClick?: () => void;
}

export const PictogramImage: React.FC<PictogramProps> = ({ picto, style={objectFit:"cover"}, width, height,onClick,text=true}) => {

    if (!picto) {
        return null;
    }

    return (
        <div onClick={onClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Image
                src={picto.url}
                alt={picto.desc}
                width={width || 200}
                height={height || 200}
                preview={false}
                // @ts-ignore: loading is forwarded to underlying img
                loading="lazy"
                style={{ contentVisibility: 'auto', containIntrinsicSize: `${height || 200}px ${width || 200}px`, ...style }}
            />
            {text && <span style={{ fontSize: '.7rem' }}>{picto.word}</span>}
        </div>
    )
}