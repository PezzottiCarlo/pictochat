import words from '../data/words_with_pictograms.json';
import subjects from '../data/subjects.json';
import verbs from '../data/verbs.json';
import predefinedPhrases from '../data/predefined_phrases.json';
import { Pictogram } from './AAC';
import conjugations from '../data/verbs_conjugated.json';



interface WordsData {
    [verb: string]: any[];
}

interface Conjugation {
    verb: string;
    usage: number;
    conjugations: { [tense: string]: string[] };
}

export class WordsService {
    static w = words as unknown as WordsData;
    static conjugations = conjugations as Conjugation[];
    static AUSILIAR_VERBS = ["essere", "avere"];

    // Get all unique verbs
    static getVerbs = (): Pictogram[] => {
        let v = (verbs as Pictogram[]);
        return v.filter((v, index, self) => self.findIndex(t => t._id === v._id) === index);
    };

    // Get objects associated with a verb
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

    // Get all unique subjects
    static getSubjects = (): Pictogram[] => {
        let s = (subjects as Pictogram[]);
        return s.filter((v, index, self) => self.findIndex(t => t._id === v._id) === index);
    };

    // Extract choices from a sentence (e.g., for a question asking for a preference)
    static extractChoices = (sentence: string): string[] => {
        if (!WordsService.isString(sentence)) return [];
        console.log(sentence);
    
        // Verificare se la frase contiene una domanda (con il punto di domanda)
        const isQuestion = sentence.includes('?');
        if (!isQuestion) return [];
    
        // Identificare la parte della frase dopo il punto di domanda
        const afterQuestion = sentence.split('?')[1];
        if (!afterQuestion) return [];
    
        // Dividere le opzioni usando separatori: virgola, "o" (senza includerlo nei risultati)
        const choices = afterQuestion
            .split(/\s*(?:,|\s+o\s+)\s*/) // Dividere su virgola, o con spazi attorno ma senza includere "o"
            .map(choice => choice.trim().replace(/[^\w\s]/gi, '')) // Pulire caratteri speciali
            .filter(choice => choice.length > 0); // Rimuovere stringhe vuote
    
        return choices;
    };
    

    // Extract pictograms based on a sentence
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


    static getAllVerbs = (): string[] => {
        return this.conjugations.map((c) => c.verb);
    }

    // Extract subjects from a sentence
    static extractPictograms = async (sentence: string): Promise<Pictogram[] | null> => {
        if (!WordsService.isString(sentence)) return null;

        sentence = WordsService.normalizeString(sentence);
        const result: Pictogram[] = [];
        const foundWords = new Set<string>();

        const subjects = WordsService.getSubjects();
        const verbs = WordsService.getVerbs();

        for (const subject of subjects) {
            const subjectWord = WordsService.normalizeString(subject.word || "");
            if (!foundWords.has(subjectWord) && new RegExp(`\\b${subjectWord}\\b`, 'i').test(sentence)) {
                result.push(subject);
                foundWords.add(subjectWord);
            }
        }

        for (const verb of verbs) {
            const verbWord = WordsService.normalizeString(verb.word || "");
            if (!foundWords.has(verbWord) && new RegExp(`\\b${verbWord}\\b`, 'i').test(sentence)) {
                result.push(verb);
                foundWords.add(verbWord);
            }
        }

        for (const verb of verbs) {
            const objects = WordsService.getObjects(verb.word);
            for (const obj of objects) {
                const objectWord = WordsService.normalizeString(obj.word || "");
                if (!foundWords.has(objectWord) && new RegExp(`\\b${objectWord}\\b`, 'i').test(sentence)) {
                    result.push(obj);
                    foundWords.add(objectWord);
                }
            }
        }

        return result;
    };

    static normalizeString = (str: string): string => {
        if (!WordsService.isString(str)) return "";

        return str
            .toLowerCase()
            .replace(/[^\w\s]/gi, '')
            .replace(/\s+/g, ' ')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    };

    // Utility: Check if value is a string
    static isString = (value: any): value is string => {
        return typeof value === 'string';
    };

    static textToSpeech = (text: string): void => {

        //DA SISTEMARE rendere voci più naturali

        const synth = window.speechSynthesis;
        const u = new SpeechSynthesisUtterance(text);
        //set italian language
        u.lang = 'it-IT';
        synth.speak(u);
    }

    static levenshteinDistance = (a: string, b: string) => {
        const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
        for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
        for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
        for (let i = 1; i <= a.length; i++) {
            for (let j = 1; j <= b.length; j++) {
                const cost = a[i - 1] === b[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,      // Cancellazione
                    matrix[i][j - 1] + 1,      // Inserimento
                    matrix[i - 1][j - 1] + cost // Sostituzione
                );
            }
        }

        return matrix[a.length][b.length];
    };

    static findInfinitive = (conjugatedVerb: string) => {
        const normalizedConjugatedVerb = conjugatedVerb.toLowerCase().replace(/^(io|tu|lui\/lei|noi|voi|loro)\s+/i, '').trim();

        for (let entry of this.conjugations) {
            const infinitive = entry['verb'];
            if (entry['usage'] < 2000) break;
            //block
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


}
