import React, { useState } from 'react';
import { List, Input, Button, Space, message, Typography } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';

const { Title } = Typography;

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
        <div>
            <Title level={5} style={{ margin: '0 0 16px 0', fontSize: 18 }}>Gestione Frasi Consigliate</Title>
            <List
                bordered
                dataSource={hints}
                renderItem={(item, index) => (
                    <List.Item
                        actions={[
                            <Button 
                                danger 
                                type="text"
                                icon={<DeleteOutlined />}
                                onClick={() => handleRemoveHint(index)}
                                style={{ minWidth: 40 }}
                            />
                        ]}
                        style={{ padding: '12px 16px' }}
                    >
                        <Space>
                            <span style={{ fontSize: 20 }}>{item.icon}</span>
                            <span>{item.text}</span>
                        </Space>
                    </List.Item>
                )}
                style={{ marginBottom: 16 }}
            />

            <Space.Compact style={{ width: '100%' }}>
                <Input
                    placeholder="Testo"
                    value={newHint.text}
                    onChange={(e) => setNewHint({ ...newHint, text: e.target.value })}
                    style={{ flex: 1 }}
                />
                <Input
                    placeholder="Icona"
                    value={newHint.icon}
                    onChange={(e) => setNewHint({ ...newHint, icon: e.target.value })}
                    style={{ width: 80 }}
                />
                <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={handleAddHint}
                />
            </Space.Compact>
        </div>
    );
};

export default HintsManager;
