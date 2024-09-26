// Store.ts
import { Dialog } from 'telegram/tl/custom/dialog';
import { Database } from './Database';
import bigInt from 'big-integer';
import { Api } from 'telegram';
import { parse } from 'flatted';

export type SerializableDialog = Omit<Dialog, 'id'> & { id: string };

export class Store {
    private db: Database;

    constructor(dbName: string, version: number) {
        this.db = new Database(dbName, version);
    }

    private serializeDialog(dialog: Dialog): SerializableDialog {
        let serializedDialog = {
            ...dialog,
            id: dialog.id ? dialog.id.toString() : ''
        };
        return serializedDialog;
    }

    private deserializeDialog(serializedDialog: SerializableDialog): Dialog {
        return {
            ...serializedDialog,
            id: bigInt(serializedDialog.id)
        } as Dialog;
    }

    public async addDialog(dialog: Dialog): Promise<void> {
        if (!dialog.id) {
            throw new Error("Dialog object must have an 'id' property.");
        }
        const dialogToSave = this.serializeDialog(dialog);
        await this.db.addObject<SerializableDialog>('dialogs', dialogToSave);
    }

    public async addMessage(message: Api.Message): Promise<void> {
        await this.db.addObject('messages', message);
    }

    public async addImage(dialogId: bigInt.BigInteger, buffer: ArrayBuffer): Promise<void> {
        await this.db.addObject('images', { dialogId: dialogId.toString(), buffer });
    }

    public async getDialog(id: string): Promise<Dialog|null> {
        const serializedDialog = await this.db.getObject<SerializableDialog>('dialogs', id);
        return serializedDialog ? this.deserializeDialog(serializedDialog) : null;
    }

    public async getMessagesByDialogId(dialogId: bigInt.BigInteger, limit: number): Promise<Api.Message[]> {
        const messages = (await this.db.getAllObjects<Api.Message>('messages')).slice(-limit);
        return messages.filter((msg: Api.Message) => (msg.fromId as Api.PeerUser).userId === dialogId);
    }

    public async getImageByDialogId(dialogId: string): Promise<Buffer|null> {
        const image = await this.db.getObject<{ dialogId: string, buffer: Buffer }>('images', dialogId);
        if (!image) {
            return null;
        }
        return image.buffer;
    }

    public async getDialogs(): Promise<Dialog[]> {
        const dialogs = await this.db.getAllObjects<SerializableDialog>('dialogs');
        return dialogs.map(this.deserializeDialog);
    }

    public async updateDialog(dialog: Dialog): Promise<void> {
        let serializedDialog = this.serializeDialog(dialog);
        await this.db.updateObject<SerializableDialog>('dialogs', serializedDialog);
    }

    public async updateImage(dialogId: string, buffer: Buffer): Promise<void> {
        await this.db.updateObject<{ dialogId: string, buffer: Buffer }>('images', { dialogId, buffer });
    }

    public async updateMessage(message: Api.Message): Promise<void> {
        await this.db.updateObject<Api.Message>('messages', message);
    }
}
