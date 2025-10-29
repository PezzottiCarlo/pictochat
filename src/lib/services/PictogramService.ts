import { aac } from "../Container";
import { AAC, Pictogram } from "../AAC";
import { WordsService } from "../WordsService";
import { PersonalPictogramService } from "./PersonalPictogramService";
import Utils from "../Utils";
import { SettingsService } from "./SettingsService";

export class PictogramService {
    static getVerbs(): Pictogram[] {
        const settings = SettingsService.getSettings()!;
        return WordsService.getVerbs().map((p) => {
            p.url = PictogramService.convertLink(settings, p.url, p.hair, p.skin);
            return p;
        });
    }

    static getWords(category: string, verb?: string): Pictogram[] {
        let getted = (category === "persone") ? WordsService.getSubjects() : WordsService.getObjects(verb);
    let settings = SettingsService.getSettings()!;
        let common = getted.map((p) => {
            p.url = PictogramService.convertLink(settings, p.url, p.hair, p.skin);
            return p;
        });

        let personal = (PersonalPictogramService.getPersonalPictograms().map((p) => {
            if (p.category === category) {
                return Utils.personalPictogramToPictogram(p);
            }
            return undefined as unknown as Pictogram;
        }) as Pictogram[]).filter((p) => p !== undefined);

        personal.forEach((p) => {
            common = common.filter((c) => c.word !== p.word);
        });

        return personal.concat(common).filter((p) => p !== undefined);
    }

    static extractChoices(sentence: string): string[] {
        return WordsService.extractChoices(sentence);
    }

    static searchForCategory(category: string): { personal: Pictogram[], araasac: Pictogram[] } {
        let personal = PersonalPictogramService.getPersonalPictograms()
            .filter((p) => (p.category).trim().toLocaleLowerCase() === category.trim().toLocaleLowerCase())
            .map(Utils.personalPictogramToPictogram);

        let r = {
            personal: personal,
            araasac: AAC.searchForCategory(category).map((p) => {
                p.url = PictogramService.convertLink(SettingsService.getSettings(), p.url, p.hair, p.skin);
                return p;
            })
        };
        return r;
    }

    static getAllCategories(): string[] {
        let categories = new Set<string>();
        for (let p of (aac as any).pictograms) {
            if (p.tags) {
                for (let tag of p.tags) {
                    categories.add(tag);
                }
            }
        }
        return Array.from(categories);
    }

    static async searchPictograms(word: string, limit: number): Promise<Pictogram[] | null> {
        let pictos = (await aac.searchKeyword(word, true));
        if (pictos.length === 0) return [];
        let result: any[] = [];
        let i = 0;
        for (let p of pictos) {
            if (i >= limit) break;
            const s = SettingsService.getSettings()!;
            const tmp = await aac.getImageFromId(p._id, true, s.skinColor, s.hairColor);
            if ((tmp as any).keywords && (tmp as any).keywords.length > 0 && (tmp as any).keywords[0].keyword)
                tmp.word = ((tmp as any).keywords[0]).keyword;
            else
                tmp.word = word;
            result.push(tmp);
            i++;
        }
        return result;
    }

    static async searchPictogram(keyword: string, normal: boolean): Promise<Pictogram | null> {
        let pictos = (await aac.searchKeyword(keyword, normal));
        if (pictos.length === 0) return null;
        let picto = pictos[0];
    const s2 = SettingsService.getSettings()!;
    const p = await aac.getImageFromId(picto._id, true, s2.skinColor, s2.hairColor);
        p.word = keyword;
        return p;
    }

    static async extractSuggestedPictograms(sentence: string): Promise<Pictogram[] | null> {
        let o = WordsService.extractSuggestedPictograms(sentence);
        let result = PictogramService.extractPictograms(o.join(' '));
        if (result === null) return null;
        if (o.length === result.length) return result;
        return result;
    }

    static extractPictograms(sentence: string, context?: any): Pictogram[] | null {
        let gw = WordsService.getGarbageWords();
        let cleanedWords = sentence
            .split(' ')
            .map((word) => word.replace(/[.,!?;:()]/g, "").toLowerCase())
            .filter((word) => word.length > 1 && !gw.includes(word));

        let result: (Pictogram | string)[] = [...cleanedWords];
        result = PictogramService.estraiPictoPersonali(result);
        let { result: processedResult, processedWords } = PictogramService.estraiVerbiInfiniti(result);

        result = PictogramService.estraiPicto(processedResult, processedWords);
        return (result.filter((item) => item !== null && typeof item !== "string") as Pictogram[]).map((p) => {
            p.url = PictogramService.convertLink(SettingsService.getSettings(), p.url, p.hair, p.skin);
            return p;
        });
    }

    private static estraiPictoPersonali(result: (Pictogram | string)[]): (Pictogram | string)[] {
        let personalPictograms = PersonalPictogramService.getPersonalPictograms();
        let gw = WordsService.getGarbageWords();

        for (const personalPictogram of personalPictograms) {
            let phraseWords = personalPictogram.name.toLowerCase().split(' ').filter((word: string) => !gw.includes(word));
            if (phraseWords.length > 3) continue;

            let startIndex = result.findIndex((item, index) => {
                return typeof item === 'string' && phraseWords.every((pw: string, offset: number) =>
                    result[index + offset] && result[index + offset] === pw
                );
            });

            if (startIndex !== -1) {
                result.splice(startIndex, phraseWords.length, Utils.personalPictogramToPictogram(personalPictogram));
            }
        }

        return result;
    }

    private static estraiVerbiInfiniti(result: (Pictogram | string)[]): { result: (Pictogram | string)[], processedWords: { original: string, processed: string }[] } {
        let remainingWords = result.filter(item => typeof item === 'string') as string[];
        let processedWords: { original: string, processed: string }[] = [];

        for (let i = 0; i < remainingWords.length; i++) {
            let word = WordsService.findInfinitive(remainingWords[i]);
            if (!word) {
                processedWords.push({ original: remainingWords[i], processed: remainingWords[i] });
                continue;
            }

            if ((WordsService as any).AUSILIAR_VERBS && (WordsService as any).AUSILIAR_VERBS.includes(word)) {
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

        let processedResult = result.map(item => {
            if (typeof item === 'string') {
                let processedWord = processedWords.find(pw => pw.original === item)?.processed;
                return processedWord || item;
            }
            return item;
        });

        return { result: processedResult, processedWords };
    }

    private static estraiPicto(result: (Pictogram | string)[], processedWords: { original: string, processed: string }[]): (Pictogram | string)[] {
        let processedSentence = processedWords.map(w => w.processed).join(' ');
        let foundPictograms = AAC.searchPictograms(processedSentence) as Pictogram[];

        result.push(...foundPictograms);

        return result;
    }

    private static convertLink(settings: any, url: string, hair: boolean, skin: boolean): string {
        if (!settings) return url;
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
