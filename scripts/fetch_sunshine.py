import os
import json
import random

# 都道府県別年間日照時間（基準平均値、時間）
SUNSHINE_BASE = {
    1: 1700, 2: 1550, 3: 1680, 4: 1850, 5: 1450, 6: 1500, 7: 1720,
    8: 2050, 9: 1980, 10: 2150, 11: 2020, 12: 2050, 13: 2000, 14: 2080,
    15: 1550, 16: 1620, 17: 1680, 18: 1650, 19: 2250, 20: 2050, 21: 2030,
    22: 2180, 23: 2120, 24: 1920, 25: 1780, 26: 1750, 27: 2050, 28: 1980,
    29: 1850, 30: 1950, 31: 1680, 32: 1620, 33: 2030, 34: 2010, 35: 1950,
    36: 2080, 37: 2100, 38: 2050, 39: 2200, 40: 1980, 41: 1950, 42: 1820,
    43: 1920, 44: 1880, 45: 2120, 46: 1950, 47: 1800
}

def generate_timeline_data():
    """
    2000〜2024年の年間日照時間データを生成する。
    25年分の気候アノマリー（晴れ年、雨多し年）を設定。
    """
    print("Generating Sunshine Hours timeline data (2000-2024)...")
    
    random.seed(100) # 再現性
    
    timeline = {}
    years = list(range(2000, 2025))
    
    for year in years:
        # 2000年〜2024年までの毎年の全国日照アノマリー（平年を1.00とし、0.94〜1.07の範囲で揺らす）
        # 特定の年（例：酷暑の2010年(1.05)、2023年(1.07)、冷夏の2003年(0.93)など）を模擬
        if year == 2023:
            anomaly = 1.07
        elif year == 2010:
            anomaly = 1.05
        elif year == 2003:
            anomaly = 0.93
        elif year == 2020:
            anomaly = 0.95
        else:
            # それ以外の年はランダムで 0.96 〜 1.04 のアノマリーを決定
            # 決定的なアノマリーを作るため、yearをシードにしたローカル疑似乱数
            random.seed(year)
            anomaly = random.uniform(0.96, 1.04)
            
        year_data = {}
        for code, base_hours in SUNSHINE_BASE.items():
            # 都道府県個別の年次揺らぎ (±3%程度)
            random.seed(year + code) # 決定的な組み合わせ
            local_variation = 1.0 + random.uniform(-0.03, 0.03)
            
            val = base_hours * anomaly * local_variation
            year_data[code] = int(round(val))
            
        timeline[year] = year_data
        
    return timeline

def main():
    os.makedirs("scripts/temp", exist_ok=True)
    data = generate_timeline_data()
    
    output_path = "scripts/temp/sunshine.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        
    print(f"Saved Sunshine timeline data to {output_path}")

if __name__ == "__main__":
    main()
