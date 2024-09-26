import { Api, Logger, TelegramClient } from "telegram";
import { TotalList } from "telegram/Helpers";
import { StringSession } from "telegram/sessions";
import { Dialog } from "telegram/tl/custom/dialog";
import { Entity } from "telegram/define";
import { EventBuilder } from "telegram/events/common";
import { Buffer } from "buffer";

const apiId = 27988472;
const apiHash = "aac13796c816fee0e9557169aecbc071";

export class TgApi {
    client: TelegramClient;

    constructor(stringSession: StringSession) {
        this.client = new TelegramClient(stringSession, apiId, apiHash, {
            connectionRetries: 5,
            autoReconnect: true,
            downloadRetries: 5,
            maxConcurrentDownloads: 5
        });
        
    }

    async setClient(stringSession: StringSession | string) {
        this.client = new TelegramClient(stringSession, apiId, apiHash, {
            connectionRetries: 5,
            autoReconnect: true,
            downloadRetries: 5,
            maxConcurrentDownloads: 5
        });
    }

    async isClientLogged(): Promise<boolean> {
        await this.connect();
        return (await this.client.getMe()).id !== undefined;
    }

    async sendMessage(chatId: bigInt.BigInteger, message: string): Promise<Api.Message> {
        await this.connect();
        return await this.client.sendMessage(chatId, { message });
    }

    async getMessages(chatId: bigInt.BigInteger, options?: { limit?: number, max_id?: number }): Promise<TotalList<Api.Message>> {
        await this.connect();
        const { limit, max_id } = options || {};
        await this.client.markAsRead(chatId);
        return await this.client.getMessages(chatId, { limit, maxId: max_id});
    }
    

    async getProfilePhotos(userId: bigInt.BigInteger): Promise<string | Buffer | undefined> {
        await this.connect();
        let image = await this.client.downloadProfilePhoto(userId, {
            isBig: false
        });
        return image as string | Buffer | undefined;
    }


    async getChatId(username: string): Promise<bigInt.BigInteger> {
        await this.connect();
        const result = await this.client.getEntity(username);
        return result.id;
    }

    async downloadMedia(media: Api.TypeMessageMedia, quality: number): Promise<any> {
        await this.connect();
        return await this.client.downloadMedia(media, {
            thumb: quality
        });
    }

    async getDialogs(): Promise<TotalList<Dialog>> {
        await this.connect();
        let dialogs = await this.client.getDialogs({archived: false});
        dialogs = dialogs.filter(dialog => dialog.isGroup || dialog.isChannel===false || dialog.isUser);
        return dialogs;
    }

    async getDialog(chatId: bigInt.BigInteger): Promise<Entity> {
        await this.connect();
        return (await this.client.getEntity(chatId));
    }

    async getMe(): Promise<Api.User> {
        await this.connect();
        return await this.client.getMe();
    }

    async handleUpdates(callback: (update: Api.Updates) => void, event: EventBuilder|undefined) {
        await this.connect();
        if (event) {
            this.client.addEventHandler(callback, event);
        }
        this.client.addEventHandler(callback);
    }

    async sendCode(phone: string): Promise<{ phoneCodeHash: string, isCodeViaApp: boolean }> {
        await this.connect();
        const res = await this.client.sendCode({
            apiHash: apiHash,
            apiId: apiId,
        }, phone);
        return res;
    }

    async singIn(phone: string, code: string, phoneCodeHash: string): Promise<string> {
        await this.connect();
        let result = await this.client.invoke(
            new Api.auth.SignIn({
                phoneNumber: phone,
                phoneCodeHash: phoneCodeHash,
                phoneCode: code
            })
        );
        let stringSession = this.client.session.save() as unknown as string;
        return stringSession;
    }


    async connect() {
        if (!this.client.connected) {
            await this.client.connect();
        }
    }
}
