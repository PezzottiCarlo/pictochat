import { HairColor, SkinColor } from "../model/Types";

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

export type Pictogram = {
    _id: number,
    created: Date,
    tags: string[],
    keywords: Keyword[]
    url?: string
}


export class AAC {

    language: string;
    constructor(language: string) {
        this.language = language;
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
        const result: Pictogram = {
            _id: data._id,
            created: data.created,
            tags: data.tags,
            keywords: data.keywords
        }
        return result;
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
