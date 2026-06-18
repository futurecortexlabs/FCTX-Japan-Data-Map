import os
import json

# 代表的な各都道府県の平均地価 (基準地価または公示地価の平均目安、円/㎡)
DEFAULT_LAND_PRICES = {
    1: 68000, 2: 25000, 3: 26000, 4: 67000, 5: 21000, 6: 23000, 7: 31000,
    8: 38000, 9: 36000, 10: 37000, 11: 152000, 12: 133000, 13: 1150000, 14: 265000,
    15: 38000, 16: 38000, 17: 54000, 18: 36000, 19: 38000, 20: 39000, 21: 42000,
    22: 78000, 23: 225000, 24: 43000, 25: 55000, 26: 210000, 27: 310000, 28: 145000,
    29: 75000, 30: 38000, 31: 22000, 32: 23000, 33: 58000, 34: 95000, 35: 35000,
    36: 34000, 37: 52000, 38: 44000, 39: 36000, 40: 175000, 41: 31000, 42: 47000,
    43: 58000, 44: 39000, 45: 32000, 46: 46000, 47: 78000
}

def fetch_land_prices():
    """
    最新の都道府県別平均地価データを取得する。
    ※ 実際には国交省の公示地価データベースやオープンCSVをダウンロードしてパースすることも可能。
    ※ ここでは、基準データをベースに、最新の地価上昇率（例えば一律+1.5%などの微調整）を掛け合わせて
    ※ 動的な最新予測データを作成します。
    """
    print("Simulating land price fetch from Ministry of Land, Infrastructure, Transport and Tourism data...")
    # 近年の地価上昇傾向（平均+1.8%程度）を仮定して少し最新化するロジック
    latest_prices = {}
    for code, price in DEFAULT_LAND_PRICES.items():
        # 大都市圏は少し高めに上昇、地方は微増
        if code in [13, 14, 27, 23, 40]:  # 東京、神奈川、大阪、愛知、福岡
            latest_prices[code] = int(price * 1.025)
        else:
            latest_prices[code] = int(price * 1.008)
            
    return latest_prices

def main():
    os.makedirs("scripts/temp", exist_ok=True)
    data = fetch_land_prices()
    
    output_path = "scripts/temp/land_price.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        
    print(f"Saved land price data to {output_path}")

if __name__ == "__main__":
    main()
