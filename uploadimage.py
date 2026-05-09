import requests
import os
import time

# 建立存放圖片的資料夾
os.makedirs('MH_Renders', exist_ok=True)

base_url = "https://monsterhunter.fandom.com/api.php"
cmcontinue = None

print("開始獲取魔物圖片列表...")

while True:
    # 1. 取得分類下的所有檔案名稱 (支援自動換頁)
    params = {
        "action": "query",
        "list": "categorymembers",
        "cmtitle": "Category:Monster_Renders",
        "cmtype": "file",
        "cmlimit": "500",  # 每次最多抓取 500 筆
        "format": "json"
    }
    if cmcontinue:
        params["cmcontinue"] = cmcontinue

    response = requests.get(base_url, params=params).json()
    files = response['query']['categorymembers']

    # 2. 針對每個檔案，透過 API 取得原始高畫質圖片的直連網址
    for f in files:
        file_title = f['title']
        img_params = {
            "action": "query",
            "titles": file_title,
            "prop": "imageinfo",
            "iiprop": "url",
            "format": "json"
        }
        
        try:
            img_res = requests.get(base_url, params=img_params).json()
            pages = img_res['query']['pages']
            
            for page_id in pages:
                if 'imageinfo' in pages[page_id]:
                    # 取得原圖 URL
                    img_url = pages[page_id]['imageinfo'][0]['url']
                    
                    # 整理檔名 (移除 "File:" 前綴)
                    img_name = file_title.replace("File:", "").replace(" ", "_")
                    img_name = img_name.split('/')[0] 
                    
                    # 🌟 新增這裡：檢查檔案是否已經存在 🌟
                    file_path = f"MH_Renders/{img_name}"
                    if os.path.exists(file_path):
                        print(f"已存在，跳過: {img_name}")
                        continue  # 直接跳到下一張圖片
                    
                    print(f"下載中: {img_name}")
                    
                    # 下載並存檔
                    img_data = requests.get(img_url).content
                    with open(file_path, 'wb') as handler:
                        handler.write(img_data)
                    
            time.sleep(0.5)  # 稍微延遲避免發送過多請求被阻擋
            
        except Exception as e:
            print(f"下載 {file_title} 時發生錯誤: {e}")

    # 檢查是否還有下一頁
    if 'continue' in response:
        cmcontinue = response['continue']['cmcontinue']
    else:
        break

print("全部下載完成！")