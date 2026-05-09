import requests
import os
import concurrent.futures
import json  # 補上這行：處理 JSON 檔案所需

# 使用 r 前綴來避免 Windows 路徑的反斜線 (\) 被當作跳脫字元
save_dir = r"C:\Users\liskyo\Desktop\monstrehunter\monsterhunter_2026\public\game_images\MH_Renders"

# 建立存放資料庫圖片的專屬資料夾
os.makedirs(save_dir, exist_ok=True)

# 補上這行：Fandom API 的基底網址
base_url = "https://monsterhunter.fandom.com/api.php"

def fetch_image_url(session, monster_name, suffix):
    """
    透過 Fandom Search API 找尋特定後綴的圖片
    """
    search_query = f"{monster_name} {suffix}".strip()
    params = {
        "action": "query",
        "generator": "search",
        "gsrsearch": search_query,
        "gsrnamespace": 6,  # 6 代表 File 命名空間
        "gsrlimit": 1,      # 只拿最吻合的第一筆結果
        "prop": "imageinfo",
        "iiprop": "url",
        "format": "json"
    }
    
    try:
        res = session.get(base_url, params=params, timeout=10).json()
        pages = res.get('query', {}).get('pages', {})
        if pages:
            for page_id, data in pages.items():
                if 'imageinfo' in data:
                    return data['title'], data['imageinfo'][0]['url']
    except Exception:
        pass
    
    return None, None

def process_monster(monster):
    """處理單一魔物的多源比對與下載邏輯"""
    # 對應你 JSON 檔中的鍵值
    eng_name = monster.get("英文名")
    chi_name = monster.get("名稱", "未知魔物")
    
    if not eng_name:
        return f"⚠️ 缺少英文名稱，跳過: {chi_name}"

    # 統一將檔名的空格轉為底線 (例如: Abyssal_Lagiacrus.png)
    clean_name = eng_name.replace(" ", "_")
    
    # 組合出前端專案內的絕對路徑
    file_path = os.path.join(save_dir, f"{clean_name}.png")
    
    # 斷點續傳：檢查檔案是否已存在
    if os.path.exists(file_path):
        return f"⏭️ 已存在跳過: {chi_name} ({eng_name})"

    # 建立獨立連線
    with requests.Session() as session:
        # 多源比對策略 (優先順序: 渲染去背圖 -> UI 圖示 -> 任何圖檔)
        search_strategies = ["Render", "Icon", ""]
        
        img_url = None
        img_title = None
        used_strategy = ""

        for strategy in search_strategies:
            title, url = fetch_image_url(session, eng_name, strategy)
            if url:
                img_url = url
                img_title = title
                used_strategy = strategy if strategy else "General Image"
                break

        if not img_url:
            return f"❌ 找不到圖檔: {chi_name} ({eng_name})"

        # 執行下載
        try:
            img_data = session.get(img_url, timeout=15).content
            with open(file_path, 'wb') as f:
                f.write(img_data)
            return f"✅ 下載成功: {chi_name} | 來源: {used_strategy}"
        except Exception as e:
            return f"❌ 下載失敗: {chi_name} ({e})"

if __name__ == "__main__":
    json_filename = 'All_monsters.json'
    
    # 讀取你的真實 JSON 檔案
    try:
        with open(json_filename, 'r', encoding='utf-8') as f:
            data = json.load(f)
            # 抓取 "魔物" 陣列
            monster_db = data.get("魔物", [])
    except FileNotFoundError:
        print(f"❌ 找不到檔案 {json_filename}，請確認它與程式在同一層目錄！")
        exit()
    except json.JSONDecodeError:
        print(f"❌ {json_filename} 格式錯誤，請確認內容是合法的 JSON。")
        exit()

    print(f"🚀 成功載入資料庫，共 {len(monster_db)} 隻魔物。開始執行多源比對下載...\n")

    # 開啟 10 條執行緒併發處理 (加速搜尋與下載)
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        results = executor.map(process_monster, monster_db)
        for r in results:
            print(r)

    print("\n🎉 多源比對下載作業完成！")