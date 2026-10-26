import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Modal, Form, Input, Select, Upload, message, List, Card, Image, Popconfirm, Tooltip } from "antd";
import { PlusOutlined, UploadOutlined, DeleteOutlined, SearchOutlined } from "@ant-design/icons";
import { Controller } from "../lib/Controller";
import { CustomFooter } from '../components/CustomFooter/CustomFooter';
import PageLayout from '../components/Other/PageLayout';

export interface PersonalPictogram {
    name: string;
    category: string;
    photoUrl: string;
}

export const PersonalPictograms: React.FC = () => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [pictograms, setPictograms] = useState<PersonalPictogram[]>([]);
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);

    useEffect(() => {
        setPictograms(Controller.getPersonalPictograms());
        const onStorage = (e: StorageEvent) => {
            if (e.key === "personalPictograms") {
                setPictograms(Controller.getPersonalPictograms());
            }
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    const showModal = useCallback(() => setIsModalVisible(true), []);

    const handleCancel = useCallback(() => {
        setIsModalVisible(false);
        form.resetFields();
    }, [form]);

    const handleOk = useCallback(() => {
        form
            .validateFields()
            .then((values) => {
                const list = values.photo as any[];
                const file: File | undefined = list?.[0]?.originFileObj;
                if (!file) {
                    message.error("Seleziona un'immagine valida.");
                    return;
                }

                if (file.size > 10 * 1024 * 1024) {
                    message.error("L'immagine supera i 10MB.");
                    return;
                }

                const trimmedName = (values.name as string).trim();
                const normalizedName = trimmedName.toLowerCase();
                const normalizedCategory = (values.category as string).trim().toLowerCase();

                if (pictograms.some((p) => p.name.toLowerCase() === normalizedName)) {
                    message.error("Esiste già un pittogramma con questo nome.");
                    return;
                }

                const reader = new FileReader();
                reader.onload = async () => {
                    try {
                        const dataUrl = reader.result as string;
                        const photoUrl = await compressDataUrl(dataUrl, 640, 640, 0.8);
                        const newPictogram: PersonalPictogram = {
                            name: normalizedName,
                            category: normalizedCategory,
                            photoUrl,
                        };
                        try {
                            Controller.addPersonalPictogram(newPictogram);
                        } catch (e: any) {
                            if (e?.name === 'QuotaExceededError' || /quota/i.test(e?.message || '')) {
                                message.error("Spazio di archiviazione esaurito. Elimina alcuni pittogrammi o riduci la dimensione dell'immagine.");
                                return;
                            }
                            throw e;
                        }
                        setPictograms(Controller.getPersonalPictograms());
                        message.success("Immagine aggiunta con successo!");
                        setIsModalVisible(false);
                        form.resetFields();
                    } catch {
                        message.error("Errore nella compressione dell'immagine.");
                    }
                };
                reader.onerror = () => message.error("Errore nella lettura del file.");
                reader.readAsDataURL(file);
            })
            .catch(() => {});
    }, [form, pictograms]);

    const handleDelete = useCallback((pictogram: PersonalPictogram) => {
        Controller.deletePersonalPictogram(pictogram);
        setPictograms(Controller.getPersonalPictograms());
        message.success("Pittogramma eliminato.");
    }, []);

    const categoriesOptions = useMemo(
        () => Controller.getCategories().map((c) => ({ label: c, value: c })),
        []
    );

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return pictograms.filter((p) => {
            const matchesQuery = !q || p.name.toLowerCase().includes(q);
            const matchesCat = !categoryFilter || p.category.toLowerCase() === categoryFilter.toLowerCase();
            return matchesQuery && matchesCat;
        });
    }, [pictograms, search, categoryFilter]);

    return (
        <PageLayout title="Pittogrammi Personali" footer={<CustomFooter activeTab={3} />} fullWidth>
            {/* Search + Filter on one row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'nowrap' }}>
                <Input
                    allowClear
                    prefix={<SearchOutlined />}
                    placeholder="Cerca per nome"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ flex: 1, minWidth: 140 }}
                />
                <Select
                    allowClear
                    placeholder="Filtra per categoria"
                    style={{ flex: 1, minWidth: 140 }}
                    options={categoriesOptions}
                    value={categoryFilter}
                    onChange={setCategoryFilter}
                    showSearch
                    optionFilterProp="label"
                />
            </div>

            {/* Grid list with Add card as first tile; content scrolls within PageLayout's container */}
            <div style={{ width: '100%' }}>
                <List
                    style={{ margin: 0 }}
                    grid={{ gutter: 16, xs: 2, sm: 3, md: 4, lg: 5, xl: 6, xxl: 6 }}
                    dataSource={[{ __add: true } as any, ...filtered]}
                    pagination={{ pageSize: 24, hideOnSinglePage: true }}
                    renderItem={(item: any) => {
                        if (item.__add) {
                            return (
                                <List.Item key="add-card" style={{ minWidth: 0 }}>
                                    <Card
                                        hoverable
                                        size="small"
                                        onClick={showModal}
                                        style={{
                                            borderRadius: 16,
                                            boxShadow: 'var(--shadow-sm)',
                                            borderStyle: 'dashed',
                                            borderWidth: 2,
                                            borderColor: 'var(--ios-gray-light)'
                                        }}
                                        bodyStyle={{ minHeight: 72, padding: 12 }}
                                        cover={
                                            <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ios-text-secondary)', gap: 8, flexDirection: 'column' }}>
                                                <PlusOutlined style={{ fontSize: 28 }} />
                                                <span style={{ fontWeight: 600 }}>Aggiungi</span>
                                            </div>
                                        }
                                        actions={[
                                            // hidden placeholder action to match actions bar height
                                            <span key="placeholder" style={{ visibility: 'hidden' }}><DeleteOutlined /></span>
                                        ]}
                                    >
                                        <Card.Meta
                                            title={<span style={{ fontSize: 15, fontWeight: 600 }}>Aggiungi</span>}
                                            description={<span style={{ color: 'var(--ios-text-secondary)', fontSize: 14 }}>Nuovo pittogramma</span>}
                                        />
                                    </Card>
                                </List.Item>
                            );
                        }
                        const p = item as PersonalPictogram;
                        return (
                            <List.Item key={p.name} style={{ minWidth: 0 }}>
                                <Card
                                    hoverable
                                    size="small"
                                    style={{ borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}
                                    bodyStyle={{ minHeight: 72, padding: 12 }}
                                    cover={
                                        <Image
                                            src={p.photoUrl}
                                            alt={p.name}
                                            height={140}
                                            style={{ objectFit: "cover", width: '100%' }}
                                            placeholder
                                            preview={true}
                                        />
                                    }
                                    actions={[
                                        <Tooltip title="Elimina" key="delete">
                                            <Popconfirm
                                                title="Eliminare questo pittogramma?"
                                                okText="Sì"
                                                cancelText="No"
                                                onConfirm={() => handleDelete(p)}
                                            >
                                                <DeleteOutlined style={{ color: '#ff4d4f', fontSize: 18 }} />
                                            </Popconfirm>
                                        </Tooltip>
                                    ]}
                                >
                                    <Card.Meta
                                        title={<span style={{ fontSize: 15, fontWeight: 600 }}>{p.name}</span>}
                                        description={<span style={{ color: 'var(--ios-text-secondary)', fontSize: 14 }}>{p.category}</span>}
                                    />
                                </Card>
                            </List.Item>
                        );
                    }}
                />
            </div>

            <Modal
                title="Aggiungi una nuova foto"
                open={isModalVisible}
                onOk={handleOk}
                onCancel={handleCancel}
                okText="Aggiungi"
                cancelText="Annulla"
            >
                <Form form={form} layout="vertical" onFinish={handleOk} requiredMark={false}>
                    <Form.Item
                        label="Nome"
                        name="name"
                        rules={[
                            { required: true, message: "Inserisci il nome della foto!" },
                            { min: 2, message: "Almeno 2 caratteri" },
                        ]}
                    >
                        <Input placeholder="Nome della foto" maxLength={60} allowClear />
                    </Form.Item>
                    <Form.Item label="Categoria" name="category" rules={[{ required: true, message: "Seleziona una categoria!" }] }>
                        <Select
                            placeholder="Seleziona una categoria"
                            options={categoriesOptions}
                            showSearch
                            optionFilterProp="label"
                            allowClear
                        />
                    </Form.Item>
                    <Form.Item
                        label="Carica Foto"
                        name="photo"
                        valuePropName="fileList"
                        getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
                        rules={[{ required: true, message: "Carica una foto!" }]}
                    >
                        <Upload.Dragger name="photo" maxCount={1} beforeUpload={() => false} accept="image/*">
                            <p className="ant-upload-drag-icon"><UploadOutlined /></p>
                            <p className="ant-upload-text">Trascina un'immagine qui o clicca per selezionare</p>
                            <p className="ant-upload-hint">PNG, JPG o JPEG. Max 10MB</p>
                        </Upload.Dragger>
                    </Form.Item>
                </Form>
            </Modal>
        </PageLayout>
    );
};

// Riduce dimensioni e qualità di una data URL immagine per minimizzare lo spazio su localStorage
async function compressDataUrl(dataUrl: string, maxW = 384, maxH = 384, quality = 0.74): Promise<string> {
    return new Promise((resolve, reject) => {
        const imgEl = document.createElement('img');
        imgEl.onload = () => {
            let { width, height } = imgEl as HTMLImageElement;
            const ratio = Math.min(maxW / width, maxH / height, 1);
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(width * ratio);
            canvas.height = Math.round(height * ratio);
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('ctx'));
            ctx.drawImage(imgEl, 0, 0, canvas.width, canvas.height);
            const out = canvas.toDataURL('image/jpeg', quality);
            resolve(out);
        };
        imgEl.onerror = reject;
        imgEl.src = dataUrl;
    });
}
