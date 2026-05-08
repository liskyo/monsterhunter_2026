const fs = require('fs');
const https = require('https');

const namesDict = {
  'Ajarakan': '炎尾猴', 'Arkveld': '鎖刃龍', 'Balahara': '沙海龍', 'Chatacabra': '纏蛙',
  'Doshaguma': '闢獸', 'Rey Dau': '煌雷龍', 'Lala Barina': '刺花蜘蛛', 'Rompopolo': '泥波龍',
  'Quematrice': '炎鳥', 'Uth Duna': '波衣龍', 'Espinas': '棘龍', 'Kulve Taroth': '絢輝龍',
  'Behemoth': '貝希摩斯', 'Yama Tsukami': '浮岳龍', 'Primordial Malzeno': '原初爵銀龍',
  'Ancient Leshen': '古代鹿首精', 'Leshen': '鹿首精', 'Felyne': '艾路貓', 'Melynx': '梅拉露',
  'Gobul': '燈魚龍', 'Ash Kecha Wacha': '白猿狐', 'Aurora Somnacanth': '冰人魚龍',
  'Barnos': '翼蛇龍', 'Blango': '雪獅子', 'Bnahabra': '飛甲蟲', 'Boaboa': '獸纏族',
  'Bombadgy': '狸獸', 'Cephalos': '沙龍', 'Conga': '桃毛獸', 'Cortos': '翼鳴龍',
  'Epioth': '水生獸', 'Fish': '魚類', 'Gajalaka': '奇面族', 'Gajios': '咬魚',
  'Gastodon': '突擊龍', 'Giadrome': '白速龍王', 'Giaprey': '白速龍', 'Giggi': '毒怪龍幼體',
  'Girros': '凶顎龍', 'Great Dracophage Bug': '大蝕龍蟲', 'Great Thunderbug': '大雷光蟲',
  'Grimalkyne': '德特爾', 'Hornetaur': '巨甲蟲', 'Hypnocatrice': '眠鳥', 'Izuchi': '鐮鼬龍',
  'Jagras': '凶豺龍', 'Kestodon': '冠突龍', 'King Shakalaka': '奇面王', 'Konchu': '盾蟲',
  'Larinoth': '首鳴龍', 'Ludroth': '水獸', 'Mernos': '翼龍', 'Moofah': '雲羊鹿',
  'Mosswine': '苔蘚豬', 'Nerscylla Hatchling': '影蜘蛛幼體', 'Noios': '響翼龍',
  'Oltura': '傲途娜', 'Rachnoid': '臣蜘蛛', 'Raphinos': '貓頭翼龍', 'Remobra': '蛇龍',
  'Shakalaka': '奇面族', 'Shamos': '突眼龍', 'Vespoid': '巨蜂', 'Vespoid Queen': '女王蟲',
  'Wulg': '冰豺狼', 'Guardian Arkveld': '守護者鎖刃龍', 'Guardian Doshaguma': '守護者闢獸',
  'Guardian Ebony Odogaron': '守護者凶爪龍', 'Guardian Fulgur Anjanath': '守護者雷顎龍',
  'Guardian Rathalos': '守護者雄火龍', 'Guardian Seikret': '守護者鷺鷹龍'
};

function translate(text) {
  return new Promise((resolve) => {
    if (!text) return resolve('');
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-TW&dt=t&q=${encodeURIComponent(text)}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          let translatedText = '';
          if (parsed[0]) {
            parsed[0].forEach(item => {
              if (item[0]) translatedText += item[0];
            });
          }
          resolve(translatedText || text);
        } catch (e) {
          resolve(text);
        }
      });
    }).on('error', () => resolve(text));
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run() {
  console.log('Starting remaining translations...');
  const filePath = 'C:/Users/gc/Desktop/MonsterHunter_2026/public/game_jsons/base_monsters.json';
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  let translatedCount = 0;
  for (let i = 0; i < data.monsters.length; i++) {
    const monster = data.monsters[i];
    
    // Only process if name contains english characters
    if (monster.name && /[A-Za-z]/.test(monster.name)) {
      if (namesDict[monster.name]) {
        monster.name = namesDict[monster.name];
        translatedCount++;
      } else {
        const t = await translate(monster.name);
        monster.name = t;
        translatedCount++;
        await sleep(150); // delay to prevent IP block
      }
    }
  }
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Translation complete! Fixed ${translatedCount} names.`);
}

run();
