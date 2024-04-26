from typing import List, Dict, Any
import requests
from datetime import datetime

class Keyword:
    def __init__(self, name: str):
        self.name = name

class Category:
    def __init__(self, name: str, label: str, tags: List[str], keywords: List[str], children: List['Category']):
        self.name = name
        self.label = label
        self.tags = tags
        self.keywords = keywords
        self.children = children

class Pictogram:
    def __init__(self, _id: int, created: datetime, tags: List[str], keywords: List[Keyword], url: str = None, categories: List[str] = []):
        self._id = _id
        self.created = created
        self.tags = tags
        self.keywords = keywords
        self.url = url
        self.categories = categories

class AAC:
    def __init__(self, language: str):
        self.language = language
        
    def convert_sentence(self, sentence: str) -> str:
        res = requests.get(f"https://api.arasaac.org/v1/phrases/flex/es/{sentence}")
        data = res.json()
        #if contains error
        if "error" in data:
            return False
        return data['msg']
        

    def get_keywords(self) -> List[Keyword]:
        res = requests.get(f"https://api.arasaac.org/api/keywords/{self.language}")
        data = res.json()
        result = [Keyword(keyword['name']) for keyword in data]
        return result

    def fetch_categories_recursive(self, language: str) -> List[Category]:
        res = requests.get(f"https://privateapi.arasaac.org/api/categories/{language}")
        data = res.json()
        if "error" in data or len(data.get("data", [])) == 0:
            return []

        def build_category(category_name: str, category_data: Dict[str, Any]) -> Category:
            return Category(category_name, category_data['text'], category_data['tags'], category_data['keywords'], 
                            [build_category(child_name, child_data) for child_name, child_data in category_data.get('children', {}).items()])

        return [build_category(category_name, data['data'][category_name]) for category_name in data['data']]

    def get_categories(self) -> List[Category]:
        return self.fetch_categories_recursive(self.language)

    def search_keyword(self, keyword: str, normal: bool = True) -> List[Pictogram]:
        if not keyword:
            return []
        res = requests.get(f"https://api.arasaac.org/api/pictograms/{self.language}/{'search' if normal else 'bestsearch'}/{keyword}")
        data = res.json()
        if not data:
            return []
        if "error" in data:
            return []
        result = []
        for pictogram in data:
            keywords = []
            for keyword_obj in pictogram.get('keywords', []):
                if 'name' in keyword_obj:
                    keywords.append(Keyword(keyword_obj['name']))
            result.append(Pictogram(pictogram['_id'], datetime.fromisoformat(pictogram['created']), pictogram['tags'], keywords))
        return result

    def get_info_from_id(self, _id: int):
        res = requests.get(f"https://api.arasaac.org/api/pictograms/{self.language}/{_id}")
        data = res.json()
        
        # Check if 'keywords' key exists in data
        if 'keywords' in data:
            keywords = [Keyword(keyword_obj['name']) for keyword_obj in data['keywords'] if 'name' in keyword_obj]
        else:
            keywords = []
        
        result = Pictogram(
            data['_id'], 
            datetime.fromisoformat(data['created']), 
            data.get('tags', []), 
            keywords,
            None,
            data.get('categories', [])
        )
        return result

    def get_image_from_id(self, _id: int, color: bool = True, skin: str = "white", hair: str = "red") -> Pictogram:
        res = requests.get(f"https://api.arasaac.org/v1/pictograms/{_id}?plural=false&color=true&skin={skin}&hair={hair}&url=true&download=false")
        data = res.json()
        if 'image' not in data:
            raise KeyError("Image URL not found in response")
        image_url = data['image']
        pictogram = self.get_info_from_id(_id)
        pictogram.url = image_url
        return pictogram
