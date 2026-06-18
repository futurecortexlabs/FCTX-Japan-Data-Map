import os
import json
import csv
import subprocess

# 都道府県コードから都道府県名へのマッピング
PREF_NAMES = {
    1: "北海道", 2: "青森県", 3: "岩手県", 4: "宮城県", 5: "秋田県", 6: "山形県", 7: "福島県",
    8: "茨城県", 9: "栃木県", 10: "群馬県", 11: "埼玉県", 12: "千葉県", 13: "東京都", 14: "神奈川県",
    15: "新潟県", 16: "富山県", 17: "石川県", 18: "福井県", 19: "山梨県", 20: "長野県", 21: "岐阜県",
    22: "静岡県", 23: "愛知県", 24: "三重県", 25: "滋賀県", 26: "京都府", 27: "大阪府", 28: "兵庫県",
    29: "奈良県", 30: "和歌山県", 31: "鳥取県", 32: "島根県", 33: "岡山県", 34: "広島県", 35: "山口県",
    36: "徳島県", 37: "香川県", 38: "愛媛県", 39: "高知県", 40: "福岡県", 41: "佐賀県", 42: "長崎県",
    43: "熊本県", 44: "大分県", 45: "宮崎県", 46: "鹿児島県", 47: "沖縄県"
}

# 都市集中がある特定の都道府県コード（三大都市圏・福岡・沖縄）
URBAN_PREFECTURES = [11, 12, 13, 14, 23, 27, 40, 47]

def run_script_if_missing(file_path, script_name):
    """
    必要なデータファイルがない場合に、対応するスクリプトを実行して作成する
    """
    if not os.path.exists(file_path):
        print(f"Data file '{file_path}' is missing. Executing {script_name}...")
        try:
            subprocess.run(["python", os.path.join("scripts", script_name)], check=True)
        except Exception as e:
            print(f"Error running {script_name}: {e}")

def load_json_data(file_path):
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return {int(k): v for k, v in data.items()}
    except Exception as e:
        print(f"Error loading {file_path}: {e}")
        return {}

def load_json_timeline_data(file_path):
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return {int(year): {int(pref): val for pref, val in year_data.items()} for year, year_data in data.items()}
    except Exception as e:
        print(f"Error loading timeline {file_path}: {e}")
        return {}

def get_historical_land_price_index(year, code):
    """
    過去25年間の歴史的な地価アノマリー（バブル、リーマンショック、アベノミクス）インデックスを返す
    2024年の地価を 1.0 とする
    """
    diff_years = 2024 - year
    
    if code in URBAN_PREFECTURES:
        # 都市部：デフレ下落 -> プチバブル -> リーマンショック暴落 -> アベノミクス急騰
        # 各年の都市部インデックス目安
        indices = {
            2000: 0.90, 2001: 0.86, 2002: 0.81, 2003: 0.77, 2004: 0.74, 2005: 0.75,
            2006: 0.81, 2007: 0.88, 2008: 0.90,  # 2008年ファンドバブルピーク
            2009: 0.72, 2010: 0.70, 2011: 0.68, 2012: 0.67,  # リーマンショック後の底
            2013: 0.71, 2014: 0.75, 2015: 0.78, 2016: 0.81, 2017: 0.85, 2018: 0.89,
            2019: 0.92, 2020: 0.93, 2021: 0.90, 2022: 0.93, 2023: 0.97, 2024: 1.00
        }
        return indices.get(year, 1.0)
    else:
        # 地方部：25年間一貫して緩やかに下落している傾向
        # 2000年時点は2024年の約1.2倍高かったとする
        return 1.0 + (0.012 * diff_years)

def main():
    pop_file = "scripts/temp/population.json"
    price_file = "scripts/temp/land_price.json"
    companies_file = "scripts/temp/listed_companies.json"
    starbucks_file = "scripts/temp/starbucks.json"
    ramen_file = "scripts/temp/ramen.json"
    attractiveness_file = "scripts/temp/attractiveness.json"
    sunshine_file = "scripts/temp/sunshine.json"
    
    # 欠落データスクリプトの自動実行
    run_script_if_missing(pop_file, "fetch_population.py")
    run_script_if_missing(price_file, "fetch_land_price.py")
    run_script_if_missing(companies_file, "fetch_listed_companies.py")
    run_script_if_missing(starbucks_file, "fetch_starbucks.py")
    run_script_if_missing(ramen_file, "fetch_ramen.py")
    run_script_if_missing(attractiveness_file, "fetch_attractiveness.py")
    run_script_if_missing(sunshine_file, "fetch_sunshine.py")
    
    # データのロード
    pop_base = load_json_data(pop_file)
    price_base = load_json_data(price_file)
    comp_base = load_json_data(companies_file)
    
    starbucks_timeline = load_json_timeline_data(starbucks_file)
    ramen_timeline = load_json_timeline_data(ramen_file)
    attractiveness_timeline = load_json_timeline_data(attractiveness_file)
    sunshine_timeline = load_json_timeline_data(sunshine_file)
    
    # 保存先
    dest_dir = os.path.join("src", "data")
    os.makedirs(dest_dir, exist_ok=True)
    dest_csv = os.path.join(dest_dir, "sample_prefecture_data.csv")
    
    print(f"Building 25-year timeline dataset and writing to {dest_csv}...")
    
    years = list(range(2000, 2025))
    
    try:
        with open(dest_csv, "w", encoding="utf-8", newline="") as f:
            writer = csv.writer(f)
            # ヘッダー
            writer.writerow([
                "year", "prefCode", "prefName", 
                "landPrice", "population", "listedCompanies",
                "starbucksCount", "ramenCount", "attractiveness", "sunshineHours"
            ])
            
            # 各年ごとに全都道府県のデータを結合
            for year in years:
                for code in range(1, 48):
                    name = PREF_NAMES.get(code, "不明")
                    diff_years = 2024 - year
                    
                    # 1. 人口の時系列計算 (25年間の人口移動・少子化トレンド)
                    pop_2024 = pop_base.get(code, 1000000)
                    if code in URBAN_PREFECTURES:
                        # 都市部は過去の方が人口が少ない (年率約 -0.6% で遡る)
                        # 例：東京(1400万)は2000年時点で約1200万人
                        pop = int(pop_2024 * (1 - 0.006 * diff_years))
                    else:
                        # 地方部は過去の方が人口が多い (年率約 +0.9% で遡る)
                        # 例：秋田(95万)は2000年時点で約115万人以上
                        pop = int(pop_2024 * (1 + 0.009 * diff_years))
                        
                    # 2. 地価の時系列計算 (歴史的イベントインデックス適用)
                    price_2024 = price_base.get(code, 50000)
                    index = get_historical_land_price_index(year, code)
                    price = int(price_2024 * index)
                        
                    # 3. 上場企業数の時系列計算
                    comp_2024 = comp_base.get(code, 10)
                    # 企業数は過去に向かって減少していると仮定 (年率約 -2.2% で遡る、下限1社)
                    comp = int(comp_2024 * (1 - 0.022 * diff_years))
                    comp = max(1, comp)
                    
                    # 4. 新規タイムライン指標のマッピング
                    starbucks = starbucks_timeline.get(year, {}).get(code)
                    ramen = ramen_timeline.get(year, {}).get(code)
                    attr = attractiveness_timeline.get(year, {}).get(code)
                    sunshine = sunshine_timeline.get(year, {}).get(code)
                    
                    writer.writerow([
                        year, code, name,
                        price, pop, comp,
                        starbucks, ramen, attr, sunshine
                    ])
                    
        print("25-year timeline dataset successfully built!")
        
    except Exception as e:
        print(f"Failed to write CSV: {e}")

if __name__ == "__main__":
    main()
