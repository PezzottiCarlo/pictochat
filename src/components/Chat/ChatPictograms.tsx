import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Card, Spin } from 'antd';
import { PlusCircleOutlined } from '@ant-design/icons';
import InfiniteScroll from 'react-infinite-scroll-component';
import { PictogramImage } from '../Other/PictogramImage';
import { Controller } from '../../lib/Controller';
import { PersonalPictogramsCategory } from '../../routes/PersonalPictograms';
import Utils from '../../lib/Utils';
import { Pictogram } from '../../lib/AAC';
import { WordsService } from '../../lib/WordsService';

interface ChatPictogramsProps {
    callback: (pictogram: Pictogram) => void;
}

const ITEMS_PER_PAGE = 30;

const keywords: { [key: string]: string[] } = {
    "tempo libero": ["sport", "hobby"],
    "lavoro": ["education", "professional", "work"],
    "cibo": ["food", "soda"],
    "medicina": ["medicine"],
    "luoghi": ["building"],
    "verbi": ["usual verbs"],
    "emozioni": ["emotion", "feeling"],
    "tempo": ["time"],
};

// Utility to deduplicate pictograms
const deduplicatePictograms = (pictograms: Pictogram[], levenshteinDistance: boolean): Pictogram[] => {
    pictograms = pictograms.sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime());

    const seenWords: string[] = [];
    const seenIds = new Set();

    return pictograms.filter(pictogram => {
        // Controlla se l'ID è già stato visto
        if (seenIds.has(pictogram._id)) return false;
        if(seenIds.has(pictogram.word)) return false;

        if (levenshteinDistance) {
            if (seenWords.some(word => WordsService.levenshteinDistance(word, pictogram.word as string) <= 2)) {
                return false;
            }
        }

        // Aggiungi la parola e l'ID agli insiemi "visti"
        seenWords.push(pictogram.word as string);
        seenIds.add(pictogram._id);
        seenIds.add(pictogram.word);
        return true;
    });
};


const ChatPictograms: React.FC<ChatPictogramsProps> = ({ callback }) => {
    const [categoryModalVisible, setCategoryModalVisible] = useState(false);
    const [pictogramModalVisible, setPictogramModalVisible] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [pictograms, setPictograms] = useState<Pictogram[]>([]);
    const [displayedPictograms, setDisplayedPictograms] = useState<Pictogram[]>([]);
    const [hasMore, setHasMore] = useState(true);

    // Fetch pictograms based on category
    const fetchPictograms = useCallback((category: string) => {
        setLoading(true);
        setHasMore(true);

        let newPictograms: Pictogram[] = [];
        keywords[category].forEach(keyword => {
            const categoryPictograms = Controller.searchForCategory(keyword);
            newPictograms = [...newPictograms, ...categoryPictograms];
        });

        const uniquePictograms = deduplicatePictograms(newPictograms, true);
        setPictograms(uniquePictograms);
        setDisplayedPictograms(uniquePictograms.slice(0, ITEMS_PER_PAGE));
        setHasMore(uniquePictograms.length > ITEMS_PER_PAGE);
        setLoading(false);
    }, []);

    // Fetch personal pictograms
    const fetchPersonalPictograms = useCallback((personalCategory: string) => {
        setLoading(true);
        const personalPictograms = Controller.getPersonalPictograms()
            .filter(p => p.category.toLowerCase() === personalCategory.toLowerCase())
            .map(Utils.personalPictogramToPictogram);

        const combinedPictograms = deduplicatePictograms([
            ...personalPictograms,
            ...Controller.getWords(PersonalPictogramsCategory.SOGGETTO)
        ], false);

        setPictograms(combinedPictograms);
        setDisplayedPictograms(combinedPictograms.slice(0, ITEMS_PER_PAGE));
        setHasMore(combinedPictograms.length > ITEMS_PER_PAGE);
        setLoading(false);
    }, []);

    // Load more pictograms for infinite scroll
    const loadMorePictograms = useCallback(() => {
        const currentLength = displayedPictograms.length;
        const nextPictograms = pictograms.slice(currentLength, currentLength + ITEMS_PER_PAGE);
        setDisplayedPictograms(prev => [...prev, ...nextPictograms]);
        if (currentLength + nextPictograms.length >= pictograms.length) setHasMore(false);
    }, [pictograms, displayedPictograms]);

    const handleCategoryClick = (category: string) => {
        setSelectedCategory(category);
        setCategoryModalVisible(false);
        fetchPictograms(category);
        setPictogramModalVisible(true);
    };

    const handlePersonalCategoryClick = (category: string) => {
        setSelectedCategory(category);
        setCategoryModalVisible(false);
        fetchPersonalPictograms(category);
        setPictogramModalVisible(true);
    };

    const handlePictogramSelect = (pictogram: Pictogram) => {
        callback(pictogram);
        setPictogramModalVisible(false);
    };

    function handleScroll(event: any): void {
        const element = event.target;
        if (element.scrollHeight - element.scrollTop === element.clientHeight) {
            loadMorePictograms();
        }
    }

    return (
        <>
            <PlusCircleOutlined
                style={{ fontSize: '2rem', cursor: 'pointer' }}
                onClick={() => setCategoryModalVisible(true)}
            />

            {/* Category Selection Modal */}
            <Modal
                title="Seleziona una categoria"
                open={categoryModalVisible}
                onCancel={() => setCategoryModalVisible(false)}
                footer={null}
            >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center' }}>
                    {Object.keys(keywords).map(category => (
                        <Card
                            key={category}
                            style={{ cursor: 'pointer', width: '120px', textAlign: 'center' }}
                            onClick={() => handleCategoryClick(category)}
                        >
                            <PictogramImage
                                picto={(Controller.extractPictograms(category) as Pictogram[])[0]}
                                width={100}
                                height={100}
                            />
                        </Card>
                    ))}
                    {Object.keys(PersonalPictogramsCategory).map(category => (
                        <Card
                            key={category}
                            style={{ cursor: 'pointer', width: '120px', textAlign: 'center' }}
                            onClick={() => handlePersonalCategoryClick(category)}
                        >
                            <PictogramImage
                                picto={(Controller.extractPictograms(
                                    category === "SOGGETTO" ? "gente" : "oggetti quotidiani"
                                ) as Pictogram[])[0]}
                                width={100}
                                height={100}
                            />
                        </Card>
                    ))}
                </div>
            </Modal>

            <Modal
                title={`Pittogrammi per ${selectedCategory}`}
                open={pictogramModalVisible}
                onCancel={() => setPictogramModalVisible(false)}
                footer={null}
                bodyStyle={{
                    maxHeight: 'calc(100vh - 200px)',
                    overflowY: 'auto',
                }}
            >
                <div id="scrollableModalBody" style={{ maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }} onScroll={handleScroll}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            <Spin size="large" />
                        </div>
                    ) : (
                        <InfiniteScroll
                            dataLength={displayedPictograms.length}
                            next={loadMorePictograms}
                            hasMore={hasMore}
                            loader={<div style={{ textAlign: 'center', marginTop: '20px' }}>Caricamento...</div>}
                            scrollableTarget="scrollableModalBody"

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
                </div>
            </Modal>
        </>
    );
};

export default ChatPictograms;
