import { Button, Radio, Select } from "antd"
import { useEffect, useState } from "react";
const { Option } = Select;


interface ThemeManagerProps {
    callback: (theme: string) => void;
    currentTheme: string;
}

export const ThemeManager: React.FC<ThemeManagerProps> = ({ callback, currentTheme }) => {

    const [theme, setTheme] = useState<string>(currentTheme);

    function handleThemeChange(e: any): void {
        setTheme(e.target.value);
        callback(e.target.value);
    }

    return (
        <div style={{ marginTop: '20px' }}>
            <h3>Tema Not implemented</h3>
            <Radio.Group
                onChange={handleThemeChange}
                value={theme}
                style={{ width: '100%' }}
            >
                <Radio.Button value="light" style={{ width: '100%', textAlign: 'center' }}>
                    Light
                </Radio.Button>
                <Radio.Button value="dark" style={{ width: '100%', textAlign: 'center', marginTop: '10px' }}>
                    Dark
                </Radio.Button>
                <Radio.Button value="high-contrast" style={{ width: '100%', textAlign: 'center', marginTop: '10px' }}>
                    High Contrast
                </Radio.Button>
            </Radio.Group>
        </div >
    )

}




