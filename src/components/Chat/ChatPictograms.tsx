import React, { useState } from 'react';
import { Modal, Card, Spin } from 'antd';
import { PlusCircleOutlined } from '@ant-design/icons';
import { AAC, Pictogram } from '../../lib/AAC';
import InfiniteScroll from 'react-infinite-scroll-component';
import { PictogramImage } from '../Other/PictogramImage';
import { Controller } from '../../lib/Controller';

interface ChatPictogramsProps {
    callback: (pictogram: Pictogram) => void;
}

const ChatPictograms: React.FC<ChatPictogramsProps> = ({ callback }) => {
    const [categoryModalVisible, setCategoryModalVisible] = useState(false);
    const [pictogramModalVisible, setPictogramModalVisible] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [pictograms, setPictograms] = useState<Pictogram[]>([]);
    const [displayedPictograms, setDisplayedPictograms] = useState<Pictogram[]>([]);
    const [hasMore, setHasMore] = useState(true);

    const ITEMS_PER_PAGE = 200;

    const keywords: { [key: string]: string[] } = {
        "Tempo libero": ["sport", "hobby"],
        "Lavoro": ["professional", "work"],
        "Alimentazione": ["food", "soda"],
        "Luoghi": ["building"]
    };

    // Rimuove duplicati usando l'ID dei pittogrammi
    const deduplicatePictograms = (pictograms: Pictogram[]): Pictogram[] => {
        const seen = new Set();
        return pictograms.filter((pictogram) => {
            if (seen.has(pictogram._id)) {
                return false;
            }
            seen.add(pictogram._id);
            return true;
        });
    };

    // Carica i pittogrammi iniziali per la categoria selezionata
    const fetchPictograms = (keyword: string) => {
        setLoading(true);
        setPictograms([]);
        setDisplayedPictograms([]);
        setHasMore(true);

        let newPictograms: Pictogram[] = [];
        for (const entry of keywords[keyword]) {
            const categoryPictograms = Controller.searchForCategory(entry);
            categoryPictograms.sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime());

            newPictograms = [...newPictograms, ...categoryPictograms];
        }

        // Deduplica i pittogrammi prima di salvarli
        newPictograms = deduplicatePictograms(newPictograms);

        setPictograms(newPictograms);
        setDisplayedPictograms(newPictograms.slice(0, ITEMS_PER_PAGE));
        setHasMore(newPictograms.length > ITEMS_PER_PAGE);
        setLoading(false);
    };

    // Carica altri pittogrammi quando l'utente scorre
    const loadMorePictograms = () => {
        const currentLength = displayedPictograms.length;
        const nextPictograms = pictograms.slice(currentLength, currentLength + ITEMS_PER_PAGE);

        setDisplayedPictograms((prev) => [...prev, ...nextPictograms]);

        // Aggiorna lo stato di `hasMore` se sono stati caricati tutti i pittogrammi
        if (currentLength + nextPictograms.length >= pictograms.length) {
            setHasMore(false);
        }
    };

    const handleCategoryClick = async (category: string) => {
        setSelectedCategory(category);
        setCategoryModalVisible(false);
        fetchPictograms(category);
        setPictogramModalVisible(true);
    };

    const handlePictogramSelect = (pictogram: Pictogram) => {
        callback(pictogram);
        setPictogramModalVisible(false);
    };

    return (
        <>
            <PlusCircleOutlined
                style={{ fontSize: '2rem', cursor: 'pointer' }}
                onClick={() => setCategoryModalVisible(true)}
            />

            <Modal
                title="Seleziona una categoria"
                open={categoryModalVisible}
                onCancel={() => setCategoryModalVisible(false)}
                footer={null}
            >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center' }}>
                    {Object.keys(keywords).map((category) => (
                        <Card
                            key={category}
                            style={{ cursor: 'pointer', width: '120px', textAlign: 'center' }}
                            onClick={() => handleCategoryClick(category)}
                        >
                            {category}
                        </Card>
                    ))}
                </div>
            </Modal>

            <Modal
                title={`Pittogrammi per ${selectedCategory}`}
                open={pictogramModalVisible}
                onCancel={() => setPictogramModalVisible(false)}
                footer={null}
                styles={{
                    body: {
                        maxHeight: 'calc(100vh - 200px)',
                        overflowY: 'auto',
                    }
                }}
            >
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <Spin size="large" />
                    </div>
                ) : (
                    <InfiniteScroll
                        dataLength={displayedPictograms.length}
                        next={loadMorePictograms}
                        hasMore={hasMore}
                        loader={
                            <div style={{ textAlign: 'center', padding: '20px' }}>
                                <Spin size="large" />
                            </div>
                        }
                        scrollableTarget="modal-body" // Target dello scroll nel modal
                    >
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center' }}>
                            {displayedPictograms.map((pictogram) => (
                                <PictogramImage
                                    picto={pictogram}
                                    key={pictogram._id}
                                    onClick={() => handlePictogramSelect(pictogram)}
                                    height={200}
                                    width={200}
                                />
                            ))}
                            {displayedPictograms.length === 0 && !loading && (
                                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                                    Nessun pittogramma disponibile.
                                </div>
                            )}
                        </div>
                    </InfiniteScroll>
                )}
            </Modal>
        </>
    );
};

export default ChatPictograms;
