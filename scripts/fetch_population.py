import os
import csv
import urllib.request
import re
import json

# 都道府県名からコードへのマッピング
PREF_MAP = {
    "北海道": 1, "青森県": 2, "岩手県": 3, "宮城県": 4, "秋田県": 5, "山形県": 6, "福島県": 7,
    "茨城県": 8, "栃木県": 9, "群馬県": 10, "埼玉県": 11, "千葉県": 12, "東京都": 13, "神奈川県": 14,
    "新潟県": 15, "富山県": 16, "石川県": 17, "福井県": 18, "山梨県": 19, "長野県": 20, "岐阜県": 21,
    "静岡県": 22, "愛知県": 23, "三重県": 24, "滋賀県": 25, "京都府": 26, "大阪府": 27, "兵庫県": 28,
    "奈良県": 29, "和歌山県": 30, "鳥取県": 31, "島根県": 32, "岡山県": 33, "広島県": 34, "山口県": 35,
    "徳島県": 36, "香川県": 37, "愛媛県": 38, "高知県": 39, "福岡県": 40, "佐賀県": 41, "長崎県": 42,
    "熊本県": 43, "大分県": 44, "宮崎県": 45, "鹿児島県": 46, "沖縄県": 47
}

# フォールバック用人口データ (2020年国勢調査近似値)
DEFAULT_POPULATION = {
    1: 5220000, 2: 1230000, 3: 1210000, 4: 2300000, 5: 950000, 6: 1060000, 7: 1830000,
    8: 2860000, 9: 1930000, 10: 1930000, 11: 7340000, 12: 6280000, 13: 14040000, 14: 9230000,
    15: 2200000, 16: 1030000, 17: 1130000, 18: 760000, 19: 810000, 20: 2040000, 21: 1970000,
    22: 3630000, 23: 7540000, 24: 1770000, 25: 1410000, 26: 2570000, 27: 8830000, 28: 5460000,
    29: 1320000, 30: 920000, 31: 550000, 32: 670000, 33: 1880000, 34: 2790000, 35: 1340000,
    36: 720000, 37: 950000, 38: 1330000, 39: 690000, 40: 5130000, 41: 810000, 42: 1310000,
    43: 1730000, 44: 1120000, 45: 1070000, 46: 1580000, 47: 1460000
}

def fetch_population_from_web():
    """
    Wikipediaの都道府県人口一覧ページから人口データをスクレイピングする
    """
    url = "https://ja.wikipedia.org/wiki/%E9%83%BD%E9%81%9C%E5%BA%9C%E7%9C%8C%E3%81%AE%E4%BA%BA%E5%8F%A3%E4%B8%80%E8%A6%A7"
    headers = {"User-Agent": "Mozilla/5.0"}
    req = urllib.request.Request(url, headers=headers)
    
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            html = response.read().decode('utf-8')
            
        # 簡易的なテーブル行抽出用正規表現
        # <tr><td>... などを解析して都道府県名と人口を検索
        # ※ Wikipediaのテーブル構造は複雑なため、フォールバックを優先しつつパースを試みます
        pattern = r'href="/wiki/[^"]+" title="([^"]+?)"[^>]*>([^<]+?)</a>.*?(\d{1,3}(?:,\d{3})+)'
        matches = re.findall(pattern, html)
        
        results = {}
        for match in matches:
            pref = match[0] # 例: "東京都" または "東京都の人口"
            pref = pref.replace("の人口", "")
            if pref in PREF_MAP:
                pop_str = match[2].replace(",", "")
                results[PREF_MAP[pref]] = int(pop_str)
                
        if len(results) >= 40: # 40都道府県以上見つかれば成功とみなす
            print(f"Successfully scraped {len(results)} prefectures from Wikipedia.")
            return results
    except Exception as e:
        print(f"Scraping failed ({e}), using default fallback population data.")
        
    return DEFAULT_POPULATION

def main():
    os.makedirs("scripts/temp", exist_ok=True)
    data = fetch_population_from_web()
    
    output_path = "scripts/temp/population.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"Saved population data to {output_path}")

if __name__ == "__main__":
    main()
