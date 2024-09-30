import { Api, TelegramClient, Logger } from "telegram";
import { TotalList } from "telegram/Helpers";
import { StringSession } from "telegram/sessions";
import { Dialog } from "telegram/tl/custom/dialog";
import { Entity } from "telegram/define";
import { EventBuilder } from "telegram/events/common";
import { Buffer } from "buffer";
import { LogLevel } from "telegram/extensions/Logger";

const apiId = 27988472;
const apiHash = "aac13796c816fee0e9557169aecbc071";

export class TgApi {
    client: TelegramClient;
    session: StringSession;

    constructor(stringSession: StringSession) {
        this.session = stringSession;
        this.client = this.createClient(stringSession);
    }

    // Creazione di un client Telegram con configurazioni comuni centralizzate
    private createClient(session: StringSession): TelegramClient {
        return new TelegramClient(session, apiId, apiHash, {
            connectionRetries: 5,
            autoReconnect: true,
            downloadRetries: 5,
            maxConcurrentDownloads: 5,
            baseLogger: new Logger(LogLevel.WARN),
        });
    }

    // Metodo per settare una nuova sessione
    async setClient(stringSession: StringSession | string) {
        if (typeof stringSession === "string") {
            stringSession = new StringSession(stringSession);
        }
        this.session = stringSession;
        this.client = this.createClient(stringSession);
    }

    // Metodo per connettersi, assicurandosi che la connessione sia stabilita una sola volta
    async connect() {
        if (this.client.connected) return;
        try {
            await this.client.connect();
            console.log("Connesso a Telegram");
        } catch (error) {
            console.error("Errore nella connessione a Telegram:", error);
        }
    }

    // Metodo per verificare se l'utente è loggato
    async isClientLogged(): Promise<boolean> {
        await this.connect();
        const me = await this.client.getMe();
        return me && me.id !== undefined;
    }

    // Invia un messaggio a un determinato chatId
    async sendMessage(chatId: bigInt.BigInteger, message: string): Promise<Api.Message> {
        await this.connect();
        return await this.client.sendMessage(chatId, { message });
    }

    // Ottiene i messaggi da una chat specifica
    async getMessages(chatId: bigInt.BigInteger, options?: { limit?: number, max_id?: number }): Promise<TotalList<Api.Message>> {
        await this.connect();
        const { limit, max_id } = options || {};
        await this.client.markAsRead(chatId);
        return await this.client.getMessages(chatId, { limit, maxId: max_id });
    }

    // Ottiene la foto profilo di un utente
    async getProfilePhotos(userId: bigInt.BigInteger): Promise<string | Buffer | undefined> {
        await this.connect();
        return await this.client.downloadProfilePhoto(userId, { isBig: false }) as string | Buffer | undefined;
    }

    // Ottiene l'ID di una chat tramite username
    async getChatId(username: string): Promise<bigInt.BigInteger> {
        await this.connect();
        const entity = await this.client.getEntity(username);
        return entity.id;
    }

    // Scarica media specifico
    async downloadMedia(media: Api.TypeMessageMedia, quality: number): Promise<any> {
        await this.connect();
        return await this.client.downloadMedia(media, { thumb: quality });
    }

    // Ottiene tutti i dialoghi (filtrati per gruppi e utenti)
    async getDialogs(): Promise<TotalList<Dialog>> {
        await this.connect();
        const dialogs = await this.client.getDialogs({ archived: false });
        return dialogs.filter(dialog => dialog.isGroup || !dialog.isChannel || dialog.isUser);
    }

    // Ottiene i dettagli di un singolo dialog
    async getDialog(chatId: bigInt.BigInteger): Promise<Entity> {
        await this.connect();
        return await this.client.getEntity(chatId);
    }

    // Ottiene informazioni sull'utente attualmente loggato
    async getMe(): Promise<Api.User> {
        await this.connect();
        return await this.client.getMe();
    }

    // Gestisce gli aggiornamenti ricevuti da Telegram con un callback
    async handleUpdates(callback: (update: Api.Updates) => void, event?: EventBuilder) {
        await this.connect();
        if (event) {
            this.client.addEventHandler(callback, event);
        } else {
            this.client.addEventHandler(callback);
        }
    }

    // Invia il codice di verifica per l'autenticazione
    async sendCode(phone: string): Promise<{ phoneCodeHash: string, isCodeViaApp: boolean }> {
        await this.connect();
        return await this.client.sendCode({ apiId, apiHash }, phone);
    }

    // Esegue il login con codice di verifica
    async signIn(phone: string, code: string, phoneCodeHash: string): Promise<string> {
        await this.connect();
        const result = await this.client.invoke(
            new Api.auth.SignIn({
                phoneNumber: phone,
                phoneCodeHash,
                phoneCode: code
            })
        );
        return this.client.session.save() as unknown as string;
    }
}
