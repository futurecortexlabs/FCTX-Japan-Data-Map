import os
import json

# 各都道府県のスターバックス店舗数（2024年目安）
STARBUCKS_2024 = {
    1: 48, 2: 8, 3: 7, 4: 22, 5: 6, 6: 7, 7: 14,
    8: 18, 9: 16, 10: 17, 11: 68, 12: 56, 13: 395, 14: 110,
    15: 16, 16: 12, 17: 15, 18: 9, 19: 11, 20: 18, 21: 15,
    22: 32, 23: 75, 24: 16, 25: 14, 26: 41, 27: 138, 28: 52,
    29: 12, 30: 8, 31: 5, 32: 5, 33: 16, 34: 28, 35: 11,
    36: 6, 37: 9, 38: 12, 39: 6, 40: 66, 41: 7, 42: 10,
    43: 18, 44: 11, 45: 9, 46: 12, 47: 28
}

def generate_timeline_data():
    """
    2000〜2024年のスターバックス実店舗数を計算する。
    スターバックスの歴史的日本進出推移（2000年時点の少店舗数、鳥取島根等の未出店県）をシミュレート。
    """
    print("Generating Starbucks store timeline data (2000-2024)...")
    
    # 日本全体での年次店舗数スケール比率の近似
    yearly_scales = {}
    for y in range(2000, 2025):
        if y <= 2005:
            t = (y - 2000) / 5
            yearly_scales[y] = 0.08 + (0.26 - 0.08) * t
        elif y <= 2010:
            t = (y - 2005) / 5
            yearly_scales[y] = 0.26 + (0.47 - 0.26) * t
        elif y <= 2015:
            t = (y - 2010) / 5
            yearly_scales[y] = 0.47 + (0.65 - 0.47) * t
        elif y <= 2020:
            t = (y - 2015) / 5
            yearly_scales[y] = 0.65 + (0.85 - 0.65) * t
        else:
            t = (y - 2020) / 4
            yearly_scales[y] = 0.85 + (1.0 - 0.85) * t
            
    timeline = {}
    
    for year in range(2000, 2025):
        ratio = yearly_scales[year]
        year_data = {}
        
        for code, count_2024 in STARBUCKS_2024.items():
            stores = count_2024 * ratio
            
            # ヒストリカルな未進出県の調整
            if code == 32 and year < 2013:
                stores = 0
            elif code == 31 and year < 2015:
                stores = 0
            elif count_2024 <= 10 and stores < 0.5:
                # 0.5店舗未満（四捨五入して0になる店舗数）は未進出とみなして0にする
                stores = 0
                
            year_data[code] = int(round(stores))
            
        timeline[year] = year_data
        
    return timeline

def main():
    os.makedirs("scripts/temp", exist_ok=True)
    data = generate_timeline_data()
    
    output_path = "scripts/temp/starbucks.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        
    print(f"Saved Starbucks timeline data to {output_path}")

if __name__ == "__main__":
    main()
