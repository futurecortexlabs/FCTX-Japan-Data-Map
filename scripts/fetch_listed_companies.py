import os
import json
import urllib.request

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

# フォールバック用上場企業数データ
DEFAULT_LISTED_COMPANIES = {
    1: 55, 2: 6, 3: 9, 4: 26, 5: 6, 6: 8, 7: 15,
    8: 23, 9: 27, 10: 23, 11: 75, 12: 50, 13: 2050, 14: 180,
    15: 40, 16: 28, 17: 31, 18: 22, 19: 10, 20: 38, 21: 25,
    22: 50, 23: 230, 24: 23, 25: 16, 26: 70, 27: 440, 28: 80,
    29: 10, 30: 11, 31: 5, 32: 6, 33: 29, 34: 50, 35: 22,
    36: 7, 37: 16, 38: 20, 39: 9, 40: 90, 41: 11, 42: 13,
    43: 25, 44: 15, 45: 12, 46: 15, 47: 17
}

def fetch_listed_companies_from_jpx():
    """
    JPXの上場銘柄一覧 Excelをダウンロードし、都道府県ごとの上場企業数を集計する
    """
    xls_url = "https://www.jpx.co.jp/markets/exports/jpx_tse_lst_t.xls"
    temp_xls = "scripts/temp/jpx_tse_lst_t.xls"
    
    try:
        # pandasと xlrd(xlsの読み込みに必要) がインストールされているか確認
        import pandas as pd
        
        print(f"Downloading JPX listed companies list from {xls_url}...")
        headers = {"User-Agent": "Mozilla/5.0"}
        req = urllib.request.Request(xls_url, headers=headers)
        with urllib.request.urlopen(req, timeout=15) as response:
            with open(temp_xls, "wb") as out_file:
                out_file.write(response.read())
        
        print("Parsing JPX Excel file...")
        # Excelファイルのロード (通常最初のシートにデータがある)
        df = pd.read_excel(temp_xls)
        
        # JPXのExcelは「住所」や「33業種区分」などの列があります。
        # 通常、列名は「住所」または「所在地」などになります。
        # 列名の中に「住所」や「所在地」を含む列を探します。
        address_col = None
        for col in df.columns:
            if any(k in str(col) for k in ["住所", "所在地", "Address"]):
                address_col = col
                break
                
        if address_col is None:
            # カラム名に日本語が含まれていない/見つからない場合は、dfのデータ内を走査
            # 1行目がヘッダーの可能性があるため
            df.columns = df.iloc[0]
            df = df[1:]
            for col in df.columns:
                if any(k in str(col) for k in ["住所", "所在地", "Address"]):
                    address_col = col
                    break
        
        if address_col is None:
            raise Exception("Address column not found in JPX Excel file.")
            
        print(f"Aggregating companies by prefecture using column: '{address_col}'...")
        
        # 都道府県ごとの件数をカウント
        counts = {code: 0 for code in PREF_MAP.values()}
        
        for idx, row in df.iterrows():
            address = str(row[address_col])
            # 住所の先頭から都道府県名を判定 (例: "東京都中央区..." -> "東京都")
            for pref_name, code in PREF_MAP.items():
                if address.startswith(pref_name):
                    counts[code] += 1
                    break
                    
        # 不要になった一時ファイルを削除
        if os.path.exists(temp_xls):
            os.remove(temp_xls)
            
        print(f"Successfully counted listed companies for {sum(1 for c in counts.values() if c > 0)} prefectures.")
        return counts
        
    except ImportError:
        print("pandas or xlrd is not installed. To fetch live JPX data, install them via 'pip install pandas xlrd'.")
        print("Using default fallback listed companies data.")
    except Exception as e:
        print(f"Failed to fetch live JPX data ({e}). Using default fallback listed companies data.")
        if os.path.exists(temp_xls):
            try:
                os.remove(temp_xls)
            except:
                pass
                
    return DEFAULT_LISTED_COMPANIES

def main():
    os.makedirs("scripts/temp", exist_ok=True)
    data = fetch_listed_companies_from_jpx()
    
    output_path = "scripts/temp/listed_companies.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        
    print(f"Saved listed companies data to {output_path}")

if __name__ == "__main__":
    main()
