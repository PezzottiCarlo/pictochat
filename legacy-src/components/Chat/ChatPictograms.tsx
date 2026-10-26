import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Card, Spin } from 'antd';
import { PlusCircleOutlined } from '@ant-design/icons';
import InfiniteScroll from 'react-infinite-scroll-component';
import { PictogramImage } from '../Other/PictogramImage';
import { Controller } from '../../lib/Controller';
import Utils from '../../lib/Utils';
import { Pictogram } from '../../lib/AAC';
import { WordsService } from '../../lib/WordsService';
import { motion } from 'framer-motion';

interface ChatPictogramsProps {
    callback: (pictogram: Pictogram) => void;
}

const ITEMS_PER_PAGE = 30;

const keywords = Controller.getCategoriesData();

const deduplicatePictograms = (pictograms: Pictogram[], toIgnore: number): Pictogram[] => {

    //pictograms = pictograms.sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime());
    //sort alphabetically
    //pictograms = pictograms.sort((a, b) => (a.word as string).localeCompare(b.word as string));

    const seenWords: string[] = [];
    const seenIds = new Set();

    let i = 0;
    return pictograms.filter(pictogram => {
        if (i < toIgnore) {
            i++;
            return true;
        }
        if (seenIds.has(pictogram._id)) return false;
        if (seenIds.has(pictogram.word)) return false;

        if (seenWords.some(word => WordsService.levenshteinDistance(word, pictogram.word as string) <= 2)) {
            return false;
        }

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
        setDisplayedPictograms([]);
        setPictograms([]);

        let newPictogramsPersonal: Pictogram[] = [];
        let newPictograms: Pictogram[] = [];
        keywords[category].forEach(keyword => {
            const categoryPictograms = Controller.searchForCategory(keyword);
            newPictograms = [...newPictograms, ...categoryPictograms.araasac];
            newPictogramsPersonal = [...newPictogramsPersonal, ...categoryPictograms.personal];
        });

        let mergedPictograms = [...newPictogramsPersonal, ...newPictograms];
        const uniquePictograms = deduplicatePictograms(mergedPictograms, newPictogramsPersonal.length);
        setPictograms(uniquePictograms);
        setDisplayedPictograms(uniquePictograms.slice(0, ITEMS_PER_PAGE));
        setHasMore(uniquePictograms.length > ITEMS_PER_PAGE);
        setLoading(false);
    }, []);


    // Load more pictograms for infinite scroll
    const loadMorePictograms = useCallback(() => {
        const currentLength = displayedPictograms.length;
        const nextPictograms = pictograms.slice(currentLength, currentLength + ITEMS_PER_PAGE);
        setDisplayedPictograms(prev => [...prev, ...nextPictograms]);
        console.log("Loading more pictograms", currentLength, displayedPictograms.length, nextPictograms.length, pictograms.length);
        if (currentLength + nextPictograms.length >= pictograms.length) {
            console.log("No more pictograms");
            setHasMore(false);
        }
    }, [pictograms, displayedPictograms]);

    const handleCategoryClick = (category: string) => {
        setSelectedCategory(category);
        setCategoryModalVisible(false);
        fetchPictograms(category);
        setPictogramModalVisible(true);
    };

    const handlePictogramSelect = (pictogram: Pictogram) => {
        callback(pictogram);
        setPictogramModalVisible(false);
    };

    function handleScroll(event: any): void {
        const element = event.target;
        let scrollPercentage = 100 * element.scrollTop / (element.scrollHeight - element.clientHeight);
        if (scrollPercentage > 90 && hasMore) {
            loadMorePictograms();
        }
    }

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <PlusCircleOutlined
                    style={{ fontSize: '2rem', cursor: 'pointer', color: 'var(--ant-color-primary)' }}
                    onClick={() => setCategoryModalVisible(true)}
                />
            </motion.div>

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
                </div>
            </Modal>

            <Modal
                title={`Pittogrammi per ${selectedCategory}`}
                open={pictogramModalVisible}
                onCancel={() => setPictogramModalVisible(false)}
                footer={null}
                style={{
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
