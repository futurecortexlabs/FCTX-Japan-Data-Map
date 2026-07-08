import os
import json
import random

# 都道府県別スギ・ヒノキ花粉飛散量レベル（基準平均値、低いほど快適）
POLLEN_BASE = {
    1: 5, 2: 30, 3: 40, 4: 55, 5: 35, 6: 45, 7: 60,
    8: 70, 9: 75, 10: 80, 11: 75, 12: 70, 13: 70, 14: 65,
    15: 45, 16: 40, 17: 45, 18: 50, 19: 75, 20: 60, 21: 65,
    22: 80, 23: 65, 24: 60, 25: 55, 26: 55, 27: 50, 28: 55,
    29: 60, 30: 65, 31: 45, 32: 40, 33: 50, 34: 55, 35: 50,
    36: 60, 37: 50, 38: 55, 39: 70, 40: 45, 41: 40, 42: 35,
    43: 50, 44: 45, 45: 55, 46: 40, 47: 2
}

def generate_timeline_data():
    print("Generating Pollen timeline data (2000-2024)...")
    random.seed(400)
    timeline = {}
    years = list(range(2000, 2025))
    
    for year in years:
        # 花粉は年ごとの気候（前年夏の猛暑など）で全国的に増減するアノマリー（平年比 0.7 〜 1.4）
        random.seed(year)
        annual_anomaly = random.uniform(0.7, 1.4)
        
        year_data = {}
        for code, base_pollen in POLLEN_BASE.items():
            # 都道府県個別の年次揺らぎ (±10%程度)
            random.seed(year * 7 + code)
            local_variation = 1.0 + random.uniform(-0.1, 0.1)
            val = base_pollen * annual_anomaly * local_variation
            # 最低値を1に設定
            year_data[code] = max(1, int(round(val)))
            
        timeline[year] = year_data
        
    return timeline

def main():
    os.makedirs("scripts/temp", exist_ok=True)
    data = generate_timeline_data()
    
    output_path = "scripts/temp/pollen.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        
    print(f"Saved Pollen timeline data to {output_path}")

if __name__ == "__main__":
    main()
