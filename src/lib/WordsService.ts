import words from '../data/words_with_pictograms.json';
import subjects from '../data/subjects.json';
import verbs from '../data/verbs.json';
import predefinedPhrases from '../data/predefined_phrases.json';
import { AAC, Pictogram } from './AAC';
import conjugations from '../data/verbs_conjugated.json';



interface WordsData {
    [verb: string]: any[];
}

interface Conjugation {
    verb: string;
    usage: number;
    conjugations: { [tense: string]: string[] };
}

/**
 * Service for handling words and their associated pictograms.
 */
export class WordsService {
    static w = words as unknown as WordsData;
    static conjugations = conjugations as Conjugation[];
    static AUSILIAR_VERBS = ["essere", "avere"];
    static MODAL_VERBS = ["potere", "dovere", "volere"];
    static ARTICLES_DET = [
        "il", "lo", "la", "i", "gli", "le", "l'"
    ]
    static ARTICLES_IND = [
        "un", "uno", "una", "un'"
    ]
    static PREPOSITIONS = [
        "di", "a", "da", "in", "con", "su", "per", "tra", "fra"
    ]
    static ARTICLES_PREP = [
        "del", "dello", "della", "dei", "degli", "delle", "dell'","di",
        "al", "allo", "alla", "ai", "agli", "alle", "all'",
        "dal", "dallo", "dalla", "dai", "dagli", "dalle", "dall'",
        "nel", "nello", "nella", "nei", "negli", "nelle", "nell'",
        "sul", "sullo", "sulla", "sui", "sugli", "sulle", "sull'"
    ]



    
    
    static getGarbageWords = (): string[] => {
        return this.ARTICLES_DET.concat(this.ARTICLES_IND).concat(this.PREPOSITIONS).concat(this.ARTICLES_PREP);
    }


    /**
     * Get all unique verbs.
     * @returns {Pictogram[]} Array of unique verbs as pictograms.
     */
    static getVerbs = (): Pictogram[] => {
        let v = (verbs as Pictogram[]);
        return v.filter((v, index, self) => self.findIndex(t => t._id === v._id) === index);
    };

    /**
     * Get objects associated with a verb.
     * @param {string | undefined} verb - The verb to get objects for.
     * @returns {Pictogram[]} Array of pictograms associated with the verb.
     */
    static getObjects = (verb: string | undefined): Pictogram[] => {
        if (!verb) return [];

        const verbsList = Object.keys(WordsService.w);
        for (let v of verbsList) {
            if (v === verb) {
                let pictograms: Pictogram[] = [];
                for (let object of WordsService.w[v]) {
                    const associatedWord = Object.keys(object)[0];
                    const picto = Object.values(object)[0] as Pictogram;
                    picto.word = associatedWord;
                    pictograms.push(picto);
                }
                return pictograms.filter((v, index, self) => self.findIndex(t => t._id === v._id) === index);
            }
        }
        return [];
    };

    /**
     * Get all unique subjects.
     * @returns {Pictogram[]} Array of unique subjects as pictograms.
     */
    static getSubjects = (): Pictogram[] => {
        let s = (subjects as Pictogram[]);
        return s.filter((v, index, self) => self.findIndex(t => t._id === v._id) === index);
    };

    /**
     * Extract choices from a sentence (e.g., for a question asking for a preference).
     * @param {string} sentence - The sentence to extract choices from.
     * @returns {string[]} Array of choices extracted from the sentence.
     */
    static extractChoices = (sentence: string): string[] => {
        if (!WordsService.isString(sentence)) return [];
        const isQuestion = sentence.includes('?');
        if (!isQuestion) return [];
        const afterQuestion = sentence.split('?')[1];
        if (!afterQuestion) return [];
        const choices = afterQuestion
            .split(/\s*(?:,|\s+o\s+)\s*/)
            .map(choice => choice.trim().replace(/[^\w\s]/gi, ''))
            .filter(choice => choice.length > 0);

        return choices;
    };


    /**
     * Extract pictograms based on a sentence.
     * @param {string} sentence - The sentence to extract pictograms from.
     * @returns {string[]} Array of suggested pictograms.
     */
    static extractSuggestedPictograms = (sentence: string): string[] => {
        if (!WordsService.isString(sentence)) return [];
        let choices = WordsService.extractChoices(sentence);
        if (choices.length > 0) return choices;

        for (const entry of predefinedPhrases) {
            if (WordsService.normalizeString(sentence) === WordsService.normalizeString(entry.question)) {
                return entry.answers;
            }
        }
        return [];
    };


    /**
     * Get all verbs.
     * @returns {string[]} Array of all verbs.
     */
    static getAllVerbs = (): string[] => {
        return this.conjugations.map((c) => c.verb);
    }

    /**
     * Extract subjects from a sentence.
     * @param {string} sentence - The sentence to extract subjects from.
     * @returns {Promise<Pictogram[] | null>} Promise resolving to an array of pictograms or null.
     */
    static extractPictograms = async (sentence: string): Promise<Pictogram[] | null> => {
        if (!WordsService.isString(sentence)) return null;
        sentence = WordsService.normalizeString(sentence);
        return AAC.searchPictograms(sentence);
    };

    /**
     * Normalize a string by converting to lowercase, removing special characters, and normalizing accents.
     * @param {string} str - The string to normalize.
     * @returns {string} The normalized string.
     */
    static normalizeString = (str: string): string => {
        if (!WordsService.isString(str)) return "";

        return str
            .toLowerCase()
            .replace(/[^\w\s]/gi, '')
            .replace(/\s+/g, ' ')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    };

    /**
     * Utility: Check if value is a string.
     * @param {any} value - The value to check.
     * @returns {boolean} True if the value is a string, false otherwise.
     */
    static isString = (value: any): value is string => {
        return typeof value === 'string';
    };

    /**
     * Convert text to speech.
     * @param {string} text - The text to convert to speech.
     */
    static textToSpeech = (text: string): void => {

        //DA SISTEMARE rendere voci più naturali

        const synth = window.speechSynthesis;
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'it-IT';
        synth.speak(u);
    }

    /**
     * Calculate the Levenshtein distance between two strings.
     * @param {string} a - The first string.
     * @param {string} b - The second string.
     * @returns {number} The Levenshtein distance between the two strings.
     */
    static levenshteinDistance = (a: string, b: string): number => {
        const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
        for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
        for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
        for (let i = 1; i <= a.length; i++) {
            for (let j = 1; j <= b.length; j++) {
                const cost = a[i - 1] === b[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j - 1] + cost
                );
            }
        }

        return matrix[a.length][b.length];
    };

    /**
     * Find the infinitive form of a conjugated verb.
     * @param {string} conjugatedVerb - The conjugated verb to find the infinitive for.
     * @returns {string | null} The infinitive form of the verb, or null if not found.
     */
    static findInfinitive = (conjugatedVerb: string): string | null => {
        const normalizedConjugatedVerb = conjugatedVerb.toLowerCase().replace(/^(io|tu|lui\/lei|noi|voi|loro)\s+/i, '').trim();

        for (let entry of this.conjugations) {
            const infinitive = entry['verb'];
            if (entry['usage'] < 2000) break;
            for (let tense in entry['conjugations']) {
                for (let conjugation of entry['conjugations'][tense]) {
                    const normalizedConjugation = conjugation.toLowerCase().replace(/^(io|tu|lui\/lei|noi|voi|loro)\s+/i, '').trim();

                    if (normalizedConjugation[normalizedConjugation.length - 2] === "/") {
                        if (normalizedConjugation.slice(0, -3) === normalizedConjugatedVerb.slice(0, -1)) {

                            return infinitive;
                        }
                    }
                    else if (normalizedConjugation === normalizedConjugatedVerb) {
                        return infinitive;
                    }
                }
            }
        }
        return null;
    };

    static isAuxiliaryOrModal = (word: string): boolean => {
        return WordsService.AUSILIAR_VERBS.includes(word) || WordsService.MODAL_VERBS.includes(word);
    };
    

}
