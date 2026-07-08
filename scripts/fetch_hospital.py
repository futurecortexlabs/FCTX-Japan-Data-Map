import os
import json
import random

# 都道府県別病院・医療施設数（基準平均値）
HOSPITAL_BASE = {
    1: 560, 2: 140, 3: 130, 4: 215, 5: 110, 6: 125, 7: 205,
    8: 260, 9: 185, 10: 195, 11: 520, 12: 440, 13: 650, 14: 580,
    15: 235, 16: 115, 17: 135, 18: 95, 19: 90, 20: 220, 21: 200,
    22: 320, 23: 560, 24: 175, 25: 125, 26: 285, 27: 510, 28: 450,
    29: 125, 30: 120, 31: 75, 32: 95, 33: 195, 34: 285, 35: 135,
    36: 105, 37: 115, 38: 155, 39: 110, 40: 460, 41: 95, 42: 165,
    43: 205, 44: 145, 45: 125, 46: 210, 47: 120
}

def generate_timeline_data():
    print("Generating Hospital timeline data (2000-2024)...")
    random.seed(300)
    timeline = {}
    years = list(range(2000, 2025))
    
    for year in years:
        year_data = {}
        for code, base_hosp in HOSPITAL_BASE.items():
            # 医療機関数は年々少しずつ変動（±3%の揺らぎ）
            random.seed(year * 5 + code)
            local_variation = 1.0 + random.uniform(-0.02, 0.02)
            val = base_hosp * local_variation
            year_data[code] = max(1, int(round(val)))
            
        timeline[year] = year_data
        
    return timeline

def main():
    os.makedirs("scripts/temp", exist_ok=True)
    data = generate_timeline_data()
    
    output_path = "scripts/temp/hospital.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        
    print(f"Saved Hospital timeline data to {output_path}")

if __name__ == "__main__":
    main()
