import words from '../data/words_with_pictograms.json';
import subjects from '../data/subjects.json';
import verbs from '../data/verbs.json';
import predefinedPhrases from '../data/predefined_phrases.json';
import { Pictogram } from './AAC';

// Dummy NLP manager for demonstration purposes, move this logic to the server
// const manager = new NlpManager({ languages: ['it', 'en'] }); // Cannot be used directly in React client-side

interface WordsData {
    [verb: string]: any[];
}

export class WordsService {
    static w = words as unknown as WordsData;

    // Get all unique verbs
    static getVerbs = (): Pictogram[] => {
        let v = verbs as Pictogram[];
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
        let s = subjects as Pictogram[];
        return s.filter((v, index, self) => self.findIndex(t => t._id === v._id) === index);
    };

    // Extract choices from a sentence (e.g., for a question asking for a preference)
    static extractChoices = (sentence: string): string[] => {
        if (!WordsService.isString(sentence)) return [];

        const matches = sentence.match(/(?:preferisci|preferiresti|scegli)\s+(.+)$/i);

        if (matches && matches.length > 1) {
            const choicesString = matches[1];
            return choicesString.split(/\s+/).map(s => s.trim().replace(/[^\w\s]/gi, '')).filter(s => s.length > 1);
        }
        return [];
    };

    // Lemmatization function (could be moved to a backend service)
    private static async lemmatize(text: string, language: string): Promise<string[]> {
        // Make an API call to a backend or use a library that works in the client
        // const result = await WordsService.manager.process(language, text);
        // return result.sentiment.lemmas;
        return text.split(' '); // Dummy response
    }

    // Extract pictograms based on a sentence
    static extractPictograms = (sentence: string): string[] => {
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

    // Extract subjects from a sentence
    static extractSubjects = async (sentence: string): Promise<Pictogram[] | null> => {
        if (!WordsService.isString(sentence)) return null;

        sentence = WordsService.normalizeString(sentence);
        const lemmatizedSentence = (await WordsService.lemmatize(sentence, 'it')).join(' ');

        const result: Pictogram[] = [];
        const foundWords = new Set<string>();

        const subjects = WordsService.getSubjects();
        const verbs = WordsService.getVerbs();

        for (const subject of subjects) {
            const subjectWord = WordsService.normalizeString(subject.word || "");
            if (!foundWords.has(subjectWord) && new RegExp(`\\b${subjectWord}\\b`, 'i').test(lemmatizedSentence)) {
                result.push(subject);
                foundWords.add(subjectWord);
            }
        }

        for (const verb of verbs) {
            const verbWord = WordsService.normalizeString(verb.word || "");
            if (!foundWords.has(verbWord) && new RegExp(`\\b${verbWord}\\b`, 'i').test(lemmatizedSentence)) {
                result.push(verb);
                foundWords.add(verbWord);
            }
        }

        for (const verb of verbs) {
            const objects = WordsService.getObjects(verb.word);
            for (const obj of objects) {
                const objectWord = WordsService.normalizeString(obj.word || "");
                if (!foundWords.has(objectWord) && new RegExp(`\\b${objectWord}\\b`, 'i').test(lemmatizedSentence)) {
                    result.push(obj);
                    foundWords.add(objectWord);
                }
            }
        }

        return result;
    };

    // Utility: Normalize string (remove special characters, normalize accents, etc.)
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
}
