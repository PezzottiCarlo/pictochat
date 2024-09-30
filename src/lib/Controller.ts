import { StringSession } from "telegram/sessions";
import { AAC } from "./AAC";
import { Store } from "./Store";
import { TgApi } from "./TgApi";
import { Dialog } from "telegram/tl/custom/dialog";
import { Api } from "telegram";

export class Controller {
    static tgApi = new TgApi(localStorage.getItem('stringSession') ? new StringSession(localStorage.getItem('stringSession') as string) : new StringSession(''));
    static aac = new AAC("it");
    static storage = new Store('pictochat-storage', 1);

    static async getDialog(id: bigInt.BigInteger): Promise<Dialog | null> {
        let dialog = await this.storage.getDialog(id.toString());
        return dialog;
    }

    static async getDialogs() : Promise<Dialog[]>{
        let storedDialogs = await this.storage.getDialogs();
        
        if (storedDialogs.length === 0) {
            storedDialogs = await this.tgApi.getDialogs();
            for (const dialog of storedDialogs) {
                await this.storage.addDialog(dialog);
            }
        }

        this.tgApi.getDialogs().then((dialogs) => {
            for (const dialog of dialogs) {
                if (storedDialogs.find((d) => d.id?.equals(dialog.id as bigInt.BigInteger))) {
                    console.log('updating dialog');
                    this.storage.updateDialog(dialog);
                }else{
                    this.storage.addDialog(dialog);
                }
            }
        });
        return storedDialogs;
    }

    static async getProfilePic(id: bigInt.BigInteger): Promise<Buffer> {
        let photo = await this.storage.getImageByDialogId(id.toString());
        if (!photo) {
            photo = await this.tgApi.getProfilePhotos(id) as Buffer;
            if (photo) {
                await this.storage.addImage(id, photo);
            }
        }
        
        return photo;
    }

    static async getMessages(chatId: bigInt.BigInteger, limit: number): Promise<Api.Message[] | any> {
        //chache messages
    }
}