import { tgApi, storage } from "../Container";
import { Api } from "telegram";
import { WordsService } from "../WordsService";
import { PersonalPictogramService } from "./PersonalPictogramService";

export class MessageService {
    static async sendMedia(chatId: any, media: File, caption: string): Promise<Api.TypeUpdates | Api.Message> {
        let isPhoto = media.type.startsWith('image');
        // @ts-ignore delegate to tgApi
        return await tgApi.sendMedia(chatId, media, isPhoto, { caption });
    }

    static async markAsReadLocal(id: any): Promise<void> {
        await storage.markAsRead(id.toString());
    }

    static async getMessages(chatId: any, limit: number): Promise<Api.Message[]> {
        const cached = await storage.getMessagesByDialogId(chatId, limit);

        (async () => {
            try {
                // @ts-ignore
                const fetched = await tgApi.getMessages(chatId, { limit, max_id: undefined });
                const onlyMessages = fetched.filter((m: any) => m.className === 'Message');
                const existing = new Set((cached as any[]).map(m => m.id));
                const mergedNew = onlyMessages.filter((m: any) => !existing.has(m.id));
                for (const m of mergedNew) await storage.addMessage(m);
            } catch { }
        })();

        if (!cached || cached.length === 0) {
            // @ts-ignore
            const fetched = await tgApi.getMessages(chatId, { limit });
            const onlyMessages = fetched.filter((m: any) => m.className === 'Message');
            for (const m of onlyMessages) await storage.addMessage(m);
            return onlyMessages;
        }
        return cached;
    }

    static async getOlderMessages(chatId: any, beforeId: number, limit: number): Promise<Api.Message[]> {
        const cached = await storage.getMessagesByDialogIdBefore(chatId, beforeId, limit);

        (async () => {
            try {
                // @ts-ignore
                const fetched = await tgApi.getMessages(chatId, { limit, max_id: beforeId });
                const onlyMessages = fetched.filter((m: any) => m.className === 'Message');
                for (const m of onlyMessages) await storage.addMessage(m);
            } catch { }
        })();
        return cached;
    }

    static readPersonalPictogram(message: Api.Message): boolean {
        const text = (message.message || '').toString();
        if (!text.trim().toLowerCase().includes(":") && !message.media) return false;
        let splitted = text.split(":");
        // categories list is stored in localStorage via SettingsService firstLogin
        let cats = JSON.parse(localStorage.getItem('hints') as string) || [];
        if (!cats) return false; // fallback
        if (!message.media?.className || message.media?.className !== "MessageMediaPhoto") return false;
        // delegate download & add
        MessageService.importPersonalPictogramFromMessage(splitted[0].trim(), splitted[1].trim(), message);
        return true;
    }

    static importPersonalPictogramFromMessage(type: string, name: string, message: Api.Message): void {
        const download = async () => {
            try {
                // @ts-ignore
                const result = await tgApi.downloadMedia(message.media as Api.TypeMessageMedia, 1);
                let pictogram = {
                    name: name,
                    category: type,
                    photoUrl: `data:image/jpeg;base64,${Buffer.from(result).toString('base64')}`
                } as any;
                PersonalPictogramService.addPersonalPictogram(pictogram);
            } catch (e) { /* ignore */ }
        };
        download();
    }

    static textToSpeech(text: string): void {
        WordsService.textToSpeech(text);
    }
}
