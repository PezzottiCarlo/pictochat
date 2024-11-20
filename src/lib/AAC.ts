/**
 * Enum representing different hair colors.
 */
export enum HairColor {
    BLONDE = "blonde",
    BROWN = "brown",
    DARK_BROWN = "darkBrown",
    GRAY = "gray",
    DARK_DRAY = "darkGray",
    RED = "red",
    BLACK = "black",
}

/**
 * Enum representing different skin colors.
 */
export enum SkinColor {
    WHITE = "white",
    BLACK = "black",
    ASSIAN = "assian",
    MULATTO = "mulatto",
    AZTEC = "aztec",
}

/**
 * Type representing a keyword.
 */
export type Keyword = {
    name: string;
}

/**
 * Type representing a category.
 */
export type Category = {
    name: string;
    label: string;
    tags: string[];
    keywords: string[];
    children: Category[];
}

/**
 * Interface representing a pictogram.
 */
export interface Pictogram {
    word?: string;
    schematic: boolean;
    sex: boolean;
    violence: boolean;
    aac: boolean;
    aacColor: boolean;
    skin: boolean;
    hair: boolean;
    categories: string[];
    synsets: string[];
    tags: string[];
    _id: number;
    desc: string;
    url: string;
}

/**
 * Class representing AAC functionalities.
 */
export class AAC {
    language: string;

    /**
     * Constructs an instance of AAC.
     * @param language - The language to be used.
     */
    constructor(language: string) {
        this.language = language;
    }

    /**
     * Converts a hair color to its corresponding hex value.
     * @param color - The hair color.
     * @returns The hex value of the hair color.
     */
    static hairColorToHex = (color: HairColor): string => {
        switch (color) {
            case HairColor.BLONDE:
                return "FDD700";
            case HairColor.BROWN:
                return "A65E26";
            case HairColor.DARK_BROWN:
                return "6A2703";
            case HairColor.GRAY:
                return "EFEFEF";
            case HairColor.DARK_DRAY:
                return "AAABAB";
            case HairColor.RED:
                return "ED4120";
            case HairColor.BLACK:
                return "020100";
            default:
                return "#FDD700";
        }
    }

    /**
     * Converts a skin color to its corresponding hex value.
     * @param color - The skin color.
     * @returns The hex value of the skin color.
     */
    static skinColorToHex = (color: SkinColor): string => {
        switch (color) {
            case SkinColor.WHITE:
                return "F5E5DE";
            case SkinColor.BLACK:
                return "A65C17";
            case SkinColor.ASSIAN:
                return "F4ECAD";
            case SkinColor.MULATTO:
                return "E3AB72";
            case SkinColor.AZTEC:
                return "CF9D7C";
            default:
                return "CF9D7C";
        }
    }

    /**
     * Fetches keywords from the API.
     * @returns A promise that resolves to an array of keywords.
     */
    getKeywords: () => Promise<Keyword[]> = async () => {
        let res = await fetch(`https://api.arasaac.org/api/keywords/${this.language}`, {
            headers: {
                "Accept": "*/*",
            },
            method: "GET"
        });
        let data = await res.json();
        //convert data to Keyword
        const result: Keyword[] = data.map((keyword: any) => {
            return {
                name: keyword.keyword
            }
        });
        return result;
    }

    /**
     * Recursively fetches categories from the API.
     * @param language - The language to be used.
     * @returns A promise that resolves to an array of categories.
     */
    fetchCategoriesRecursive = async (language: string): Promise<Category[]> => {
        let res = await fetch(`https://privateapi.arasaac.org/api/categories/${language}`, {
            headers: {
                Accept: "*/*",
            },
            method: "GET",
        });
        let data = await res.json();
        if (data["error"] || data["data"].length === 0) return [];
        
        const buildCategory = (categoryName:string, categoryData: any): Category => {
            return {
                name: categoryName,
                label: categoryData.text,
                tags: categoryData.tags,
                keywords: categoryData.keywords,
                children: (categoryData.children) ? Object.keys(categoryData.children).map((childName: any) => buildCategory(childName,categoryData.children[childName])) : []
            };
        };
    
        return Object.keys(data["data"]).map((categoryName: any) => buildCategory(categoryName,data["data"][categoryName]));
    };
    
    /**
     * Fetches categories from the API.
     * @returns A promise that resolves to an array of categories.
     */
    getCategories: () => Promise<Category[]> = async () => {
        return await this.fetchCategoriesRecursive(this.language);
    };

    /**
     * Searches for pictograms by keyword.
     * @param keyword - The keyword to search for.
     * @param normal - Whether to use normal search or best search.
     * @returns A promise that resolves to an array of pictograms.
     */
    searchKeyword: (keyword: string, normal: boolean) => Promise<Pictogram[]> = async (keyword = '', normal = true) => {
        if (keyword === '') return [];
        let res = await fetch(`https://api.arasaac.org/api/pictograms/${this.language}/${(normal)?"search":"bestsearch"}/${keyword}`, {
            "headers": {
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            },
            "method": "GET",
        })
        let data = await res.json();
        if (data.length === 0) return [];
        if (data["error"]) return [];
        const result: Pictogram[] = data.map((pictogram: any) => {
            return {
                _id: pictogram._id,
                created: pictogram.created,
                tags: pictogram.tags,
                keywords: pictogram.keywords
            }
        });
        return result;
    }

    /**
     * Fetches pictogram information by ID.
     * @param id - The ID of the pictogram.
     * @returns A promise that resolves to a pictogram.
     */
    getInfoFromId: (id: number) => Promise<Pictogram> = async (id = 0) => {
        let res = await fetch(`https://api.arasaac.org/api/pictograms/${this.language}/${id}`, {
            "headers": {
                "Accept": "*/*",
            },
            "method": "GET",
        })
        let data = await res.json();
        return data as Pictogram;
    }

    /**
     * Fetches pictogram image by ID.
     * @param id - The ID of the pictogram.
     * @param color - Whether to use color.
     * @param skin - The skin color.
     * @param hair - The hair color.
     * @returns A promise that resolves to a pictogram with the image URL.
     */
    getImageFromId: (id: number, color: boolean, skin: SkinColor, hair: HairColor) => Promise<Pictogram> = async (id = 0, color = true, skin = SkinColor.ASSIAN, hair = HairColor.RED) => {
        let res = await fetch(`https://api.arasaac.org/v1/pictograms/${id}?plural=false&color=${color}&skin=${skin.toString()}&hair=${hair.toString()}&url=true&download=false`, {
            "headers": {
                "Accept": "*/*",
            },
            "method": "GET",
        });
        let imageUrl = (await res.json()).image;
        let pictogram: Pictogram = await this.getInfoFromId(id);
        pictogram.url = imageUrl;
        return pictogram;
    }
}
