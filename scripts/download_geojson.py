import os
import urllib.request
import json

def main():
    # ダウンロード元のGeoJSON URL (dataofjapanの都道府県GeoJSON)
    url = "https://raw.githubusercontent.com/dataofjapan/land/master/japan.geojson"
    
    # 保存先ディレクトリの作成
    dest_dir = os.path.join("src", "data")
    os.makedirs(dest_dir, exist_ok=True)
    
    dest_path = os.path.join(dest_dir, "prefectures.json")
    
    print(f"Downloading GeoJSON from {url}...")
    try:
        urllib.request.urlretrieve(url, dest_path)
        print(f"Saved GeoJSON to {dest_path}")
        
        # プロパティの構造を確認するために最初の1つを表示
        with open(dest_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            if "features" in data and len(data["features"]) > 0:
                first_feature = data["features"][0]
                print("First feature properties preview:")
                print(json.dumps(first_feature.get("properties"), indent=2, ensure_ascii=False))
            else:
                print("No features found in the GeoJSON file.")
                
    except Exception as e:
        print(f"Error downloading or reading GeoJSON: {e}")

if __name__ == "__main__":
    main()
