import json
import os

# 假設這是你從網路上下載或自己建立的魔物基礎資料 JSON
json_file_path = 'monsters_data.json' 
image_folder = 'MH_Renders'

# 讀取 JSON
with open(json_file_path, 'r', encoding='utf-8') as f:
    monsters = json.load(f)

# 遍歷每一隻魔物，自動關聯圖片
for monster in monsters:
    eng_name = monster.get("englishName", "")
    if eng_name:
        # 將 "Abyssal Lagiacrus" 轉換為 "Abyssal_Lagiacrus.png"
        expected_filename = f"{eng_name.replace(' ', '_')}.png"
        
        # 檢查該圖片是否存在於我們剛剛下載的資料夾中
        if os.path.exists(os.path.join(image_folder, expected_filename)):
            # 如果存在，就幫這隻魔物的 JSON 加上圖片路徑
            monster["image_path"] = f"./{image_folder}/{expected_filename}"
        else:
            monster["image_path"] = None

# 將更新後的資料存回新的 JSON 檔
with open('monsters_with_images.json', 'w', encoding='utf-8') as f:
    json.dump(monsters, f, ensure_ascii=False, indent=2)

print("圖片路徑整合完成！")