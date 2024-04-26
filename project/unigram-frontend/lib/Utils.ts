import { Message, User } from "../model/Types";

export function charToColor(char: string): string {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    const index = alphabet.indexOf(char.toLowerCase());
    if (index === -1) {
        // Character not found in the alphabet
        return '#000000'; // Return black color as fallback
    }

    // Generate pastel colors
    const hue = (index * 15) % 360; // Distribute hues evenly
    const saturation = 40; // Keep saturation low for pastel colors
    const lightness = 80; // Keep lightness high for pastel colors

    // Convert HSL to RGB
    const h = hue / 360;
    const s = saturation / 100;
    const l = lightness / 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h * 6) % 2 - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (h < 1 / 6) {
        r = c; g = x;
    } else if (h < 2 / 6) {
        r = x; g = c;
    } else if (h < 3 / 6) {
        g = c; b = x;
    } else if (h < 4 / 6) {
        g = x; b = c;
    } else if (h < 5 / 6) {
        r = x; b = c;
    } else {
        r = c; b = x;
    }

    // Scale and convert to hex
    const rgbToHex = (rgb: number) => {
        const hex = Math.round(rgb * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };

    const hexColor = `#${rgbToHex(r + m)}${rgbToHex(g + m)}${rgbToHex(b + m)}`;
    return hexColor;
}


export function dateToShortDate(date: Date): string {
    //convert date to current timezone
    const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    //if date is today return time
    if (localDate.toDateString() === new Date().toDateString()) {
        return `${localDate.getHours()}:${localDate.getMinutes() < 10 ? '0' : ''}${localDate.getMinutes()}`;
    }
    //if date is yesterday return "Yesterday"
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (localDate.toDateString() === yesterday.toDateString()) {
        return "Yesterday";
    }
    //this week return day of the week
    const dayOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    if (localDate.getDay() >= new Date().getDay() - 7) {
        return dayOfWeek[localDate.getDay()];
    }

    //return date mm/dd
    return `${localDate.getMonth() + 1}/${localDate.getDate()}`;
}

export function displayMessage(msg: Message, me: User): string {

    let message = msg.message;

    if (!message) return "";
    message = message.trim();
    message = message.replace(/(\r\n|\n|\r)/gm, " ");

    return (message) ?
        (message.length > 20) ? (
            ((msg.from_id) ? "You: " : "") + message.slice(0, 20).trim() + "...")
            : message.trim()
        : "";
}

function getChoices(frase:string) {
    const matches = frase.match(/(?:preferisci|preferiresti|scegli)\s+(.+)$/i);

    if (matches && matches.length > 1) {
        const choicesString = matches[1];
        let res = choicesString.split(/\s+/).map(s => s.trim().replace(/[^\w\s]/gi, ''));
        return res.filter(s => s.length > 1);
    } else {
        return [];
    }
}

export function confrontaFraseConLista(frase:string) {
    let choice = getChoices(frase);
    console.log(choice);
    if (choice.length > 0) {
        return choice;
    }

    let frasi = [
        ["Cosa vuoi per cena?", "Carne", "Pesce", "Pasta", "Pollo"],
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
        if (normalizzaStringa(frase) === normalizzaStringa(sottoLista[0])) {
            return sottoLista.slice(1);
        }
    }
    return [];
}

export function estraiSoggetto(frase: string): string | null {
    frase = normalizzaStringa(frase);
    if (frase.includes("cena")) {
        return "cena";
    } else if (frase.includes("uscire")) {
        return "uscire";
    } else if (frase.includes("amici")) {
        return "amici";
    } else if (frase.includes("tempo libero")) {
        return "tempo libero";
    } else if (frase.includes("weekend")) {
        return "weekend";
    } else if (frase.includes("natale")) {
        return "natale";
    } else if (frase.includes("hobby")) {
        return "hobby";
    } else if (frase.includes("vacanza")) {
        return "vacanza";
    } else if (frase.includes("cucinare")) {
        return "cucinare";
    } else if (frase.includes("film")) {
        return "film";
    } else if (frase.includes("animale domestico")) {
        return "animale domestico";
    } else if (frase.includes("colore preferito")) {
        return "colore preferito";
    } else if (frase.includes("fare")) {
        return "fare";
    } else if (frase.includes("libro preferito")) {
        return "libro preferito";
    } else if (frase.includes("ridere")) {
        return "ridere";
    } else if (frase.includes("fratelli")) {
        return "fratelli";
    } else if (frase.includes("lavoro")) {
        return "lavoro";
    } else if (frase.includes("pianeti")) {
        return "pianeti";
    } else if (frase.includes("natura")) {
        return "natura";
    } else if (frase.includes("sport")) {
        return "sport";
    } else if (frase.includes("musica")) {
        return "musica";
    } else if (frase.includes("scuola")) {
        return "scuola";
    } else if (frase.includes("computer")) {
        return "computer";
    } else if (frase.includes("arte")) {
        return "arte";
    } else if (frase.includes("viaggiare")) {
        return "viaggiare";
    } else if (frase.includes("strumento musicale")) {
        return "strumento musicale";
    } else if (frase.includes("letteratura")) {
        return "letteratura";
    } else if (frase.includes("città")) {
        return "città";
    } else if (frase.includes("giocare")) {
        return "giocare";
    } else if (frase.includes("salute")) {
        return "salute";
    } else if (frase.includes("okay")) {
        return "okay";
    }else if (frase.includes("tu")) {
        return "tu";
    }
    return null;
}


//in base al preferisci ... ritornare le scelte
//aggiungere anche un backend per la scelta dei picttogrammi personalizzati

function normalizzaStringa(stringa:string) {
    stringa = stringa.replace(/[^\w\s]/gi, '').toLowerCase().replace(/\s+/g, ' ');
    stringa = stringa.trim();
    stringa = stringa.replace(/[àáâãäå]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ìíîï]/g, 'i').replace(/[òóôõö]/g, 'o').replace(/[ùúûü]/g, 'u');
    stringa = stringa.replace(/[\x00-\x1F\x7F]/g, '');
    stringa = stringa.replace(/\s+/g, ' ');
    return stringa;
}


export function dateToString(val:Date) {
    const hours = val.getHours().toString().padStart(2, '0'); // Ensure two digits
    const minutes = val.getMinutes().toString().padStart(2, '0'); // Ensure two digits
    return `${hours}:${minutes}`;
}


