import { Dialog } from "telegram/tl/custom/dialog";
import { Pictogram } from "./AAC";
import { PersonalPictogram } from "../routes/PersonalPictograms";

class Utils {
    /**
     * Serializes a Telegram dialog object.
     * @param {Dialog} dialog - The dialog to serialize.
     * @returns {any} The serialized dialog.
     */
    static serializeDialog(dialog: Dialog): any {
        return {
            id: dialog.id,
            name: dialog.name,
            date: dialog.date,
            entity: dialog.entity
        }
    }
    

    /**
     * Formats a timestamp into a human-readable date string.
     * @param {number} timestamp - The timestamp to format (in seconds).
     * @returns {string} The formatted date string.
     */
    static formatDate(timestamp: number): string {
        const date = new Date(timestamp * 1000); // Telegram date is in seconds
        return date.toLocaleString();
    }

    /**
     * Converts a PersonalPictogram object to a Pictogram object.
     * @param {PersonalPictogram} p - The personal pictogram to convert.
     * @returns {Pictogram} The converted pictogram.
     */
    static personalPictogramToPictogram(p: PersonalPictogram): Pictogram {
        return {
            _id: Math.floor(Math.random() * 100000000000000000).toString() as any,
            url: p.photoUrl,
            word: p.name,
            tags: [],
            keywords: [],
            aac: false,
            aacColor: false,
            categories: [],
            desc: '',
            schematic: false,
            hair: false,
            sex: false,
            skin: false,
            synsets: [],
            violence: false,
            created: Date.now().toString(),
        } as Pictogram;
    }

    /**
     * Converts a character to a pastel color.
     * @param {string} char - The character to convert.
     * @returns {string} The corresponding pastel color in hex format.
     */
    static charToColor(char: string): string {
        const alphabet = 'abcdefghijklmnopqrstuvwxyz';
        const index = alphabet.indexOf(char.toLowerCase());
        if (index === -1) {
            return '#000000';
        }
        const hue = (index * 15) % 360;
        const saturation = 40;
        const lightness = 80;
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
        const rgbToHex = (rgb: number) => {
            const hex = Math.round(rgb * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
    
        const hexColor = `#${rgbToHex(r + m)}${rgbToHex(g + m)}${rgbToHex(b + m)}`;
        return hexColor;
    }

}

export default Utils