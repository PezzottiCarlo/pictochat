import { Select } from "antd";
import { HairColor, SkinColor } from "../../lib/AAC";
import { useEffect, useState } from "react";
const { Option } = Select;

interface CharacterManagerProps {
    callback: (hairColor: HairColor, skinColor: SkinColor) => void;
    currentHairColor: HairColor | undefined;
    currentSkinColor: SkinColor | undefined;
}

export const CharacterManager: React.FC<CharacterManagerProps> = ({ callback, currentHairColor, currentSkinColor }) => {
    const [hairColor, setHairColor] = useState<HairColor>(currentHairColor || HairColor.BLACK);
    const [skinColor, setSkinColor] = useState<SkinColor>(currentSkinColor || SkinColor.WHITE);

    // Gestisci il cambio di colore dei capelli
    const handleHairColorChange = (value: HairColor) => {
        setHairColor(value);
        callback(value, skinColor);
    };

    // Gestisci il cambio di colore della pelle
    const handleSkinColorChange = (value: SkinColor) => {
        setSkinColor(value);
        callback(hairColor, value);
    };

    return (
        <div style={{ marginTop: '20px' }}>
            <h3>Colore dei Capelli</h3>
            <Select
                value={hairColor}
                onChange={(value) => handleHairColorChange(value as HairColor)}
                style={{ width: '100%' }}
                placeholder="Seleziona un colore"
            >
                {Object.values(HairColor).map((color) => (
                    <Option key={color} value={color}>
                        {color}
                    </Option>
                ))}
            </Select>

            <h3>Colore della Pelle</h3>
            <Select
                value={skinColor}
                onChange={(value) => handleSkinColorChange(value as SkinColor)}
                style={{ width: '100%' }}
                placeholder="Seleziona un colore"
            >
                {Object.values(SkinColor).map((color) => (
                    <Option key={color} value={color}>
                        {color}
                    </Option>
                ))}
            </Select>
        </div>
    );
};
