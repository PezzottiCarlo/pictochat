import React, { useEffect, useState } from 'react';
import { Button, Popover, Card, Image, Modal } from 'antd';
import { DeleteOutlined, TranslationOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import '../../styles/ChatCustomMessage.css';
import { Pictogram } from '../../lib/AAC';
import { WordsService } from '../../lib/WordsService';
import { PictogramImage } from '../Other/PictogramImage';

interface ChatCustomMessageProps {
    callback: (subjects: Pictogram[], verbs: Pictogram[], objects: Pictogram[]) => void;
}

const ChatCustomMessage: React.FC<ChatCustomMessageProps> = ({ callback }) => {
    const [visible, setVisible] = useState(false);
    const [pictoData] = useState([
        { id: 1, url: 'https://static.arasaac.org/pictograms/9853/9853_nocolor_hair-ED4120_skin-F5E5DE_500.png' },
        { id: 2, url: 'https://static.arasaac.org/pictograms/32067/32067_nocolor_hair-ED4120_skin-F5E5DE_500.png' },
        { id: 3, url: 'https://static.arasaac.org/pictograms/22620/22620_nocolor_hair-ED4120_skin-F5E5DE_500.png' },
    ]);

    const [selectedPicto, setSelectedPicto] = useState<{ subjects: Pictogram[], verbs: Pictogram[], objects: Pictogram[] }>({
        subjects: [],
        verbs: [],
        objects: [],
    });

    const [modalVisible, setModalVisible] = useState(false);
    const [currentSelection, setCurrentSelection] = useState<'subjects' | 'verbs' | 'objects' | null>(null);

    const handlePictoClick = (type: 'subjects' | 'verbs' | 'objects') => {
        setCurrentSelection(type);
        setModalVisible(true);
    };

    const handleModalOk = () => {
        setModalVisible(false);
    };

    useEffect(() => {
        if (selectedPicto.subjects.length && selectedPicto.verbs.length && selectedPicto.objects.length) {
            setModalVisible(false);
            setVisible(false);
            callback(selectedPicto.subjects, selectedPicto.verbs, selectedPicto.objects);
            setSelectedPicto({
                subjects: [],
                objects: [],
                verbs: []
            })
        }
    }, [selectedPicto, callback]);

    const handlePictoSelect = (picto: Pictogram) => {
        if (currentSelection) {
            setSelectedPicto((prevState) => ({
                ...prevState,
                [currentSelection]: [...prevState[currentSelection], picto], // Aggiungi il pittogramma selezionato all'array
            }));
            setModalVisible(false);
            setVisible(true);
        }
    };

    const renderModalContent = () => {
        let items: Pictogram[] = [];
        switch (currentSelection) {
            case 'subjects':
                items = WordsService.getSubjects();
                break;
            case 'verbs':
                items = WordsService.getVerbs();
                break;
            case 'objects':
                const reversedVerbs = selectedPicto.verbs.slice().reverse();
                reversedVerbs.forEach((verb) => {
                    const objectsForVerb = WordsService.getObjects(verb.word);
                    items.push(...objectsForVerb); // Usa lo spread operator per inserire gli oggetti direttamente
                });
                break;
            default:
                return null;
        }

        return (
            <div style={{ display: 'flex', flexWrap: 'wrap', overflowY: 'auto', maxHeight: "100%", justifyContent: 'center' }}>
                {items.map((picto) => (
                    <Card
                        className='custom-message-card'
                        key={picto._id}
                        onClick={() => handlePictoSelect(picto)}
                        style={{ margin: '10px', padding: 0, cursor: 'pointer' }}>
                        <PictogramImage picto={picto} style={{ backgroundColor: 'white' }}/>
                    </Card>
                ))}
            </div>
        );
    };

    const handleButton = () => {
        setCurrentSelection(null);
        setVisible(true);
        setModalVisible(false);
        setSelectedPicto({ subjects: [], verbs: [], objects: [] });
    };

    // Funzione per renderizzare più pittogrammi selezionati
    const renderPictoCards = (type: 'subjects' | 'verbs' | 'objects', defaultIndex: number) => (

        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Card className='custom-message-card' style={{ margin: '10px', padding: 0 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                    {selectedPicto[type].map((picto, index) => (
                        <Card
                            key={index}
                            style={{ margin: '10px', padding: 0, cursor: 'pointer' }}
                            cover={
                                <PictogramImage picto={picto} style={{ backgroundColor: 'white' }} onClick={() => handlePictoClick(type)} height={100} width={100} />
                            }
                            actions={[
                                <DeleteOutlined key="delete" onClick={() => setSelectedPicto((prevState) => ({
                                    ...prevState,
                                    [type]: prevState[type].filter((p) => p._id !== picto._id),
                                }))}
                                    style={{ fontSize: '1.5rem' }}
                                />,
                            ]}
                        />
                    ))}
                    {selectedPicto[type].length === 0 && (
                        <Image
                            src={pictoData[defaultIndex].url}
                            alt={`picto-${defaultIndex}`}
                            width={100}
                            height={100}
                            preview={false}
                            onClick={() => handlePictoClick(type)}
                            style={{ backgroundColor: 'white' }}
                        />
                    )}
                </div>
            </Card>
        </motion.div>
    );

    return (
        <>
            <Popover
                content={
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {renderPictoCards('subjects', 0)}
                        {renderPictoCards('verbs', 1)}
                        {renderPictoCards('objects', 2)}
                    </div>
                }
                title="Seleziona i pittogrammi"
                trigger="click"
                open={visible}
                onOpenChange={setVisible}
                placement="topLeft"
                autoAdjustOverflow
                motion={{
                    motionName: 'zoom-big-fast',
                    motionEnter: true,
                    motionLeave: true,
                    motionAppear: true,
                    motionDeadline: 500,
                }}
            >
                <Button type='primary' onClick={handleButton} icon={<TranslationOutlined />} />
            </Popover>

            <Modal
                title="Seleziona un pittogramma"
                open={modalVisible}
                onOk={handleModalOk}
                onCancel={() => { setModalVisible(false); setVisible(true); }}
                footer={null}
                styles={{ mask: { background: 'rgba(0, 0, 0, .7)' }, content: { width: '80%', height: '100%' } }}
                zIndex={5000}
            >
                {renderModalContent()}
            </Modal>
        </>
    );
};

export default ChatCustomMessage;
