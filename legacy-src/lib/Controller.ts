// Removed unused antd import to reduce bundle size
import { Dialog } from "telegram/tl/custom/dialog";
import { Api } from "telegram";
import { tgApi, aac, storage } from "./Container";
import { SettingsService } from "./services/SettingsService";
import type { Settings } from "./services/SettingsService";
import { DialogService } from "./services/DialogService";
import { ProfileService } from "./services/ProfileService";
import { MessageService } from "./services/MessageService";
import { PictogramService } from "./services/PictogramService";
import { PersonalPictogramService } from "./services/PersonalPictogramService";

export interface PictogramContext { me: any; you: any }

export type Hint = { text: string; icon: string };

export class Controller {
    static tgApi = tgApi;
    static aac = aac;
    static storage = storage;
    static settings = SettingsService.getSettings();

    static async firstLogin(stringSession: string): Promise<void> {
        return SettingsService.firstLogin(stringSession, DialogService.dropDatabase, async () => await Controller.tgApi.getMe());
    }

    static getHints(): Hint[] { return SettingsService.getHints(); }
    static setHints(h: Hint[]) { SettingsService.setHints(h); }

    static getCategories(): string[] { return SettingsService.getCategories(); }
    static getCategoriesData() { return SettingsService.getCategoriesData(); }

    static handleContactUpdate(update: any, type: number, contactsData: Dialog[], setContactsData: any, callback: (dialog: any, message: string) => void) {
        return DialogService.handleContactUpdate(update, type, contactsData, setContactsData, callback);
    }

    static async getDialog(id: any): Promise<Dialog | null> { return DialogService.getDialog(id); }

    static getMe(): Api.User { return JSON.parse(localStorage.getItem('me') as string) as Api.User; }

    static async sendMedia(chatId: any, media: File, caption: string): Promise<Api.TypeUpdates | Api.Message> { return MessageService.sendMedia(chatId, media, caption); }

    static async markAsReadLocal(id: any): Promise<void> { return DialogService.markAsReadLocal(id); }

    static async getDialogs(onUpdate: (dialogs: Dialog[]) => void): Promise<Dialog[]> { return DialogService.getDialogs(onUpdate); }

    static async getProfilePic(id: any): Promise<Buffer> { return ProfileService.getProfilePic(id); }
    static async getProfilePicHQ(id: any): Promise<Buffer | undefined> { return ProfileService.getProfilePicHQ(id); }

    static async getMessages(chatId: any, limit: number) { return MessageService.getMessages(chatId, limit); }
    static async getOlderMessages(chatId: any, beforeId: number, limit: number) { return MessageService.getOlderMessages(chatId, beforeId, limit); }

    static async dropDatabase(): Promise<void> { return DialogService.dropDatabase(); }

    static setSettings(s: any) { SettingsService.setSettings(s); Controller.settings = s; }
    static getSettings() { return SettingsService.getSettings(); }
    static updateSettings(k: keyof Settings, v: any) { SettingsService.updateSetting(k as any as string, v); Controller.settings = SettingsService.getSettings(); }
    static getVerbs() { return PictogramService.getVerbs(); }
    static getWords(category: string, verb?: string) { return PictogramService.getWords(category, verb); }
    static extractChoices(sentence: string) { return PictogramService.extractChoices(sentence); }
    static searchForCategory(category: string) { return PictogramService.searchForCategory(category); }
    static getAllCategories() { return PictogramService.getAllCategories(); }
    static searchPictograms(word: string, limit: number) { return PictogramService.searchPictograms(word, limit); }
    static searchPictogram(keyword: string, normal: boolean) { return PictogramService.searchPictogram(keyword, normal); }
    static extractSuggestedPictograms(sentence: string) { return PictogramService.extractSuggestedPictograms(sentence); }
    static extractPictograms(sentence: string, context?: PictogramContext) { return PictogramService.extractPictograms(sentence, context); }

    static readPersonalPictogram(message: Api.Message) { return MessageService.readPersonalPictogram(message); }
    static importPersonalPictogramFromMessage(type: string, name: string, message: Api.Message) { return MessageService.importPersonalPictogramFromMessage(type, name, message); }

    static textToSpeech(text: string) { return MessageService.textToSpeech(text); }

    static getPersonalPictograms() { return PersonalPictogramService.getPersonalPictograms(); }
    static addPersonalPictogram(p: any) { return PersonalPictogramService.addPersonalPictogram(p); }
    static deletePersonalPictogram(p: any) { return PersonalPictogramService.deletePersonalPictogram(p); }
}

// Re-export Settings type for consumers that import it from Controller
export type { Settings };