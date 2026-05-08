const fs = require('fs');

const namesDict = {
  // Base monsters
  'Rathalos': '雄火龍', 'Rathian': '雌火龍', 'Zinogre': '雷狼龍', 'Nergigante': '滅盡龍',
  'Diablos': '角龍', 'Tigrex': '轟龍', 'Nargacuga': '迅龍', 'Barioth': '冰牙龍',
  'Velkhana': '冰呪龍', 'Teostra': '炎王龍', 'Kushala Daora': '鋼龍', 'Rajang': '金獅子',
  'Brachydios': '碎龍', 'Glavenus': '斬龍', 'Mizutsune': '泡狐龍', 'Astalos': '電龍',
  'Gammoth': '巨獸', 'Valstrax': '天彗龍', 'Magnamalo': '怨虎龍', 'Gore Magala': '黑蝕龍',
  'Shagaru Magala': '天廻龍', 'Fatalis': '黑龍', 'Alatreon': '煌黑龍', 'Deviljho': '恐暴龍',
  'Bazelgeuse': '爆鱗龍', 'Legiana': '風漂龍', 'Odogaron': '慘爪龍', 'Anjanath': '蠻顎龍',
  'Pukei-Pukei': '毒妖鳥', 'Kulu-Ya-Ku': '搔鳥', 'Tobi-Kadachi': '飛雷龍', 'Jyuratodus': '泥魚龍',
  'Barroth': '土砂龍', 'Uragaan': '爆鎚龍', 'Radobaan': '骨鎚龍', 'Paolumu': '浮空龍',
  'Great Jagras': '大凶豺龍', 'Great Girros': '大凶顎龍', 'Dodogama': '岩賊龍', 'Lavasioth': '烤魚',
  'Kirin': '麒麟', 'Lunastra': '炎妃龍', 'Vaal Hazak': '屍套龍', "Xeno'jiiva": '冥燈龍',
  "Safi'jiiva": '冥赤龍', 'Namielle': '溟波龍', 'Shara Ishvalda': '天地煌啼龍',
  'Yian Kut-Ku': '大怪鳥', 'Gypceros': '毒怪鳥', 'Khezu': '奇怪龍', 'Plesioth': '水龍',
  'Monoblos': '一角龍', 'Basarios': '岩龍', 'Gravios': '鎧龍', 'Cephadrome': '沙龍王',
  'Agnaktor': '炎戈龍', 'Ahtal-Ka': '閣螳螂', 'Aknosom': '傘鳥', 'Almudron': '泥翁龍',
  'Bishaten': '天狗獸', 'Goss Harag': '雪鬼獸', 'Somnacanth': '人魚龍', 'Rakna-Kadaki': '妃蜘蛛',
  'Great Izuchi': '鐮鼬龍王', 'Tetranadon': '河童蛙', 'Aptonoth': '草食龍', 'Kelbi': '精靈鹿',
  'Gargwa': '丸鳥', 'Bullfango': '野豬', 'Bulldrome': '野豬王', 'Velociprey': '藍速龍',
  'Velocidrome': '藍速龍王', 'Genprey': '黃速龍', 'Gendrome': '黃速龍王', 'Ioprey': '紅速龍',
  'Iodrome': '紅速龍王', 'Arzuros': '青熊獸', 'Lagombi': '白兔獸', 'Volvidon': '赤甲獸',
  'Qurupeco': '彩鳥', 'Royal Ludroth': '水獸', 'Lagiacrus': '海龍', 'Seregios': '千刃龍', 
  'Gogmazios': '巨戟龍', 'Dalamadur': '蛇王龍', 'Amatsu': '嵐龍', 'Nakarkos': '骸龍', 
  'Malfestio': '夜鳥', 'Maccao': '跳狗龍', 'Great Maccao': '跳狗龍王', 'Tetsucabra': '鬼蛙', 
  'Zamtrios': '化鮫', 'Nerscylla': '影蜘蛛', 'Seltas': '徹甲蟲', 'Seltas Queen': '重甲蟲', 
  'Kecha Wacha': '奇猿狐', 'Congalala': '桃毛獸王', 'Blangonga': '雪獅子王', 'Yian Garuga': '黑狼鳥', 
  'Tzitzi-Ya-Ku': '眩鳥', 'Banbaro': '猛牛龍', 'Beotodus': '冰魚龍', 'Zorah Magdaros': '熔山龍',
  'Ukanlos': '崩龍', 'Akantor': '霸龍', 'Shen Gaoren': '砦蟹', 'Lao-Shan Lung': '老山龍',
  'Dire Miralis': '煉黑龍', 'Ceadeus': '大海龍', 'Jhen Mohran': '峯山龍', "Dah'ren Mohran": '豪山龍',
  'Duramboros': '尾槌龍', 'Nibelsnarf': '潛口龍', 'Gigginox': '毒怪龍', 'Najarala': '絞蛇龍',
  'Zamite': '變形冰鯊幼體', 'Uroktor': '溶岩獸', 'Rhenoplos': '硬甲龍', 'Slagtoth': '垂皮龍',
  'Apceros': '草食龍', 'Popo': '波波', 'Anteka': '雪鹿', 'Gajau': '咬魚', 'Delex': '沙龍',
  'Hermitaur': '盾蟹', 'Ceanataur': '鐮蟹', 'Shogun Ceanataur': '將軍鐮蟹', 'Daimyo Hermitaur': '大名盾蟹',
  'Maccao': '跳狗龍', 'Jaggi': '狗龍', 'Jaggia': '雌狗龍', 'Great Jaggi': '狗龍王',
  'Baggi': '眠狗龍', 'Great Baggi': '眠狗龍王', 'Wroggi': '毒狗龍', 'Great Wroggi': '毒狗龍王',
  'Chameleos': '霞龍', 'Narwa the Allmother': '百龍淵源雷神龍', 'Wind Serpent Ibushi': '風神龍',
  'Thunder Serpent Narwa': '雷神龍', 'Gaismagorm': '冥淵龍', 'Malzeno': '爵銀龍', 'Lunagaron': '冰狼龍',
  'Garangolm': '剛纏獸', 'Gowngoat': '麗羊獸', 'Boggit': '狡狗龍', 'Boggi': '狡狗龍',
  
  // Deviants
  'Apex Arzuros': '首領青熊獸', 'Apex Diablos': '首領角龍', 'Apex Mizutsune': '首領泡狐龍',
  'Apex Rathalos': '首領雄火龍', 'Apex Rathian': '首領雌火龍', 'Apex Zinogre': '首領雷狼龍',
  'Bloodbath Diablos': '鏖魔角龍', 'Boltreaver Astalos': '青電主電龍', 'Crystalbeard Uragaan': '寶纏爆鎚龍',
  'Deadeye Yian Garuga': '隻眼黑狼鳥', 'Dreadking Rathalos': '黑炎王雄火龍', 'Dreadqueen Rathian': '紫毒姬雌火龍',
  'Drilltusk Tetsucabra': '岩穿鬼蛙', 'Elderfrost Gammoth': '銀嶺巨獸', 'Grimclaw Tigrex': '荒鉤爪轟龍',
  'Hellblade Glavenus': '燼滅刃斬龍', 'Nightcloak Malfestio': '朧隱夜鳥', 'Redhelm Arzuros': '紅兜青熊獸',
  'Rustrazor Ceanataur': '鎧裂將軍鐮蟹', 'Silverwind Nargacuga': '白疾風迅龍', 'Snowbaron Lagombi': '大雪主白兔獸',
  'Soulseer Mizutsune': '天眼泡狐龍', 'Stonefist Hermitaur': '矛碎大名盾蟹',
  
  // Variants/Subspecies
  'Abyssal Lagiacrus': '冥海龍', 'Acidic Glavenus': '硫斬龍', 'Ashen Lao-Shan Lung': '蒼老山龍',
  'Azure Rathalos': '蒼火龍', 'Baleful Gigginox': '電怪龍', 'Berserk Tetsucabra': '荒鬼蛙',
  'Black Diablos': '黑角龍', 'Black Gravios': '黑鎧龍', 'Blackveil Vaal Hazak': '霧瘴屍套龍',
  'Blood Orange Bishaten': '緋天狗獸', 'Blue Yian Kut-Ku': '青怪鳥', 'Brute Tigrex': '黑轟龍',
  'Chaotic Gore Magala': '混沌黑蝕龍', 'Copper Blangonga': '砂獅子', 'Coral Pukei-Pukei': '水妖鳥',
  'Crimson Fatalis': '紅黑龍', 'Crimson Qurupeco': '紅彩鳥', 'Crimson Glow Valstrax': '秘紅赫耀的天彗龍',
  'Desert Seltas': '斧甲蟲', 'Desert Seltas Queen': '炮甲蟲', 'Ebony Odogaron': '凶爪龍',
  'Emerald Congalala': '綠毛獸', 'Flaming Espinas': '棘茶龍', 'Frostfang Barioth': '霜刃冰牙龍',
  'Fulgur Anjanath': '雷顎龍', 'Furious Rajang': '激昂金獅子', 'Glacial Agnaktor': '凍戈龍',
  'Gold Rathian': '金火龍', 'Goldbeard Ceadeus': '皇海龍', 'Green Nargacuga': '綠迅龍',
  'Green Plesioth': '翠水龍', 'Hallowed Jhen Mohran': '靈山龍', 'Ivory Lagiacrus': '白海龍',
  'Jade Barroth': '冰碎龍', 'Lucent Nargacuga': '月辰迅龍', 'Magma Almudron': '熔翁龍',
  'Molten Tigrex': '大轟龍', 'Nightshade Paolumu': '浮眠龍', 'Old Fatalis': '祖龍',
  'Oroshi Kirin': '冰麒麟', 'Pink Rathian': '櫻火龍', 'Plum Daimyo Hermitaur': '紫盾蟹',
  'Purple Gypceros': '毒怪鳥亞種', 'Purple Ludroth': '紫水獸', 'Pyre Rakna-Kadaki': '熾妃蜘蛛',
  'Raging Brachydios': '猛爆碎龍', 'Red Khezu': '赤甲龍', 'Risen Chameleos': '傀異克服霞龍',
  'Risen Kushala Daora': '傀異克服鋼龍', 'Risen Shagaru Magala': '傀異克服天廻龍', 'Risen Teostra': '傀異克服炎王龍',
  'Risen Crimson Glow Valstrax': '傀異克服秘紅赫耀的天彗龍', 'Ruby Basarios': '桃岩龍',
  'Ruiner Nergigante': '殲世滅盡龍', 'Rust Duramboros': '尾斧龍', 'Rusted Kushala Daora': '鏽鋼龍',
  'Sand Barioth': '風牙龍', 'Savage Deviljho': '怒食恐暴龍', 'Scarred Yian Garuga': '戰痕黑狼鳥',
  'Scorned Magnamalo': '怨嗟響徹怨虎龍', 'Seething Bazelgeuse': '紅蓮滾滾爆鱗龍', 'Shah Dalamadur': '蛇帝龍',
  'Shrieking Legiana': '霜翼風漂龍', 'Shrouded Nerscylla': '骸蜘蛛', 'Silver Rathalos': '銀火龍',
  'Steel Uragaan': '鋼鎚龍', 'Stygian Zinogre': '獄狼龍', 'Terra Shogun Ceanataur': '鐮蟹亞種',
  'Thunderlord Zinogre': '金雷公雷狼龍', 'Tidal Najarala': '水蛇龍', 'Tigerstripe Zamtrios': '虎鮫',
  'Violet Mizutsune': '焰狐龍', 'Viper Tobi-Kadachi': '飛毒龍', 'White Fatalis': '祖龍',
  'White Monoblos': '白一角龍'
};

const filePath = 'C:/Users/gc/Desktop/MonsterHunter_2026/public/game_jsons/base_monsters.json.bak';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

for (let i = 0; i < data.monsters.length; i++) {
  const monster = data.monsters[i];
  // restore names from our big dict or fallback to current translated if dict has missing
  if (monster.name && namesDict[monster.name]) {
    monster.name = namesDict[monster.name];
  }
}

fs.writeFileSync('C:/Users/gc/Desktop/MonsterHunter_2026/public/game_jsons/base_monsters.json', JSON.stringify(data, null, 2), 'utf8');
console.log('Done mapping names to perfect official Chinese.');
