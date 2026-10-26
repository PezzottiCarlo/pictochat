import { HairColor, SkinColor } from "../AAC";
import hints from "../../data/hints.json";
import categories from "../../data/categories.json";

export type Settings = {
    fontSize: number;
    hairColor: HairColor;
    skinColor: SkinColor;
    theme: string;
}

export type Hint = { text: string; icon: string };

export class SettingsService {
    static defaultSettings(): Settings {
        return {
            fontSize: 14,
            hairColor: HairColor.BLACK,
            skinColor: SkinColor.WHITE,
            theme: 'light'
        };
    }

    static getSettings(): Settings | null {
        const settings = localStorage.getItem('settings');
        if (!settings) {
            SettingsService.setSettings(SettingsService.defaultSettings());
            return null;
        }
        return JSON.parse(settings) as Settings;
    }

    static setSettings(settings: Settings) {
        localStorage.setItem('settings', JSON.stringify(settings));
    }

    static updateSetting(key: string, value: any) {
        let s = SettingsService.getSettings() as any;
        if (!s) s = SettingsService.defaultSettings();
        s[key] = value;
        SettingsService.setSettings(s);
    }

    static getHints(): Hint[] {
        return JSON.parse(localStorage.getItem('hints') as string) as Hint[];
    }

    static setHints(h: Hint[]) {
        localStorage.setItem('hints', JSON.stringify(h));
    }

    static getCategories(): string[] {
        return Object.keys(categories);
    }

    static getCategoriesData(): { [key: string]: string[] } {
        return categories;
    }

    static firstLogin(stringSession: string, dropDatabaseFn: () => Promise<void>, tgGetMe: () => Promise<any>) {
        return (async () => {
            await dropDatabaseFn();
            localStorage.removeItem('me');
            localStorage.removeItem('personalPictograms');
            localStorage.removeItem('settings');

            localStorage.setItem('stringSession', stringSession);
            let me = await tgGetMe();
            localStorage.setItem('me', JSON.stringify(me));
            localStorage.setItem('hints', JSON.stringify(hints));
            localStorage.setItem('settings', JSON.stringify({
                fontSize: 14,
                hairColor: HairColor.BLACK,
                skinColor: SkinColor.WHITE,
                theme: 'dark'
            }));
        })();
    }
}
