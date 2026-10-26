import { Api, TelegramClient, Logger } from "telegram";
import { TotalList } from "telegram/Helpers";
import { StringSession } from "telegram/sessions";
import { Dialog } from "telegram/tl/custom/dialog";
import { Entity } from "telegram/define";
import { EventBuilder } from "telegram/events/common";
import { Buffer } from "buffer";
import { LogLevel } from "telegram/extensions/Logger";
import { ParseInterface } from "telegram/client/messageParse";
import bigInt from "big-integer";

const apiId = 27988472;
const apiHash = "aac13796c816fee0e9557169aecbc071";

export class TgApi {
    client: TelegramClient;
    session: StringSession;
    // Ensures we don't attempt multiple concurrent connections
    private connecting?: Promise<void>;
    private lastConnectFailAt?: number;

    /**
     * @param {StringSession} stringSession - The session string for the Telegram client.
     */
    constructor(stringSession: StringSession) {
        this.session = stringSession;
        this.client = this.createClient(stringSession);
    }

    /**
     * Creates a new Telegram client with common configurations.
     * @param {StringSession} session - The session string for the Telegram client.
     * @returns {TelegramClient} - The configured Telegram client.
     */
    private createClient(session: StringSession): TelegramClient {
        return new TelegramClient(session, apiId, apiHash, {
            connectionRetries: 5,
            autoReconnect: true,
            downloadRetries: 5,
            maxConcurrentDownloads: 5,
            baseLogger: new Logger(LogLevel.WARN),
        });
    }

    /**
     * Sets a new session for the Telegram client.
     * @param {StringSession | string} stringSession - The new session string.
     */
    async setClient(stringSession: StringSession | string) {
        if (typeof stringSession === "string") {
            stringSession = new StringSession(stringSession);
        }
        this.session = stringSession;
        this.client = this.createClient(stringSession);
        this.connecting = undefined; // reset connecting state when client changes
    }

    /**
     * Connects to the Telegram client, ensuring the connection is established only once.
     */
    async connect() {
        if (this.client.connected) return;
        if (this.connecting) {
            // Another call is already establishing the connection
            try { await this.connecting; } catch { /* ignore, next calls will retry */ }
            return;
        }
        this.connecting = (async () => {
            try {
                // simple backoff to avoid storms when a previous attempt just failed
                if (this.lastConnectFailAt) {
                    const elapsed = Date.now() - this.lastConnectFailAt;
                    const waitMs = Math.max(0, 1200 - elapsed);
                    if (waitMs > 0) await new Promise(res => setTimeout(res, waitMs));
                }
                await this.client.connect();
                console.log("Connesso a Telegram");
                this.lastConnectFailAt = undefined;
            } catch (error) {
                // Surface minimal info once to avoid noisy logs
                console.warn("Telegram connect failed:", (error as Error)?.message || error);
                this.lastConnectFailAt = Date.now();
                throw error;
            } finally {
                // Always clear connecting so future calls can retry if needed
                this.connecting = undefined;
            }
        })();
        return this.connecting;
    }

    /**
     * Checks if the user is logged in.
     * @returns {Promise<boolean>} - True if the user is logged in, false otherwise.
     */
    async isClientLogged(): Promise<boolean> {
        await this.connect();
        const me = await this.client.getMe();
        return me && me.id !== undefined;
    }

    /**
     * Sends a message to a specified chat.
     * @param {bigInt.BigInteger} chatId - The ID of the chat.
     * @param {string} message - The message to send.
     * @returns {Promise<Api.Message>} - The sent message.
     */
    async sendMessage(chatId: bigInt.BigInteger, message: string): Promise<Api.Message> {
        await this.connect();
        const peer = await this.client.getInputEntity(chatId);
        return await this.client.sendMessage(peer, { message });
    }

    /**
     * Retrieves messages from a specific chat.
     * @param {bigInt.BigInteger} chatId - The ID of the chat.
     * @param {Object} [options] - Optional parameters for retrieving messages.
     * @param {number} [options.limit] - The maximum number of messages to retrieve.
     * @param {number} [options.max_id] - The maximum ID of the messages to retrieve.
     * @returns {Promise<TotalList<Api.Message>>} - The list of retrieved messages.
     */
    async getMessages(chatId: bigInt.BigInteger, options?: { limit?: number, max_id?: number }): Promise<TotalList<Api.Message>> {
        await this.connect();
        const { limit, max_id } = options || {};
        const peer = await this.client.getInputEntity(chatId);
        await this.client.markAsRead(peer);
        return await this.client.getMessages(peer, { limit, maxId: max_id });
    }


    /**
     * Retrieves the profile photo of a user.
     * @param {bigInt.BigInteger} userId - The ID of the user.
     * @returns {Promise<string | Buffer | undefined>} - The profile photo as a string or buffer, or undefined if not found.
     */
    async getProfilePhotos(userId: bigInt.BigInteger): Promise<string | Buffer | undefined> {
        await this.connect();
        return await this.client.downloadProfilePhoto(userId, { isBig: false }) as string | Buffer | undefined;
    }

    /**
     * Retrieves the high-quality (big) profile photo of a user.
     */
    async getProfilePhotosBig(userId: bigInt.BigInteger): Promise<string | Buffer | undefined> {
        await this.connect();
        return await this.client.downloadProfilePhoto(userId, { isBig: true }) as string | Buffer | undefined;
    }

    /**
     * Retrieves the chat ID by username.
     * @param {string} username - The username of the chat.
     * @returns {Promise<bigInt.BigInteger>} - The ID of the chat.
     */
    async getChatId(username: string): Promise<bigInt.BigInteger> {
        await this.connect();
        const entity = await this.client.getEntity(username);
        return entity.id;
    }

    /**
     * Downloads specific media.
     * @param {Api.TypeMessageMedia} media - The media to download.
     * @param {number} quality - The quality of the media.
     * @returns {Promise<any>} - The downloaded media.
     */
    async downloadMedia(media: Api.Message | Api.TypeMessageMedia, quality: number): Promise<any> {
        try {
            await this.connect();
            return await this.client.downloadMedia(media, { thumb: quality });
        } catch (error){return}
    }


    /**
     * Downloads the original media (no thumbnail), useful for document previews like PDFs.
     */
    async downloadOriginalMedia(media: Api.TypeMessageMedia): Promise<any> {
        try {
            await this.connect();
            return await this.client.downloadMedia(media);
        } catch (error){ return }
    }

    /**
     * Retrieves all dialogs (filtered for groups and users).
     * @returns {Promise<TotalList<Dialog>>} - The list of dialogs.
     */
    async getDialogs(): Promise<TotalList<Dialog>> {
        await this.connect();
        const dialogs = await this.client.getDialogs({ archived: false });
        return dialogs.filter(dialog => dialog.isGroup || !dialog.isChannel || dialog.isUser);
    }

    /**
     * Retrieves the details of a single dialog.
     * @param {bigInt.BigInteger} chatId - The ID of the chat.
     * @returns {Promise<Entity>} - The details of the dialog.
     */
    async getEntity(chatId: bigInt.BigInteger): Promise<Entity> {
        await this.connect();
        return await this.client.getEntity(chatId);
    }

    /**
     * Retrieves information about the currently logged-in user.
     * @returns {Promise<Api.User>} - The information about the user.
     */
    async getMe(): Promise<Api.User> {
        await this.connect();
        return await this.client.getMe();
    }

    /**
     * Handles updates received from Telegram with a callback.
     * @param {function} callback - The callback function to handle updates.
     * @param {EventBuilder} [event] - Optional event builder for specific events.
     */
    async handleUpdates(callback: (update: Api.Updates) => void, event?: EventBuilder): Promise<() => void> {
        await this.connect();
        if (event) {
            this.client.addEventHandler(callback, event);
        } else {
            this.client.addEventHandler(callback);
        }
        // Return a disposer to remove the handler and avoid leaks
        if (event) {
            return () => {
                try { this.client.removeEventHandler(callback, event); } catch {}
            };
        }
        // For global handler without an event builder, we cannot safely remove; return no-op
        return () => {};
    }

    /**
     * Sends the verification code for authentication.
     * @param {string} phone - The phone number to send the code to.
     * @returns {Promise<{ phoneCodeHash: string, isCodeViaApp: boolean }>} - The verification code hash and whether the code was sent via app.
     */
    async sendCode(phone: string): Promise<{ phoneCodeHash: string, isCodeViaApp: boolean }> {
        await this.connect();
        return await this.client.sendCode({ apiId, apiHash }, phone);
    }

    /**
     * Logs in with the verification code.
     * @param {string} phone - The phone number.
     * @param {string} code - The verification code.
     * @param {string} phoneCodeHash - The verification code hash.
     * @returns {Promise<string>} - The saved session string.
     */
    async signIn(phone: string, code: string, phoneCodeHash: string): Promise<string> {
        await this.connect();
        await this.client.invoke(
            new Api.auth.SignIn({
                phoneNumber: phone,
                phoneCodeHash,
                phoneCode: code
            })
        );
        return this.client.session.save() as unknown as string;
    }

    /**
     * Sends media to a specified chat.
     * @param {bigInt.BigInteger} chatId - The ID of the chat.
     * @param {File} file - The file to send.
     * @param {boolean} isPhoto - Whether the file is a photo.
     * @param {Object} [options] - Optional parameters for sending media.
     * @param {string} [options.caption] - The caption for the media.
     * @param {ParseInterface} [options.parseMode] - The parse mode for the caption.
     * @returns {Promise<Api.TypeUpdates>} - The updates after sending the media.
     */
    async sendMedia(chatId: bigInt.BigInteger, file: File, isPhoto: boolean, options?: { caption?: string; parseMode?: ParseInterface }): Promise<Api.Message | Api.TypeUpdates> {
        await this.connect();
        const { caption } = options || {};
        // Resolve peer and use high-level helper to avoid TL constructor issues
        const peer = await this.client.getInputEntity(chatId);
        return await this.client.sendFile(peer, {
            file,
            caption,
            forceDocument: !isPhoto,
        });
    }

}
