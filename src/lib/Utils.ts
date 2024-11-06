import { Dialog } from "telegram/tl/custom/dialog";
import { Pictogram } from "./AAC";
import { Controller } from "./Controller";
import { PersonalPictogram } from "../routes/PersonalPictograms";

class Utils {
    static serializeDialog(dialog: Dialog): any {
        return {
            id: dialog.id,
            name: dialog.name,
            date: dialog.date,
            entity: dialog.entity
        }
    }
    static formatDate(timestamp: number): string {
        const date = new Date(timestamp * 1000); // Telegram date is in seconds
        return date.toLocaleString();
    }

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
            violence: false
        } as Pictogram;
    }

    static charToColor(char: string): string {
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

}

export default Utils