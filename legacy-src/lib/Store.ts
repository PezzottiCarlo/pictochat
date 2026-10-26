import { Dialog } from 'telegram/tl/custom/dialog';
import { Database } from './Database';
import bigInt from 'big-integer';
import { Api } from 'telegram';

export type SerializableDialog = Omit<Dialog, 'id'> & { id: string };

export class Store {
    
    private db: Database;

    constructor(dbName: string, version: number) {
        this.db = new Database(dbName, version);
    }


    /**
     * Serializes a Dialog object to a SerializableDialog.
     * @param dialog - The Dialog object to serialize.
     * @returns The serialized dialog.
     */
    private serializeDialog(dialog: Dialog): SerializableDialog {
        let serializedDialog = {
            ...dialog,
            id: dialog.id ? dialog.id.toString() : ''
        };
        return serializedDialog;
    }

    /**
     * Deserializes a SerializableDialog object to a Dialog.
     * @param serializedDialog - The SerializableDialog object to deserialize.
     * @returns The deserialized dialog.
     */
    private deserializeDialog(serializedDialog: SerializableDialog): Dialog {
        return {
            ...serializedDialog,
            id: bigInt(serializedDialog.id)
        } as Dialog;
    }

    /**
     * Adds a dialog to the database.
     * @param dialog - The Dialog object to add.
     * @throws Will throw an error if the dialog does not have an 'id' property.
     */
    public async addDialog(dialog: Dialog): Promise<void> {
        if (!dialog.id) {
            throw new Error("Dialog object must have an 'id' property.");
        }
        const dialogToSave = this.serializeDialog(dialog);
        await this.db.addObject<SerializableDialog>('dialogs', dialogToSave);
    }

    /**
     * Adds a message to the database.
     * @param message - The message object to add.
     */
    public async addMessage(message: Api.Message): Promise<void> {
        const dialogId = ((message.fromId as any)?.userId || (message.peerId as any)?.userId || (message.peerId as any)?.channelId || (message.peerId as any)?.chatId)?.toString?.();
        const payload = { ...message, dialogId } as any;
        await this.db.addObject('messages', payload);
    }

    /**
     * Adds an image to the database.
     * @param dialogId - The ID of the dialog associated with the image.
     * @param buffer - The image data.
     */
    public async addImage(dialogId: bigInt.BigInteger, buffer: ArrayBuffer): Promise<void> {
        await this.db.addObject('images', { dialogId: dialogId.toString(), buffer });
    }

    /**
     * Retrieves a dialog from the database by its ID.
     * @param id - The ID of the dialog to retrieve.
     * @returns The dialog object or null if not found.
     */
    public async getDialog(id: string): Promise<Dialog|null> {
        const serializedDialog = await this.db.getObject<SerializableDialog>('dialogs', id);
        return serializedDialog ? this.deserializeDialog(serializedDialog) : null;
    }

    /**
     * Retrieves messages associated with a dialog ID.
     * @param dialogId - The ID of the dialog.
     * @param limit - The maximum number of messages to retrieve.
     * @returns An array of messages.
     */
    public async getMessagesByDialogId(dialogId: bigInt.BigInteger, limit: number): Promise<Api.Message[]> {
        const db = (this as any).db as Database;
        const database = await (db as any).openDB();
        return new Promise<Api.Message[]>((resolve, reject) => {
            try {
                const tx = database.transaction('messages', 'readonly');
                const store = tx.objectStore('messages');
                const index = store.index('byDialogId');
                const request = index.getAll(dialogId.toString());
                request.onsuccess = () => {
                    const all = (request.result as Api.Message[]) || [];
                    // Return last N by id (best effort, Telegram ids grow)
                    const sorted = all.sort((a: any, b: any) => (a.id || 0) - (b.id || 0));
                    resolve(sorted.slice(-limit));
                };
                request.onerror = () => reject(request.error);
            } catch (e) {
                reject(e as any);
            }
        });
    }

    /**
     * Retrieves up to `limit` messages older than `beforeId` for a dialog from cache.
     */
    public async getMessagesByDialogIdBefore(dialogId: bigInt.BigInteger, beforeId: number, limit: number): Promise<Api.Message[]> {
        const db = (this as any).db as Database;
        const database = await (db as any).openDB();
        return new Promise<Api.Message[]>((resolve, reject) => {
            try {
                const tx = database.transaction('messages', 'readonly');
                const store = tx.objectStore('messages');
                const index = store.index('byDialogId');
                const request = index.getAll(dialogId.toString());
                request.onsuccess = () => {
                    const all = (request.result as Api.Message[]) || [];
                    const older = all.filter((m: any) => (m.id || 0) < beforeId);
                    // Take the most recent among the older ones
                    const desc = older.sort((a: any, b: any) => (b.id || 0) - (a.id || 0));
                    const page = desc.slice(0, limit);
                    // Return ascending for UI
                    resolve(page.sort((a: any, b: any) => (a.id || 0) - (b.id || 0)));
                };
                request.onerror = () => reject(request.error);
            } catch (e) {
                reject(e as any);
            }
        });
    }

    /**
     * Retrieves an image associated with a dialog ID.
     * @param dialogId - The ID of the dialog.
     * @returns The image buffer or null if not found.
     */
    public async getImageByDialogId(dialogId: string): Promise<ArrayBuffer | Buffer | null> {
        const image = await this.db.getObject<{ dialogId: string, buffer: ArrayBuffer | Buffer }>('images', dialogId);
        if (!image) {
            return null;
        }
        return image.buffer;
    }

    /**
     * Retrieves all dialogs from the database.
     * @returns An array of dialogs.
     */
    public async getDialogs(): Promise<Dialog[]> {
        const dialogs = await this.db.getAllObjects<SerializableDialog>('dialogs');
        return dialogs.map(this.deserializeDialog);
    }

    /**
     * Updates a dialog in the database.
     * @param dialog - The Dialog object to update.
     */
    public async updateDialog(dialog: Dialog): Promise<void> {
        let serializedDialog = this.serializeDialog(dialog);
        await this.db.updateObject<SerializableDialog>('dialogs', serializedDialog);
    }

    /**
     * Updates an image in the database.
     * @param dialogId - The ID of the dialog associated with the image.
     * @param buffer - The new image data.
     */
    public async updateImage(dialogId: string, buffer: Buffer): Promise<void> {
        await this.db.updateObject<{ dialogId: string, buffer: Buffer }>('images', { dialogId, buffer });
    }

    /**
     * Updates a message in the database.
     * @param message - The message object to update.
     */
    public async updateMessage(message: Api.Message): Promise<void> {
        const dialogId = ((message.fromId as any)?.userId || (message.peerId as any)?.userId || (message.peerId as any)?.channelId || (message.peerId as any)?.chatId)?.toString?.();
        const payload = { ...message, dialogId } as any;
        await this.db.updateObject<Api.Message>('messages', payload);
    }

    // --- Media cache helpers ---
    public async addMedia(id: string, buffer: ArrayBuffer | Buffer): Promise<void> {
        await this.db.addObject('media', { id, buffer });
    }

    public async getMedia(id: string): Promise<ArrayBuffer | Buffer | null> {
        const item = await this.db.getObject<{ id: string, buffer: ArrayBuffer | Buffer }>('media', id);
        return item ? item.buffer : null;
    }

    /**
     * Marks a dialog as read by setting its unread count to 0.
     * @param id - The ID of the dialog to mark as read.
     */
    public async markAsRead(id: string): Promise<void> {
        const dialog = await this.getDialog(id);
        if (dialog) {
            dialog.unreadCount = 0;
            await this.updateDialog(dialog);
        }
    }

    /**
     * Drops the entire database.
     */
    public async dropDatabase(): Promise<void> {
        await this.db.dropDB();
    }
}
