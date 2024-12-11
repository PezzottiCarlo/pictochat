import React, { useEffect, useState } from 'react';
import { List, Input, Button, Space, message } from 'antd';

interface HintsManagerProps {
    callback: (hints: { text: string; icon: string }[]) => void;
    currentHints: { text: string; icon: string }[];
}

const HintsManager: React.FC<HintsManagerProps> = ({ callback, currentHints }) => {
    const [hints, setHints] = useState<{ text: string; icon: string }[]>(currentHints);
    const [newHint, setNewHint] = useState<{ text: string; icon: string }>({ text: '', icon: '' });

    const handleAddHint = () => {
        if (!newHint.text.trim() || !newHint.icon.trim()) {
            message.warning('Entrambi i campi sono obbligatori.');
            return;
        }
        setHints([...hints, newHint]);
        setNewHint({ text: '', icon: '' });
        message.success('Frase aggiunta con successo!');
        callback([...hints, newHint]);
    };

    const handleRemoveHint = (index: number) => {
        const updatedHints = hints.filter((_, i) => i !== index);
        setHints(updatedHints);
        message.success('Frase rimossa con successo!');
        callback(updatedHints);
    };

    return (
        <div style={{ marginTop: '20px' }}>
            <h3>Gestione Frasi Consigliate</h3>
            <List
                bordered
                dataSource={hints}
                renderItem={(item, index) => (
                    <List.Item
                        actions={[<Button danger onClick={() => handleRemoveHint(index)}>Rimuovi</Button>]}
                    >
                        <Space>
                            <span>{item.icon}</span>
                            <span>{item.text}</span>
                        </Space>
                    </List.Item>
                )}
            />

            <div style={{ marginTop: '20px' }}>
                <Space>
                    <Input
                        placeholder="Testo"
                        value={newHint.text}
                        onChange={(e) => setNewHint({ ...newHint, text: e.target.value })}
                    />
                    <Input
                        placeholder="Icona"
                        value={newHint.icon}
                        onChange={(e) => setNewHint({ ...newHint, icon: e.target.value })}
                    />
                    <Button type="primary" onClick={handleAddHint}>Aggiungi</Button>
                </Space>
            </div>
        </div>
    );
};

export default HintsManager;
