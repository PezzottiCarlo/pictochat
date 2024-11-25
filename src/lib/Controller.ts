import { StringSession } from "telegram/sessions";
import { AAC, HairColor, Pictogram, SkinColor } from "./AAC";
import { Store } from "./Store";
import { TgApi } from "./TgApi";
import { Dialog } from "telegram/tl/custom/dialog";
import { Api } from "telegram";
import { WordsService } from "./WordsService";
import { PersonalPictogram, PersonalPictogramsCategory } from "../routes/PersonalPictograms";
import Utils from "./Utils";

export interface Settings {
    fontSize: number;
    hairColor: HairColor;
    skinColor: SkinColor;
    theme: string;
}

export class Controller {

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
                    console.log('updating dialog');
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
    }

    /**
     * Retrieves the application settings.
     * @returns The current settings.
     */
    static getSettings(): Settings {
        let settings = localStorage.getItem('settings');
        return settings ? JSON.parse(settings) : {};
    }

    /**
     * Retrieves a list of verb pictograms.
     * @returns The list of verb pictograms.
     */
    static getVerbs = (): Pictogram[] => {
        return WordsService.getVerbs().map((p) => {
            p.url = this.convertLink(this.settings, p.url);
            return p;
        });
    };

    /**
     * Retrieves a list of object pictograms based on a verb.
     * @param verb - The verb to filter objects by.
     * @returns The list of object pictograms.
     */
    static getObjects = (verb: string | undefined): Pictogram[] => {
        let common = WordsService.getObjects(verb).map((p) => {
            p.url = this.convertLink(this.settings, p.url);
            return p;
        });

        let personal = Controller.getPersonalPictograms().map((p) => {
            if (p.category === PersonalPictogramsCategory.OGGETTO)
                return Utils.personalPictogramToPictogram(p);
        }) as Pictogram[]

        return personal.concat(common).filter((p) => p !== undefined);
    };

    /**
     * Retrieves a list of subject pictograms.
     * @returns The list of subject pictograms.
     */
    static getSubjects = (): Pictogram[] => {
        let common = WordsService.getSubjects().map((p) => {
            p.url = this.convertLink(this.settings, p.url);
            return p;
        });

        let personal = Controller.getPersonalPictograms().map((p) => {
            if (p.category === PersonalPictogramsCategory.SOGGETTO)
                return Utils.personalPictogramToPictogram(p);
        }) as Pictogram[]

        return personal.concat(common).filter((p) => p !== undefined);
    };

    /**
     * Extracts choices from a sentence.
     * @param sentence - The sentence to extract choices from.
     * @returns The list of choices.
     */
    static extractChoices = (sentence: string): string[] => {
        return WordsService.extractChoices(sentence)
    };

    static searchForCategory = (category: string): Pictogram[] => {
        return AAC.searchForCategory(category).map((p) => {
            p.url = this.convertLink(this.settings, p.url);
            return p;
        });
    }

    static searchPictograms = async (word: string, limit:number): Promise<Pictogram[] | null> => {
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
        let result = await Controller.extractPictograms(o.join(' '));
        if (result === null) return null;
        if (o.length === result.length) return result;
        let unfound = o.filter((word) => !(result as Pictogram[]).find((p) => p.word === word));
        for (const word of unfound) {
            let p = await Controller.searchPictogram(word, true);
            if (p) {
                result.push(p);
            }
        }
        return result;
    };

    /**
     * Extracts pictograms from a sentence.
     * @param sentence - The sentence to extract pictograms from.
     * @returns A promise that resolves to the list of pictograms or null if not found.
     */
    static extractPictograms = async (sentence: string): Promise<Pictogram[] | null> => {
        let cleanedWords = sentence
            .split(' ')
            .map((word) => word.replace(/[.,!?;:()]/g, "").toLowerCase())
            .filter((word) => word.length > 1);
    
        let processedWords: string[] = [];
        for (let i = 0; i < cleanedWords.length; i++) {
            let word = WordsService.findInfinitive(cleanedWords[i]);
            if (!word) {
                processedWords.push(cleanedWords[i]);
                continue;
            }
            if (WordsService.AUSILIAR_VERBS.includes(word)) {
                let nextWord = cleanedWords[i + 1];
                if (nextWord) {
                    let combinedInfinitive = WordsService.findInfinitive(`${cleanedWords[i]} ${nextWord}`);
                    if (combinedInfinitive) {
                        processedWords.push(combinedInfinitive);
                        i++;
                        continue;
                    }
                }
            }
            let infinitive = WordsService.findInfinitive(word);
            if (infinitive) {
                processedWords.push(infinitive);
            }
        }
    
        // Cerca i pittogrammi multi-parola
        let processedSentence = processedWords.join(' ');
        let foundPictograms = AAC.searchPictograms(processedSentence) as Pictogram[];

        console.log("for sentence: ",sentence," with words: ",processedWords," found pictograms: ",foundPictograms);
    
        let result: (Pictogram | string)[] = [...processedWords];
    
        for (const pictogram of foundPictograms) {
            let phraseWords = (pictogram.word as string).toLowerCase().split(' ');
            let startIndex = result.findIndex((item, index) => {
                // Confronta tutte le parole della frase
                return typeof item === 'string' && phraseWords.every((pw, offset) =>
                    result[index + offset] && result[index + offset] === pw
                );
            });
    
            if (startIndex !== -1) {
                // Sostituisci le parole corrispondenti con il pittogramma
                result.splice(startIndex, phraseWords.length, pictogram);
            }
        }

        console.log("result: ",result);
    
        // Gestione dei pittogrammi personali
        let personalPictograms = Controller.getPersonalPictograms();
        for (let i = 0; i < result.length; i++) {
            if (typeof result[i] === 'string') {
                let word = result[i] as string;
                let personalPictogram = personalPictograms.find(
                    (p) => p.name.toLowerCase() === word.toLowerCase()
                );
                if (personalPictogram) {
                    result[i] = Utils.personalPictogramToPictogram(personalPictogram);
                }
            }
        }

        //remove the string from result
        result = result.filter((item) => typeof item !== 'string');

    
        // Filtra eventuali null e restituisci i pittogrammi
        return (result.filter((item) => item !== null) as Pictogram[]).map((p) => {
            p.url = this.convertLink(this.settings, p.url);
            return p;
        });
    };
    
    

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
        let personalPictograms = Controller.getPersonalPictograms();
        if (personalPictograms) {
            personalPictograms.push(newPictogram);
        } else {
            personalPictograms = [newPictogram];
        }
        localStorage.setItem('personalPictograms', JSON.stringify(personalPictograms));
    }

    /**
     * Converts a link based on settings.
     * @param settings - The settings to use for conversion.
     * @param url - The URL to convert.
     * @returns The converted URL.
     */
    private static convertLink(settings: Settings, url: string): string {
        if (!url.includes('arasaac')) return url;
        if (!url.includes('hair') && !url.includes('skin')) return url;
        let hair = AAC.hairColorToHex(settings.hairColor);
        let skin = AAC.skinColorToHex(settings.skinColor);
        let urlArray = url.split('_');
        urlArray[1] = `hair-${hair}`;
        urlArray[2] = `skin-${skin}`;
        return urlArray.join('_');
    }
}