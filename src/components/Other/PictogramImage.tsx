import { Pictogram } from "../../lib/AAC";
import { Image } from 'antd';

interface PictogramProps {
    picto: Pictogram;
    style?: React.CSSProperties;
    width?: number;
    height?: number;
    onClick?: () => void;
}

export const PictogramImage: React.FC<PictogramProps> = ({ picto, style, width, height,onClick }) => {


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
                style={style}
            />
            <span style={{ fontSize: '.7rem' }}>{picto.word}</span>
        </div>
    )
}