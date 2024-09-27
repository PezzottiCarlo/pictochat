import words from '../data/words_with_pictograms.json'
import subjects from '../data/subjects.json';
import verbs from '../data/verbs.json';
import { Pictogram } from './AAC';

interface WordsData {
    [verb: string]: any[];
}

export class Words {

    static w = words as unknown as WordsData;

    static getVerbs = (): Pictogram[] => {
        let v = verbs as Pictogram[];
        return v.filter((v, index, self) => self.findIndex(t => (t._id === v._id)) === index);
    }

    static getObjects = (verb: string | undefined): Pictogram[] => {

        if (verb === undefined) {
            return [];
        }

        let verbs = Object.keys(words);
        for (let v of verbs) {
            if (v === verb) {
                let pictos = [];
                for (let object of Words.w[v]) {
                    let parolaAssociata = Object.keys(object)[0];
                    let picto = Object.values(object)[0] as Pictogram;
                    picto.word = parolaAssociata;
                    pictos.push(picto);
                }
                pictos = pictos.filter((v, index, self) => self.findIndex(t => (t._id === v._id)) === index);
                return pictos;
            }
        }
        return [];
    }

    static getSubjects = (): Pictogram[] => {
        let s = subjects as Pictogram[];
        return s.filter((v, index, self) => self.findIndex(t => (t._id === v._id)) === index);
    }

    static getChoices = (frase: string) => {

        if(!Words.isString(frase)) return [];

        const matches = frase.match(/(?:preferisci|preferiresti|scegli)\s+(.+)$/i);

        if (matches && matches.length > 1) {
            const choicesString = matches[1];
            let res = choicesString.split(/\s+/).map(s => s.trim().replace(/[^\w\s]/gi, ''));
            return res.filter(s => s.length > 1);
        } else {
            return [];
        }
    }

    static pictoExtractor = (frase: string): string[] => {

        if(!Words.isString(frase)) return []

        let choice = Words.getChoices(frase);
        if (choice.length > 0) {
            return choice;
        }

        let frasi = [
            ["Cosa vuoi per cena?", "Carne", "Pesce", "Pizza"],
            ["Dove esci più tardi?", "Parco", "Cinema", "Bar"],
            ["Dove sei?", "Casa", "Scuola", "Lavoro", "Palestra"],
            ["Quando torni", "Tra poco", "Domani", "Un ora", "Non so"],
            ["Come va?", "Bene", "Male", "Felice", "Triste"],
            ["Come stai?", "Bene", "Male", "Felice", "Triste"],
            ["Animale preferito?", "Cane", "Gatto", "Pappagallo", "Coniglio"],
            ["Qual è il tuo film preferito?", "Commedia", "Drammatico", "Azione", "Fantascienza"],
            ["Cosa fai nel tempo libero?", "Leggo", "Guardo la TV", "Vado in palestra", "Cucino"],
            ["Hai piani per il weekend?", "Sì", "No"],
            ["Che tempo fa oggi?", "Sole", "Pioggia", "Nuvoloso", "Temporale"],
            ["Qual è il tuo hobby?", "Cucinare", "Disegnare", "Giocare a videogiochi", "Fare sport"],
            ["Qual è il tuo colore preferito?", "Rosso", "Blu", "Verde", "Giallo"],
            ["Dove vorresti andare in vacanza?", "Mare", "Montagna", "Città d'arte", "Camping"],
            ["Cosa hai fatto ieri sera?", "Uscito con gli amici", "Guardato un film", "Letto un libro", "Cenato fuori"],
            ["Quale è stato il momento più bello della tua giornata?", "Una bella passeggiata", "Una chiacchierata con un amico", "Una buona notizia", "Una risata"],
            ["Qual è il tuo piatto preferito?", "Pizza", "Sushi", "Lasagne", "Hamburger"],
            ["Hai un animale domestico?", "Sì", "No"],
            ["Come trascorri il Natale?", "In famiglia", "Con gli amici", "In viaggio", "A casa"],
            ["Cosa ti piace fare di più nel weekend?", "Rilassarmi", "Uscire", "Viaggiare", "Sperimentare nuove attività"],
            ["Qual è il tuo sogno nel cassetto?", "Viaggiare per il mondo", "Aprire un'attività", "Imparare una nuova lingua", "Scrivere un libro"],
            ["Ti piace cucinare?", "Sì", "No"],
            ["Qual è la tua canzone preferita?", "Pop", "Rock", "Hip hop", "Classica"],
            ["Cosa ti fa ridere?", "Commedie", "Battute", "Situazioni divertenti", "Umorismo surreale"],
            ["Hai fratelli o sorelle?", "Sì", "No"],
            ["Qual è il tuo piatto forte in cucina?", "Pasta al pesto", "Tortellini fatti in casa", "Pollo alla griglia", "Tiramisù"],
            ["Cosa ti piace di più del tuo lavoro?", "La sfida", "L'ambiente", "I colleghi", "La creatività"],
            ["Quale è stata la tua ultima vacanza?", "Al mare", "In montagna", "In città", "All'estero"],
            ["Se potessi avere un superpotere, quale sceglieresti?", "Volare", "Invisibilità", "Superforza", "Teletrasporto"],
            ["Ti piace leggere?", "Sì", "No"],
            ["Qual è il tuo libro preferito?", "Fantasy", "Romanzo storico", "Thriller", "Biografia"],
            ["Cosa ti piace di più della tua città?", "La cultura", "Il cibo", "I parchi", "Le attività culturali"],
            ["Hai un obiettivo per quest'anno?", "Viaggiare più spesso", "Migliorare nella carriera", "Imparare una nuova abilità", "Avere più tempo libero"],
            ["Hai paura di qualcosa?", "Sì", "No"]
        ];

        for (const sottoLista of frasi) {
            if (Words.normalizzaStringa(frase) === Words.normalizzaStringa(sottoLista[0])) {
                return sottoLista.slice(1)
            }
        }

        return []
    }

    static estraiSoggetto = (frase: string): Pictogram[] | null => {
        if (!Words.isString(frase)) return null;
        frase = Words.normalizzaStringa(frase);

        const result: Pictogram[] = [];
        const foundWords = new Set<string>();

        const soggetti = Words.getSubjects();
        const verbs = Words.getVerbs();

        for (const soggetto of soggetti) {
            const soggettoWord = Words.normalizzaStringa(soggetto.word || "");
            if (!foundWords.has(soggettoWord) && new RegExp(`\\b${soggettoWord}\\b`, 'i').test(frase)) {
                result.push(soggetto);
                foundWords.add(soggettoWord);
            }
        }

        for (const verb of verbs) {
            const verbWord = Words.normalizzaStringa(verb.word || "");
            if (!foundWords.has(verbWord) && new RegExp(`\\b${verbWord}\\b`, 'i').test(frase)) {
                result.push(verb);
                foundWords.add(verbWord);
            }
        }

        for (const verb of verbs) {
            const objs = Words.getObjects(verb.word);
            for (const obj of objs) {
                const objWord = Words.normalizzaStringa(obj.word || "");
                if (!foundWords.has(objWord) && new RegExp(`\\b${objWord}\\b`, 'i').test(frase)) {
                    result.push(obj);
                    foundWords.add(objWord);
                }
            }
        }

        return result;
    }

    static normalizzaStringa = (stringa: string) => {
        if(!Words.isString(stringa)) return "";

        stringa = stringa.replace(/[^\w\s]/gi, '').toLowerCase().replace(/\s+/g, ' ');
        stringa = stringa.trim();
        stringa = stringa.replace(/[àáâãäå]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ìíîï]/g, 'i').replace(/[òóôõö]/g, 'o').replace(/[ùúûü]/g, 'u');
        stringa = stringa.replace(/[\x00-\x1F\x7F]/g, '');
        stringa = stringa.replace(/\s+/g, ' ');
        return stringa;
    }


    static isString = (value: any): value is string => {
        return typeof value === 'string';
    }
}
