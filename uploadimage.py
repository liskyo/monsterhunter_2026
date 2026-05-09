import requests
import os
import concurrent.futures

# 建立存放圖片的資料夾
os.makedirs('MH_Renders', exist_ok=True)

base_url = "https://monsterhunter.fandom.com/api.php"

def get_total_count():
    """透過 API 取得該分類下的總檔案數"""
    params = {
        "action": "query",
        "prop": "categoryinfo",
        "titles": "Category:Monster_Renders",
        "format": "json"
    }
    try:
        res = requests.get(base_url, params=params).json()
        pages = res.get('query', {}).get('pages', {})
        for page_id, info in pages.items():
            return info.get('categoryinfo', {}).get('files', '未知')
    except Exception:
        return '未知'

def download_image(img_info):
    """處理單一圖片下載的獨立工作"""
    title = img_info['title']
    url = img_info['url']
    
    # 整理檔名 (移除前綴與網址參數)
    img_name = title.replace("File:", "").replace(" ", "_").split('/')[0]
    file_path = f"MH_Renders/{img_name}"
    
    # 檢查檔案是否已存在，實現瞬間跳過
    if os.path.exists(file_path):
        return f"⏭️ 已存在跳過: {img_name}"
        
    try:
        img_data = requests.get(url, timeout=15).content
        with open(file_path, 'wb') as handler:
            handler.write(img_data)
        return f"✅ 下載成功: {img_name}"
    except Exception as e:
        return f"❌ 下載失敗: {img_name} ({e})"

if __name__ == "__main__":
    # 先查詢並印出總數量
    total_files = get_total_count()
    print(f"📊 查詢完畢：Category:Monster_Renders 總共有 {total_files} 張圖檔。")
    print("🚀 開始執行高效能批次併發下載...\n")

    cmcontinue = None
    
    # 使用 Session 保持 TCP 連線
    with requests.Session() as session:
        while True:
            # 1. 取得分類下的檔案名稱 (每次 500 筆)
            list_params = {
                "action": "query",
                "list": "categorymembers",
                "cmtitle": "Category:Monster_Renders",
                "cmtype": "file",
                "cmlimit": "500",
                "format": "json"
            }
            if cmcontinue:
                list_params["cmcontinue"] = cmcontinue

            res = session.get(base_url, params=list_params).json()
            files = res.get('query', {}).get('categorymembers', [])
            
            if not files:
                break
                
            file_titles = [f['title'] for f in files]
            
            # 2. 批次取得真實圖片網址 
            # MediaWiki API 一般權限允許每次最多查詢 50 筆 titles，所以將 500 筆分塊
            chunks = [file_titles[i:i + 50] for i in range(0, len(file_titles), 50)]
            all_image_infos = []
            
            for chunk in chunks:
                info_params = {
                    "action": "query",
                    "titles": "|".join(chunk),
                    "prop": "imageinfo",
                    "iiprop": "url",
                    "format": "json"
                }
                info_res = session.get(base_url, params=info_params).json()
                pages = info_res.get('query', {}).get('pages', {})
                
                for page_id, page_data in pages.items():
                    if 'imageinfo' in page_data:
                        all_image_infos.append({
                            'title': page_data['title'],
                            'url': page_data['imageinfo'][0]['url']
                        })

            # 3. 進入併發下載階段
            # max_workers=10 代表同時建立 10 條管線下載圖片，速度約可提升十倍以上
            with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
                results = executor.map(download_image, all_image_infos)
                for r in results:
                    print(r)

            # 檢查是否有下一頁的 Token
            if 'continue' in res:
                cmcontinue = res['continue']['cmcontinue']
            else:
                break

    print("\n🎉 全部圖檔下載作業完成！")