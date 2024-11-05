export enum HairColor{
    BLONDE = "blonde",
    BROWN = "brown",
    DARK_BROWN = "darkBrown",
    GRAY = "gray",
    DARK_DRAY = "darkGray",
    RED = "red",
    BLACK = "black",
}

export enum SkinColor{
    WHITE = "white",
    BLACK = "black",
    ASSIAN = "assian",
    MULATTO = "mulatto",
    AZTEC = "aztec",
}

export type Keyword = {
    name: string;
}

export type Category = {
    name: string;
    label: string;
    tags: string[];
    keywords: string[];
    children: Category[];
}

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
};


export class AAC {

    language: string;
    constructor(language: string) {
        this.language = language;
    }

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
    
    getCategories: () => Promise<Category[]> = async () => {
        return await this.fetchCategoriesRecursive(this.language);
    };


    searchKeyword: (keyword: string,normal:boolean) => Promise<Pictogram[]> = async (keyword = '',normal=true) => {
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

    getImageFromId: (id: number, color: boolean, skin: SkinColor, hair: HairColor) => Promise<Pictogram> = async (id = 0, color = true, skin = SkinColor.ASSIAN, hair = HairColor.RED,) => {
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
