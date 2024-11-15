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

    static extractChoices = (sentence: string): string[] => {
        return WordsService.extractChoices(sentence)
    };


    static searchPictogram = async (keyword: string, normal: boolean): Promise<Pictogram | null> => {
        let pictos = (await Controller.aac.searchKeyword(keyword, normal));
        if (pictos.length === 0) return null;
        let picto = pictos[0];
        const p = await Controller.aac.getImageFromId(picto._id, true, Controller.settings.skinColor, Controller.settings.hairColor);
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
        // Suddividere le parole, rimuovere i segni di punteggiatura e filtrare parole di lunghezza > 1
        let cleanedWords = sentence
            .split(' ')
            .map((word) => word.replace(/[.,!?;:()]/g, ""))
            .filter((word) => word.length > 1);

        let processedWords = [];

        for (let i = 0; i < cleanedWords.length; i++) {
            let word = WordsService.findInfinitive(cleanedWords[i]);
            if (!word){
                processedWords.push(cleanedWords[i])
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


        // Ottieni pittogrammi personali e le parole corrispondenti
        let personalPictograms = Controller.getPersonalPictograms().map((p) => Utils.personalPictogramToPictogram(p));
        let personalWords = new Set(personalPictograms.map((p) => p.word));

        // Estrai pittogrammi tramite WordsService
        let pictograms = (await WordsService.extractPictograms(sentence)) || [];
        const unfoundWords = processedWords.filter((word) => !pictograms.find((p) => p.word === word));
        console.log(unfoundWords);
        for (const word of unfoundWords) {
            if (!personalWords.has(word)) {
                const pictogram = await Controller.searchPictogram(word, true);
                if (pictogram) pictograms.push(pictogram);
            }
        }
        const pictogramMap = new Map<string, Pictogram>();
        for (const pictogram of pictograms) {
            pictogramMap.set(pictogram.word as string, pictogram);
        }
        for (const personalPictogram of personalPictograms) {
            pictogramMap.set(personalPictogram.word as string, personalPictogram);
        }
        return processedWords.map((word) => {
            const pictogram = pictogramMap.get(word);
            if (pictogram) {
                pictogram.url = this.convertLink(this.settings, pictogram.url);
            }
            return pictogram;
        }).filter((p): p is Pictogram => p !== undefined);
    }



    static textToSpeech = (text: string): void => {
        WordsService.textToSpeech(text);
    }


    static getPersonalPictograms(): PersonalPictogram[] {
        let personalPictograms = localStorage.getItem('personalPictograms');
        return personalPictograms ? JSON.parse(personalPictograms) : [];
    }

    static addPersonalPictogram(newPictogram: PersonalPictogram) {
        let personalPictograms = Controller.getPersonalPictograms();
        if (personalPictograms) {
            personalPictograms.push(newPictogram);
        } else {
            personalPictograms = [newPictogram];
        }
        localStorage.setItem('personalPictograms', JSON.stringify(personalPictograms));
    }


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