import { StringSession } from "telegram/sessions";
import { AAC, HairColor, Pictogram, SkinColor } from "./AAC";
import { Store } from "./Store";
import { TgApi } from "./TgApi";
import { Dialog } from "telegram/tl/custom/dialog";
import { Api } from "telegram";
import { WordsService } from "./WordsService";

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

    static async getDialog(id: bigInt.BigInteger): Promise<Dialog | null> {
        let dialog = await this.storage.getDialog(id.toString());
        return dialog;
    }

    static async sendMedia(chatId: bigInt.BigInteger, media: File, caption: string): Promise<Api.TypeUpdates> {
        let isPhoto = media.type.startsWith('image');
        return await this.tgApi.sendMedia(chatId, media, isPhoto, {
            caption: caption
        });
    }

    static async markAsReadLocal(id: bigInt.BigInteger): Promise<void> {
        await this.storage.markAsRead(id.toString());
    }

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

    static async dropDatabase(): Promise<void> {
        await this.storage.dropDatabase();
    }

    static setSettings(settings: Settings): void {
        localStorage.setItem('settings', JSON.stringify(settings));
    }

    static getSettings(): Settings {
        let settings = localStorage.getItem('settings');
        return settings ? JSON.parse(settings) : {};
    }

    static getVerbs = (): Pictogram[] => {
        return WordsService.getVerbs().map((p) => {
            p.url = this.convertLink(this.settings, p.url);
            return p;
        });
    };

    static getObjects = (verb: string | undefined): Pictogram[] => {
        return WordsService.getObjects(verb).map((p) => {
            p.url = this.convertLink(this.settings, p.url);
            return p;
        });
    };

    static getSubjects = (): Pictogram[] => {
        return WordsService.getSubjects().map((p) => {
            p.url = this.convertLink(this.settings, p.url);
            return p;
        });
    };

    static extractChoices = (sentence: string): string[] => {
        return WordsService.extractChoices(sentence)
    };


    static searchPictogram = async (keyword: string, normal: boolean): Promise<Pictogram | null> => {
        let pictos = (await Controller.aac.searchKeyword(keyword, normal));
        if (pictos.length === 0) return null;
        let picto = pictos[0];
        const p = await Controller.aac.getImageFromId(picto._id, true,Controller.settings.skinColor,Controller.settings.hairColor);
        p.word = keyword;
        return p;
    }

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

    static extractPictograms = async (sentence: string): Promise<Pictogram[] | null> => {
        const cleanedWords = sentence
            .split(' ')
            .map((word) => word.replace(/[.,!?;:()]/g, "").toLowerCase())
            .filter((word) => word.length > 1);
        
        let pictograms = (await WordsService.extractPictograms(sentence)) || [];
        const unfoundWords = cleanedWords.filter((word) => !pictograms.find((p) => p.word === word));

        for (const word of unfoundWords) {
            const pictogram = await Controller.searchPictogram(word, true);
            if (pictogram) pictograms.push(pictogram);
        }
    
        return cleanedWords.map((word) => {
            const pictogram = pictograms.find((p) => p.word === word);
            if (pictogram) {
                pictogram.url = this.convertLink(this.settings, pictogram.url);
            }
            return pictogram;
        }).filter((p): p is Pictogram => p !== undefined); 
    }
    

    static textToSpeech = (text: string): void => {
        WordsService.textToSpeech(text);
    }

    private static convertLink(settings: Settings, url: string): string {
        if (!settings) return url;
        let hair = AAC.hairColorToHex(settings.hairColor);
        let skin = AAC.skinColorToHex(settings.skinColor);
        let urlArray = url.split('_');
        urlArray[1] = `hair-${hair}`;
        urlArray[2] = `skin-${skin}`;
        return urlArray.join('_');
    }
}