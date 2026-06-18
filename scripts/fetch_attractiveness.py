import os
import json
import random

# 都道府県魅力度スコア（2024年目安）
ATTRACTIVENESS_2024 = {
    1: 72.4, 2: 18.5, 3: 17.2, 4: 25.4, 5: 16.5, 6: 18.1, 7: 17.8,
    8: 14.2, 9: 15.6, 10: 15.9, 11: 19.8, 12: 23.4, 13: 48.2, 14: 42.1,
    15: 19.5, 16: 18.9, 17: 28.5, 18: 17.9, 19: 21.0, 20: 27.5, 21: 17.4,
    22: 24.5, 23: 20.8, 24: 18.4, 25: 19.0, 26: 56.5, 27: 38.6, 28: 32.1,
    29: 26.5, 30: 17.6, 31: 16.2, 32: 16.5, 33: 18.6, 34: 25.1, 35: 16.8,
    36: 15.5, 37: 18.2, 38: 19.4, 39: 18.5, 40: 30.5, 41: 15.2, 42: 22.5,
    43: 23.8, 44: 19.2, 45: 20.1, 46: 21.5, 47: 54.2
}

def generate_timeline_data():
    """
    2000〜2024年（25年間）の都道府県魅力度スコアを生成する。
    歴史的順位を保ちつつ、年次プロモーションによる緩やかな推移や揺らぎをシミュレート。
    """
    print("Generating Attractiveness timeline data (2000-2024)...")
    
    random.seed(42) # 再現性
    
    timeline = {}
    years = list(range(2000, 2025))
    
    for year in years:
        year_data = {}
        for code, score_2024 in ATTRACTIVENESS_2024.items():
            # 2024年からの差分
            diff_year = 2024 - year
            
            # 25年間の長期的な地域プロモーションのトレンド
            special_trend = 0
            if code == 8:  # 茨城県
                # 2000年は今よりもっと低かったとする
                special_trend = -0.4 * diff_year 
            elif code == 17:  # 石川県
                # 金沢新幹線開通などによる魅力向上を反映し、過去の方が低い
                special_trend = -0.3 * diff_year
            elif code == 47:  # 沖縄県
                # 2000年前後の沖縄ブームによる高水準
                special_trend = 0.1 * diff_year
                
            # ランダム揺らぎ (年ごとに±1.5ポイント程度の軽微なノイズ)
            # 各都道府県ごとにサインカーブなどを組み合わせた周期的な変動も入れるとよりリアル
            wave = 1.2 * math_sin_wave(code, year)
            
            val = score_2024 + special_trend + wave
            val = max(10.0, min(90.0, val))
            
            year_data[code] = round(val, 1)
            
        timeline[year] = year_data
        
    return timeline

def math_sin_wave(code, year):
    """
    都道府県ごとに少し異なる周期で変化するサイン波を生成して、自然な変動トレンドを再現する
    """
    import math
    # 都道府県コードをシード値的に使って位相をずらす
    phase = code * 0.5
    freq = 0.2 # 変動周期（約5年周期）
    return math.sin(year * freq + phase)

def main():
    os.makedirs("scripts/temp", exist_ok=True)
    data = generate_timeline_data()
    
    output_path = "scripts/temp/attractiveness.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        
    print(f"Saved Attractiveness timeline data to {output_path}")

if __name__ == "__main__":
    main()
