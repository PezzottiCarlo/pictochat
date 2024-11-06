import React, { useState } from "react";
import { Layout, Button, Modal, Form, Input, Select, Upload, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";

const { Content } = Layout;
const { Option } = Select;

interface Pictogram {
    name: string;
    category: string;
    photoUrl: string;
}

export const PersonalPictograms: React.FC = () => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [pictograms, setPictograms] = useState<Pictogram[]>([]);

    const showModal = () => {
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        form.resetFields();
    };

    const handleOk = () => {
        form
            .validateFields()
            .then((values) => {
                const file = values.photo[0].originFileObj;
                const reader = new FileReader();
                reader.onload = () => {
                    const newPictogram: Pictogram = {
                        name: values.name,
                        category: values.category,
                        photoUrl: reader.result as string,
                    };
                    setPictograms([...pictograms, newPictogram]);
                    message.success("Immagine aggiunta con successo!");
                    setIsModalVisible(false);
                    form.resetFields();
                };
                reader.readAsDataURL(file);
            })
            .catch((info) => {
                console.log("Validate Failed:", info);
            });
    };

    return (
        <>
            <Layout style={{ minHeight: "100vh" }}>
                <Content style={{ display: "flex", flexDirection: "column", height: "100vh" }}>

                    {/* Sezione del pulsante */}
                    <div style={{ flex: .3, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Button type="primary" onClick={showModal}>
                            <UploadOutlined />
                            Aggiungi Foto
                        </Button>
                    </div>

                    {/* Sezione delle immagini */}
                    <div style={{
                        flex: 1,
                        overflowY: "auto",
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "10px",
                        justifyContent: "center",
                        alignItems: "center"
                    }}>
                        {pictograms.map((pictogram, index) => (
                            <div key={index} style={{ textAlign: "center" }}>
                                <img
                                    src={pictogram.photoUrl}
                                    alt={pictogram.name}
                                    style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "5px" }}
                                />
                                <p>{pictogram.name}</p>
                                <p style={{ fontSize: "12px", color: "gray" }}>{pictogram.category}</p>
                            </div>
                        ))}
                    </div>
                </Content>
            </Layout>
            <Modal
                title="Aggiungi una nuova foto"
                open={isModalVisible}
                onOk={handleOk}
                onCancel={handleCancel}
                
                okText="Aggiungi"
                cancelText="Annulla">
                <Form form={form} >
                    <Form.Item
                        label="Nome"
                        name="name"
                        rules={[{ required: true, message: "Inserisci il nome della foto!" }]}>
                        <Input placeholder="Nome della foto" />
                    </Form.Item>

                    <Form.Item
                        label="Categoria"
                        name="category"
                        rules={[{ required: true, message: "Seleziona una categoria!" }]}>
                        <Select placeholder="Seleziona una categoria">
                            <Option value="soggetto">Soggetto</Option>
                            <Option value="oggetto">Oggetto</Option>
                            <Option value="verbo">Verbo</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        label="Carica Foto"
                        name="photo"
                        valuePropName="fileList"
                        getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
                        rules={[{ required: true, message: "Carica una foto!" }]}>
                        <Upload name="photo" listType="picture" maxCount={1} beforeUpload={() => false}>
                            <Button icon={<UploadOutlined />}>Scegli File</Button>
                        </Upload>
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};
