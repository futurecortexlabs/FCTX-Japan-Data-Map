import os
import json
import random

# 都道府県別子育てのしやすさ指数（基準平均値、100点満点）
CHILDCARE_BASE = {
    1: 70, 2: 78, 3: 82, 4: 75, 5: 85, 6: 86, 7: 80,
    8: 72, 9: 76, 10: 78, 11: 60, 12: 62, 13: 50, 14: 58,
    15: 84, 16: 86, 17: 85, 18: 88, 19: 76, 20: 82, 21: 78,
    22: 74, 23: 65, 24: 76, 25: 80, 26: 68, 27: 62, 28: 66,
    29: 74, 30: 76, 31: 88, 32: 90, 33: 78, 34: 75, 35: 78,
    36: 80, 37: 82, 38: 80, 39: 78, 40: 70, 41: 88, 42: 82,
    43: 84, 44: 85, 45: 82, 46: 80, 47: 74
}

def generate_timeline_data():
    print("Generating Childcare timeline data (2000-2024)...")
    random.seed(500)
    timeline = {}
    years = list(range(2000, 2025))
    
    for year in years:
        # 子育て環境は近年、全国的に少しずつ改善（待機児童解消の取組など）する長期トレンド（年率+0.3点程度）
        diff_years = year - 2000
        trend = diff_years * 0.3
        
        year_data = {}
        for code, base_score in CHILDCARE_BASE.items():
            # 都道府県個別の年次揺らぎ (±3点程度)
            random.seed(year * 9 + code)
            local_variation = random.uniform(-3, 3)
            val = base_score - (24 * 0.3) + trend + local_variation
            # 10〜99の範囲に収める
            year_data[code] = max(10, min(99, int(round(val))))
            
        timeline[year] = year_data
        
    return timeline

def main():
    os.makedirs("scripts/temp", exist_ok=True)
    data = generate_timeline_data()
    
    output_path = "scripts/temp/childcare.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        
    print(f"Saved Childcare timeline data to {output_path}")

if __name__ == "__main__":
    main()
