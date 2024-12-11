import { StringSession } from "telegram/sessions";
import { AAC, HairColor, Pictogram, SkinColor } from "./AAC";
import { Store } from "./Store";
import { TgApi } from "./TgApi";
import { Dialog } from "telegram/tl/custom/dialog";
import { Api } from "telegram";
import { WordsService } from "./WordsService";
import { PersonalPictogram } from "../routes/PersonalPictograms";
import Utils from "./Utils";
import { message } from "antd";
import { Dispatch, SetStateAction } from "react";
import categories from "../data/categories.json";
import hints from "../data/hints.json";
import { isString } from "antd/es/button";

export interface Settings {
    fontSize: number;
    hairColor: HairColor;
    skinColor: SkinColor;
    theme: string;
}

export interface PictogramContext {
    me: any,
    you: any
}

export type Hint = {
    text: string;
    icon: string;
}


export class Controller {
    
    
    


    static async firstLogin(stringSession:string): Promise<void> {
        await Controller.dropDatabase();
        localStorage.removeItem('me');
        localStorage.removeItem('personalPictograms');
        localStorage.removeItem('settings');

        localStorage.setItem('stringSession', stringSession);
        let me = await Controller.tgApi.getMe();
        localStorage.setItem('me', JSON.stringify(me));
        localStorage.setItem('hints', JSON.stringify(hints));
        localStorage.setItem('settings', JSON.stringify({
            fontSize: 14,
            hairColor: HairColor.BLACK,
            skinColor: SkinColor.WHITE,
            theme: 'dark'
        }));
    }

    static getHints = (): Hint[] => {
        return JSON.parse(localStorage.getItem('hints') as string);
    }

    static setHints(hints: { text: string; icon: string; }[]) {
        localStorage.setItem('hints', JSON.stringify(hints));
    }

    static getCategories = (): string[] => {
        return Object.keys(categories);
    }

    static getCategoriesData = (): { [key: string]: string[] } => {
        return categories;
    }


    static handleContactUpdate(update: any, type: number, contactsData: Dialog[], setContactsData: Dispatch<SetStateAction<Dialog[]>>, callback: (dialog: any, message: string) => void) {
        if (type === 0) {
            let shortMess = update.originalUpdate as Api.UpdateShortMessage;
            let fromID = shortMess.userId;
            if (!fromID) {
                callback("Tu", (shortMess.message as any).message);
                let me = Controller.getMe();
                contactsData.forEach((dialog) => {
                    if (dialog.id?.toString() === me.id.toString()) {
                        dialog.message = shortMess.message as any as Api.Message;
                        dialog.unreadCount++;
                        contactsData.splice(contactsData.indexOf(dialog), 1);
                        contactsData.unshift(dialog);
                        setContactsData([...contactsData]);
                    }
                });
            }

            for (let dialog of contactsData) {
                if (dialog.id?.toString() === fromID.toString()) {
                    dialog.message = shortMess as any as Api.Message;
                    dialog.unreadCount++;
                    contactsData.splice(contactsData.indexOf(dialog), 1);
                    contactsData.unshift(dialog);
                    setContactsData([...contactsData]);
                    callback(dialog.name, dialog.message.message);
                    break;
                }
            }
        } else if (type === 1) {
            let userStatus = update as Api.UpdateUserStatus;
            let fromID = userStatus.userId;
            for (let dialog of contactsData) {
                if (dialog.id?.toString() === fromID.toString()) {
                    if (dialog.entity) {
                        (dialog.entity as any).status = userStatus.status.className;
                    }
                    setContactsData([...contactsData]);
                }
            }
        }
    }

    static tgApi = new TgApi(localStorage.getItem('stringSession') ? new StringSession(localStorage.getItem('stringSession') as string) : new StringSession(''));
    static aac = new AAC("it");
    static storage = new Store('pictochat-storage', 1);
    static settings = Controller.getSettings();

    /**
     * Retrieves a dialog by its ID.
     * @param id - The ID of the dialog.
     * @returns A promise that resolves to the dialog or null if not found.
     */
    static async getDialog(id: bigInt.BigInteger): Promise<Dialog | null> {
        let dialog = await this.storage.getDialog(id.toString());
        return dialog;
    }

    static getMe(): Api.User {
        let tmp = localStorage.getItem('me') as string;
        return JSON.parse(tmp) as Api.User;
    }

    /**
     * Sends media to a specified chat.
     * @param chatId - The ID of the chat.
     * @param media - The media file to send.
     * @param caption - The caption for the media.
     * @returns A promise that resolves to the updates from the API.
     */
    static async sendMedia(chatId: bigInt.BigInteger, media: File, caption: string): Promise<Api.TypeUpdates> {
        let isPhoto = media.type.startsWith('image');
        return await this.tgApi.sendMedia(chatId, media, isPhoto, {
            caption: caption
        });
    }

    /**
     * Marks a dialog as read locally.
     * @param id - The ID of the dialog.
     * @returns A promise that resolves when the operation is complete.
     */
    static async markAsReadLocal(id: bigInt.BigInteger): Promise<void> {
        await this.storage.markAsRead(id.toString());
    }

    /**
     * Retrieves dialogs and updates them.
     * @param onUpdate - Callback function to handle updated dialogs.
     * @returns A promise that resolves to the list of dialogs.
     */
    static async getDialogs(onUpdate: (dialogs: Dialog[]) => void): Promise<Dialog[]> {
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
                    this.storage.updateDialog(dialog);
                } else {
                    this.storage.addDialog(dialog);
                }
            }
            onUpdate(dialogs);
        });
        return storedDialogs;
    }

    /**
     * Retrieves the profile picture of a user by their ID.
     * @param id - The ID of the user.
     * @returns A promise that resolves to the profile picture as a Buffer.
     */
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

    /**
     * Retrieves messages from a chat.
     * @param chatId - The ID of the chat.
     * @param limit - The maximum number of messages to retrieve.
     * @returns A promise that resolves to the list of messages.
     */
    static async getMessages(chatId: bigInt.BigInteger, limit: number): Promise<Api.Message[] | any> {
        //chache messages - NOT LONGER NEEDED
    }

    /**
     * Drops the local database.
     * @returns A promise that resolves when the operation is complete.
     */
    static async dropDatabase(): Promise<void> {
        await this.storage.dropDatabase();
    }

    /**
     * Sets the application settings.
     * @param settings - The settings to apply.
     */
    static setSettings(settings: Settings): void {
        localStorage.setItem('settings', JSON.stringify(settings));
        this.settings = settings;
    }

    /**
     * Retrieves the application settings.
     * @returns The current settings.
     */
    static getSettings(): Settings | any {
        let settings = localStorage.getItem('settings');
        let defaultSettings = {
            fontSize: 14,
            hairColor: HairColor.BLACK,
            skinColor: SkinColor.WHITE,
            theme: 'light'
        } as Settings;
        let res = settings ? JSON.parse(settings) : null;
        if (res === null) {
            Controller.setSettings(defaultSettings);
            return null;
        }
        return res;
    }

    static updateSettings(arg0: string, value: any) {
        let settings = Controller.getSettings();
        settings[arg0] = value;
        Controller.setSettings(settings);   
    }

    /**
     * Retrieves a list of verb pictograms.
     * @returns The list of verb pictograms.
     */
    static getVerbs = (): Pictogram[] => {
        return WordsService.getVerbs().map((p) => {
            p.url = this.convertLink(this.settings, p.url,p.hair,p.skin);
            return p;
        });
    };


    /**
     * Retrieves a list of subject pictograms.
     * @param category - The category of the subject pictograms.
     * @param verb - The verb to filter subjects by.
     * @returns The list of subject pictograms.
     */
    static getWords = (category: string, verb?: string): Pictogram[] => {
        //TO FIX
        let getted = (category === "persone") ? WordsService.getSubjects() : WordsService.getObjects(verb);
        let common = getted.map((p) => {
            p.url = this.convertLink(this.settings, p.url,p.hair,p.skin);
            return p;
        });

        let personal = (Controller.getPersonalPictograms().map((p) => {
            if (p.category === category)
                return Utils.personalPictogramToPictogram(p);
        }) as Pictogram[]).filter((p) => p !== undefined);


        //before return remove common pictograms that are already in personal
        personal.forEach((p) => {
            common = common.filter((c) => c.word !== p.word);
        });

        return personal.concat(common).filter((p) => p !== undefined);
    }

    /**
     * Extracts choices from a sentence.
     * @param sentence - The sentence to extract choices from.
     * @returns The list of choices.
     */
    static extractChoices = (sentence: string): string[] => {
        return WordsService.extractChoices(sentence)
    };

    static searchForCategory = (category: string): { personal: Pictogram[], araasac: Pictogram[] } => {
        let personal = Controller.getPersonalPictograms()
            .filter((p) => (p.category).trim().toLocaleLowerCase() === category.trim().toLocaleLowerCase())
            .map(Utils.personalPictogramToPictogram);

        let r = {
            personal: personal,
            araasac: AAC.searchForCategory(category).map((p) => {
                p.url = this.convertLink(this.settings, p.url,p.hair,p.skin);
                return p;
            })
        }
        return r;
    }

    static getAllCategories = (): string[] => {
        let categories = new Set<string>();
        for (let p of AAC.pictograms) {
            if (p.tags) {
                for (let tag of p.tags) {
                    categories.add(tag);
                }
            }
        }
        return Array.from(categories);
    }

    static searchPictograms = async (word: string, limit: number): Promise<Pictogram[] | null> => {
        let pictos = (await Controller.aac.searchKeyword(word, true));
        if (pictos.length === 0) return [];
        let result = [];
        let i = 0;
        for (let p of pictos) {
            if (i >= limit) break;
            const tmp = await Controller.aac.getImageFromId(p._id, true, Controller.settings.skinColor, Controller.settings.hairColor);
            if ((tmp as any).keywords && (tmp as any).keywords.length > 0 && (tmp as any).keywords[0].keyword)
                tmp.word = ((tmp as any).keywords[0]).keyword;
            else
                tmp.word = word;
            result.push(tmp);
            i++;
        }
        return result;
    }

    /**
     * Searches for a pictogram by keyword.
     * @param keyword - The keyword to search for.
     * @param normal - Whether to perform a normal search.
     * @returns A promise that resolves to the found pictogram or null if not found.
     */
    static searchPictogram = async (keyword: string, normal: boolean): Promise<Pictogram | null> => {
        let pictos = (await Controller.aac.searchKeyword(keyword, normal));
        if (pictos.length === 0) return null;
        let picto = pictos[0];
        const p = await Controller.aac.getImageFromId(picto._id, true, Controller.settings.skinColor, Controller.settings.hairColor);
        p.word = keyword;
        return p;
    }

    /**
     * Extracts suggested pictograms from a sentence.
     * @param sentence - The sentence to extract pictograms from.
     * @returns A promise that resolves to the list of suggested pictograms or null if not found.
     */
    static extractSuggestedPictograms = async (sentence: string): Promise<Pictogram[] | null> => {
        let o = WordsService.extractSuggestedPictograms(sentence);
        let result = Controller.extractPictograms(o.join(' '));
        if (result === null) return null;
        if (o.length === result.length) return result;
        return result;
    };


    static readPersonalPictogram = (message: Api.Message): boolean => {
        if (!message.message.trim().toLowerCase().includes(":") && !message.media) return false;
        let splitted = message.message.split(":");
        if (!Controller.getCategories().includes(splitted[0].trim().toLowerCase())) return false;
        if (message.media?.className !== "MessageMediaPhoto") return false;
        Controller.importPersonalPictogramFromMessage(splitted[0].trim(), splitted[1].trim(), message);
        return true;
    }

    /**
     * Extracts pictograms from a sentence.
     * @param sentence - The sentence to extract pictograms from.
     * @returns A promise that resolves to the list of pictograms or null if not found.
     */
    static extractPictograms = (sentence: string, context?: PictogramContext): Pictogram[] | null => {
        // Pulizia iniziale della frase
        let gw = WordsService.getGarbageWords();
        let cleanedWords = sentence
            .split(' ')
            .map((word) => word.replace(/[.,!?;:()]/g, "").toLowerCase())
            .filter((word) => word.length > 1 && !gw.includes(word));

        // Gestione dei pittogrammi personali (massimo 3 parole)
        // eslint-disable-next-line array-callback-return
        let personalPictograms = Controller.getPersonalPictograms();
        let result: (Pictogram | string)[] = [...cleanedWords];

        for (const personalPictogram of personalPictograms) {
            let phraseWords = personalPictogram.name.toLowerCase().split(' ').filter((word) => !gw.includes(word));
            if (phraseWords.length > 3) continue; // Ignora se supera 3 parole

            let startIndex = result.findIndex((item, index) => {
                return typeof item === 'string' && phraseWords.every((pw, offset) =>
                    result[index + offset] && result[index + offset] === pw
                );
            });

            if (startIndex !== -1) {
                // Sostituisci le parole corrispondenti con il pittogramma personale
                result.splice(startIndex, phraseWords.length, Utils.personalPictogramToPictogram(personalPictogram));
            }
        }

        // Estrazione dei verbi all'infinito dalle parole rimaste
        let remainingWords = result.filter(item => typeof item === 'string') as string[];
        let processedWords: { original: string, processed: string }[] = [];

        for (let i = 0; i < remainingWords.length; i++) {
            let word = WordsService.findInfinitive(remainingWords[i]);
            if (!word) {
                processedWords.push({ original: remainingWords[i], processed: remainingWords[i] });
                continue;
            }
            if (WordsService.AUSILIAR_VERBS.includes(word)) {
                let nextWord = remainingWords[i + 1];
                if (nextWord) {
                    let combinedInfinitive = WordsService.findInfinitive(`${remainingWords[i]} ${nextWord}`);
                    if (combinedInfinitive) {
                        processedWords.push({ original: `${remainingWords[i]} ${nextWord}`, processed: combinedInfinitive });
                        i++;
                        continue;
                    }
                }
            }
            processedWords.push({ original: remainingWords[i], processed: word });
        }

        // Cerca i pittogrammi di sistema per le parole rimaste
        let processedSentence = processedWords.map(w => w.processed).join(' ');
        let foundPictograms = AAC.searchPictograms(processedSentence) as Pictogram[];

        for (const pictogram of foundPictograms) {
            let phraseWords = (pictogram.word as string).toLowerCase().split(' ');
            let startIndex = result.findIndex((item, index) => {
                return typeof item === 'string' && phraseWords.every((pw, offset) =>
                    result[index + offset] && result[index + offset] === processedWords.find(pwObj => pwObj.processed === pw)?.original
                );
            });

            if (startIndex !== -1) {
                // Sostituisci le parole corrispondenti con il pittogramma di sistema
                result.splice(startIndex, phraseWords.length, pictogram);
            }
        }



        // Filtra eventuali null e restituisci i pittogrammi
        return (result.filter((item) => item !== null && !isString(item)) as Pictogram[]).map((p) => {
            p.url = this.convertLink(this.settings, p.url,p.hair,p.skin);
            return p;
        });
    };



    static importPersonalPictogramFromMessage = (type: string, name: string, message: Api.Message): void => {
        let pp = this.getPersonalPictograms();
        if (pp.find((p) => p.name.toLowerCase().trim() === name.toLowerCase().trim())) return;

        this.tgApi.downloadMedia(message.media as Api.TypeMessageMedia, 1).then((result) => {
            let pictogram = {
                name: name,
                category: type,
                photoUrl: `data:image/jpeg;base64,${Buffer.from(result).toString('base64')}`
            } as PersonalPictogram;
            Controller.addPersonalPictogram(pictogram);
        });
    }

    /**
     * Converts text to speech.
     * @param text - The text to convert to speech.
     */
    static textToSpeech = (text: string): void => {
        WordsService.textToSpeech(text);
    }

    /**
     * Retrieves personal pictograms from local storage.
     * @returns The list of personal pictograms.
     */
    static getPersonalPictograms(): PersonalPictogram[] {
        let personalPictograms = localStorage.getItem('personalPictograms');
        return personalPictograms ? JSON.parse(personalPictograms) : [];
    }

    /**
     * Adds a new personal pictogram to local storage.
     * @param newPictogram - The new personal pictogram to add.
     */
    static addPersonalPictogram(newPictogram: PersonalPictogram) {

        newPictogram.category = newPictogram.category.trim().toLowerCase();
        newPictogram.name = newPictogram.name.trim().toLowerCase();

        let personalPictograms = Controller.getPersonalPictograms();
        if(personalPictograms.find((p) => p.name.toLowerCase().trim() === newPictogram.name.toLowerCase().trim())) return;

        if (personalPictograms) {
            personalPictograms.push(newPictogram);
        } else {
            personalPictograms = [newPictogram];
        }
        let tmp = newPictogram;
        tmp.name = tmp.name.trim();
        localStorage.setItem('personalPictograms', JSON.stringify(personalPictograms));
    }

    static deletePersonalPictogram(pictogram: PersonalPictogram) {
        let personalPictograms = Controller.getPersonalPictograms();
        personalPictograms = personalPictograms.filter((p) => p.name !== pictogram.name);
        localStorage.setItem('personalPictograms', JSON.stringify(personalPictograms));
    }

    /**
     * Converts a link based on settings.
     * @param settings - The settings to use for conversion.
     * @param url - The URL to convert.
     * @returns The converted URL.
     */
    private static convertLink(settings: Settings, url: string, hair: boolean, skin: boolean): string {
        if (!url.includes('arasaac')) return url;
        if (!url.includes('hair') && !url.includes('skin')) return url;
        let urlArray = url.split('_');
        if (hair) {
            let h = AAC.hairColorToHex(settings.hairColor);
            let hairIndex = urlArray.findIndex(part => part.startsWith('hair-'));
            if (hairIndex !== -1) {
                urlArray[hairIndex] = `hair-${h}`;
            } else {
                urlArray.splice(1, 0, `hair-${h}`);
            }
        } else {
            urlArray = urlArray.filter(part => !part.startsWith('hair-'));
        }
        if (skin) {
            let s = AAC.skinColorToHex(settings.skinColor);
            let skinIndex = urlArray.findIndex(part => part.startsWith('skin-'));
            if (skinIndex !== -1) {
                urlArray[skinIndex] = `skin-${s}`;
            } else {
                if (urlArray.length > 1) {
                    urlArray.splice(2, 0, `skin-${s}`);
                } else {
                    urlArray.splice(1, 0, `skin-${s}`);
                }
            }
        } else {
            urlArray = urlArray.filter(part => !part.startsWith('skin-'));
        }
    
        return urlArray.join('_');
    }
    
    
}