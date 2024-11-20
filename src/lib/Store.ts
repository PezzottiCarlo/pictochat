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
        await this.db.addObject('messages', message);
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
        const messages = (await this.db.getAllObjects<Api.Message>('messages')).slice(-limit);
        return messages.filter((msg: Api.Message) => (msg.fromId as Api.PeerUser).userId === dialogId);
    }

    /**
     * Retrieves an image associated with a dialog ID.
     * @param dialogId - The ID of the dialog.
     * @returns The image buffer or null if not found.
     */
    public async getImageByDialogId(dialogId: string): Promise<Buffer|null> {
        const image = await this.db.getObject<{ dialogId: string, buffer: Buffer }>('images', dialogId);
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
        await this.db.updateObject<Api.Message>('messages', message);
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
