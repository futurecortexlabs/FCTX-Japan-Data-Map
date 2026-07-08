import os
import json
import random

# 都道府県別温泉地数（基準平均値）
ONSEN_BASE = {
    1: 240, 2: 140, 3: 110, 4: 60, 5: 90, 6: 120, 7: 135,
    8: 25, 9: 75, 10: 105, 11: 20, 12: 30, 13: 25, 14: 45,
    15: 145, 16: 75, 17: 70, 18: 35, 19: 50, 20: 210, 21: 85,
    22: 125, 23: 30, 24: 40, 25: 25, 26: 30, 27: 20, 28: 75,
    29: 25, 30: 55, 31: 35, 32: 60, 33: 35, 34: 45, 35: 30,
    36: 25, 37: 15, 38: 45, 39: 25, 40: 50, 41: 30, 42: 55,
    43: 135, 44: 250, 45: 80, 46: 175, 47: 10
}

def generate_timeline_data():
    print("Generating Onsen timeline data (2000-2024)...")
    random.seed(200)
    timeline = {}
    years = list(range(2000, 2025))
    
    for year in years:
        year_data = {}
        for code, base_onsen in ONSEN_BASE.items():
            # 温泉数は年々緩やかに微増・微減傾向（±5%の揺らぎ）
            random.seed(year * 3 + code)
            local_variation = 1.0 + random.uniform(-0.04, 0.04)
            val = base_onsen * local_variation
            year_data[code] = max(1, int(round(val)))
            
        timeline[year] = year_data
        
    return timeline

def main():
    os.makedirs("scripts/temp", exist_ok=True)
    data = generate_timeline_data()
    
    output_path = "scripts/temp/onsen.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        
    print(f"Saved Onsen timeline data to {output_path}")

if __name__ == "__main__":
    main()
