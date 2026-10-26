import { Slider } from "antd";
import { useEffect, useState } from "react";

interface FontManagerProps {
    callback: (fontSizes: number) => void;
    currentFontSize: number;
}

export const FontManager: React.FC<FontManagerProps> = ({ callback, currentFontSize }) => {
    const [fontSize, setFontSize] = useState(currentFontSize || 14);

    const handleFontSizeChange = (value: number) => {
        setFontSize(value);
        callback(value);
    };

    return (
        <div style={{ marginTop: '20px' }}>
            <h3>Dimensione del Font</h3>
            <Slider
                min={12}
                max={24}
                value={fontSize}
                onChange={handleFontSizeChange}
                tooltip={{ open: true }}
            />
        </div>
    );
};
