import { PlusOutlined } from "@ant-design/icons";
import { Button, Popover } from "antd";
import { useEffect, useState } from "react";

interface ChatSendMediaProps {
    media: File | undefined;
    setMedia: React.Dispatch<React.SetStateAction<File | undefined>>;
}

export const ChatSendMedia: React.FC<ChatSendMediaProps> = ({ media, setMedia }) => {
    const [ref, setRef] = useState<HTMLInputElement | null>(null);
    const [showFile, setShowFile] = useState<boolean>(false);
    const [fileName, setFileName] = useState<string | null>(null);

    // Aggiorna lo stato `fileName` e `showFile` quando `media` cambia
    useEffect(() => {
        if (media) {
            setFileName(media.name);
            setShowFile(true);
        } else {
            setFileName(null);
            setShowFile(false);
        }
    }, [media]);

    const handleSendMedia = () => {
        if (ref) {
            ref.click();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            let file = e.target.files[0];
            setMedia(file);
        }
    };

    const popoverContent = (
        <div>
            {fileName?.match(/\.(jpeg|jpg|png|gif)$/) && media ? (
                <img src={URL.createObjectURL(media)} alt={fileName} style={{ width: "60px" }} />
            ) : (
                <p>{fileName || "No file selected"}</p>
            )}
        </div>
    );

    return (
        <div>
            <Popover
                content={popoverContent}
                visible={showFile}
                placement="top"
            >
                <Button type="primary" icon={<PlusOutlined />} onClick={handleSendMedia} />
            </Popover>
            <input
                onChange={handleFileChange}
                type="file"
                accept="*"
                style={{ display: "none" }}
                ref={(ref) => setRef(ref)}
            />
        </div>
    );
};
