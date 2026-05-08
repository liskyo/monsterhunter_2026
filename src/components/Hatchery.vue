<template>
  <div class="hatchery-page">
    <div class="hatchery-bg">
      <img src="/game_images/hatchery_bg.png" alt="孵化室背景" class="bg-img" @error="handleBgError" />
      <div class="overlay"></div>
    </div>

    <div class="hatchery-content">
      <header class="header">
        <button @click="$emit('back')" class="back-btn">⬅ 回村莊</button>
        <div class="currency-display">
          <span class="coin-icon">🪙</span>
          <span class="amount">{{ gold.toLocaleString() }}</span>
        </div>
      </header>

      <main class="main-area">
        <div v-if="isLoading" class="loading-state">
          <div class="spinner"></div>
          <p>正在讀取古代文獻...</p>
        </div>

        <div v-else-if="!isHatched" class="egg-stage" @click="handleHatchClick">
          <div class="egg-platform">
            <div class="platform-light"></div>
            <img 
              :src="`/game_images/eggs/${currentEggImage}`" 
              class="egg-img" 
              :class="{ 'shake-anim': isShaking }"
            />
          </div>
          <div class="hint-text">
            <p v-if="gold >= 100">點擊龍蛋開始孵化</p>
            <p v-else class="no-gold">金幣不足 (需 100)</p>
            <small>消耗 🪙 100</small>
          </div>
        </div>

        <div v-else class="result-stage">
          <div class="result-card">
            <div class="rarity-glow" :class="monsterRarity"></div>
            <img :src="hatchedMonster.image" class="monster-reveal" @error="handleImageError" />
            
            <div class="info-box">
              <span class="rarity-tag">{{ monsterRarity }}</span>
              <h2 class="monster-name">{{ hatchedMonster.name }}</h2>
              
              <div class="skill-container">
                <div class="skill-header">天賦技能</div>
                <div class="skill-name">{{ hatchedMonster.skill }}</div>
              </div>
            </div>

            <button @click="resetHatchery" class="next-btn">確認並領取</button>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../supabase'
import { monsterZhMap } from '../utils/monsterI18n'

// --- 狀態定義 ---
const gold = ref(2500)
const isShaking = ref(false)
const isHatched = ref(false)
const isLoading = ref(true)
const currentEggImage = ref('Rathalos.svg')
const hatchedMonster = ref(null)

// --- 資料庫 ---
const monsterPool = ref([])
const skillPool = ref([])

// --- 1. 使用 fetch 讀取 JSON 資料庫 ---
const initGameData = async () => {
  try {
    isLoading.value = true
    
    // 同時讀取魔物與技能資料
    const [monsterRes, skillRes] = await Promise.all([
      fetch('https://mhw-db.com/monsters'),
      fetch('/game_jsons/mhnow_skills.json')
    ])

    const mData = await monsterRes.json()
    const sData = await skillRes.json()

    // 處理資料格式 (過濾大型魔物)
    monsterPool.value = Array.isArray(mData) ? mData.filter(m => m.type === 'large') : []
    skillPool.value = Array.isArray(sData) ? sData : Object.values(sData)

    console.log('✅ 資料載入成功:', monsterPool.value.length, '隻魔物')
    isLoading.value = false
  } catch (err) {
    console.error('❌ 資料載入失敗，使用備援資料:', err)
    monsterPool.value = [{ name: 'Rathalos' }, { name: 'Zinogre' }]
    skillPool.value = [{ name: '攻擊力提升' }]
    isLoading.value = false
  }
}

// --- 2. 邏輯處理 ---
const availableEggs = [
  'Anjanath.svg', 'Arzuros.svg', 'Astalos.svg', 'Barioth.svg', 'Barroth.svg', 
  'Basarios.svg', 'Diablos.svg', 'Glavenus.svg', 'Gammoth.svg', 'Khezu.svg',
  'Kulu-Ya-Ku.svg', 'Lagombi.svg', 'Legiana.svg', 'Mizutsune.svg', 'Nargacuga.svg',
  'Paolumu.svg', 'Pukei-Pukei.svg', 'Rajang.svg', 'Rathalos.svg', 'Rathian.svg',
  'Tigrex.svg', 'Zinogre.svg', '_Bird Wyvern.svg', '_Brute Wyvern.svg', 
  '_Fanged Beast.svg', '_Fanged Wyvern.svg', '_Flying Wyvern.svg', '_Leviathan.svg'
]

const rollRandomEgg = () => {
  currentEggImage.value = availableEggs[Math.floor(Math.random() * availableEggs.length)]
}

const handleHatchClick = () => {
  if (isShaking.value || gold.value < 100) return
  
  gold.value -= 100
  isShaking.value = true

  // 1.5 秒孵化動畫
  setTimeout(() => {
    const randomMonster = monsterPool.value[Math.floor(Math.random() * monsterPool.value.length)]
    const randomSkill = skillPool.value[Math.floor(Math.random() * skillPool.value.length)]

    const mName = randomMonster.name || 'Unknown'
    const zhName = monsterZhMap[mName] || mName
    const sName = randomSkill.names?.EN || randomSkill.name || randomSkill.skills?.[0]?.name || '神秘力量'
    
    // 從 API 取得屬性 (若無則隨機)
    const elements = randomMonster.elements && randomMonster.elements.length > 0 ? randomMonster.elements : ['fire', 'water', 'normal']
    const element = typeof elements[0] === 'string' ? elements[0] : elements[Math.floor(Math.random() * elements.length)]

    hatchedMonster.value = {
      name: zhName,
      element: element,
      image: `/game_images/monsters-small/${mName}.webp`,
      skill: sName,
      level: 1,
      exp: 0,
      maxExp: 100
    }

    // 儲存到 Supabase
    saveToSupabase(hatchedMonster.value)

    isShaking.value = false
    isHatched.value = true
  }, 1500)
}

const saveToSupabase = async (dragon) => {
  try {
    const { error } = await supabase.from('dragons').insert([{
      name: dragon.name,
      element: dragon.element,
      level: dragon.level,
      exp: dragon.exp,
      maxExp: dragon.maxExp,
      skills: [dragon.skill]
    }])
    if (error) throw error;
    console.log('成功存入背包/牧場!');
  } catch (err) {
    console.error('儲存龍資料失敗:', err);
  }
}

const resetHatchery = () => {
  isHatched.value = false
  rollRandomEgg()
}

const handleBgError = (e) => {
  e.target.src = 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?auto=format&fit=crop&q=80' // 備用背景
}

const handleImageError = (e) => {
  e.target.src = `/game_images/eggs/${currentEggImage.value}` // 備用魔物圖案 (使用對應的龍蛋)
}

const monsterRarity = computed(() => {
  const rarities = ['SR', 'SSR', 'UR']
  return rarities[Math.floor(Math.random() * rarities.length)]
})

// --- 生命週期 ---
onMounted(() => {
  initGameData()
  rollRandomEgg()
})
</script>

<style scoped>
.hatchery-page {
  width: 100%;
  height: 100%;
  position: relative;
  background: #050505;
  color: white;
  font-family: 'Montserrat', sans-serif;
  overflow: hidden;
}

/* 背景處理 */
.hatchery-bg { position: absolute; inset: 0; z-index: 0; }
.bg-img { width: 100%; height: 100%; object-fit: cover; opacity: 0.7; }
.overlay { 
  position: absolute; inset: 0; 
  background: radial-gradient(circle at center, transparent, rgba(0,0,0,0.9)); 
}

/* UI 佈局 */
.hatchery-content {
  position: relative;
  z-index: 10;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.header {
  padding: 60px 20px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.back-btn {
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255,255,255,0.15);
  color: #ddd;
  padding: 8px 18px;
  border-radius: 20px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}
.back-btn:hover { background: rgba(255,255,255,0.1); color: white; transform: translateY(-2px); }

.currency-display {
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(5px);
  padding: 8px 18px;
  border-radius: 20px;
  border: 1px solid rgba(255, 215, 0, 0.4);
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.15);
}
.amount { color: #ffd700; font-weight: 800; font-size: 1rem; }

/* 主區域 */
.main-area { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; }

/* 龍蛋階段 */
.egg-platform { position: relative; width: 300px; height: 300px; display: flex; align-items: center; justify-content: center; }
.platform-light {
  position: absolute; width: 220px; height: 50px; 
  background: radial-gradient(ellipse at center, rgba(255,255,255,0.3) 0%, transparent 70%);
  bottom: 50px; border-radius: 50%; filter: blur(10px);
  animation: pulse-light 3s ease-in-out infinite;
}
.egg-img { 
  width: 210px; z-index: 5; cursor: pointer; 
  filter: drop-shadow(0 15px 25px rgba(0,0,0,0.8));
  transition: filter 0.3s ease, transform 0.3s ease;
}
.egg-img:hover { filter: drop-shadow(0 15px 25px rgba(255,255,255,0.3)); transform: translateY(-5px); }

.hint-text { text-align: center; margin-top: 30px; animation: float-hint 3s infinite ease-in-out; }
.hint-text p { font-size: 1.3rem; font-weight: 800; margin-bottom: 8px; letter-spacing: 1px; text-shadow: 0 2px 4px rgba(0,0,0,0.8); }
.no-gold { color: #ff4747; text-shadow: 0 0 10px rgba(255, 71, 71, 0.5); }
.hint-text small { color: #bbb; font-weight: 600; font-size: 0.9rem; }

/* 結果卡片 */
.result-card {
  width: 88%;
  max-width: 380px;
  background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02));
  backdrop-filter: blur(25px);
  border-radius: 30px;
  padding: 35px 25px;
  border: 1px solid rgba(255,255,255,0.15);
  box-shadow: 0 20px 50px rgba(0,0,0,0.6), inset 0 0 20px rgba(255,255,255,0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: modalPop 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.rarity-glow {
  position: absolute; inset: 0; border-radius: 30px; opacity: 0.4; z-index: -1;
  transition: box-shadow 0.5s ease;
}
.SR { box-shadow: inset 0 0 60px #c084fc; }
.SSR { box-shadow: inset 0 0 80px #facc15; }
.UR { box-shadow: inset 0 0 100px #ef4444; }

.monster-reveal { width: 250px; filter: drop-shadow(0 15px 25px rgba(0,0,0,0.5)); margin-bottom: 25px; animation: float-monster 4s ease-in-out infinite; }
.info-box { width: 100%; text-align: center; }
.rarity-tag { font-family: 'Cinzel', serif; font-weight: 900; font-size: 1.2rem; text-shadow: 0 0 10px rgba(255,255,255,0.5); }
.monster-name { font-family: 'Cinzel', serif; font-size: 2.2rem; font-weight: 900; margin: 12px 0; letter-spacing: 1px; color: #fff; text-shadow: 0 2px 10px rgba(0,0,0,0.8); }

.skill-container {
  background: linear-gradient(to right, rgba(0,0,0,0.2), rgba(0,0,0,0.4), rgba(0,0,0,0.2));
  padding: 18px;
  border-radius: 20px;
  margin: 20px 0;
  border: 1px solid rgba(255,255,255,0.05);
}
.skill-header { font-size: 0.75rem; color: #aaa; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 2px; }
.skill-name { color: #fbbf24; font-weight: 800; font-size: 1.2rem; text-shadow: 0 0 10px rgba(251, 191, 36, 0.4); }

.next-btn {
  width: 100%; padding: 18px; 
  background: linear-gradient(135deg, #ffffff, #e0e0e0); 
  color: #000;
  border: none; border-radius: 50px; 
  font-weight: 900; font-size: 1.15rem; margin-top: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 5px 15px rgba(255,255,255,0.2);
}
.next-btn:hover { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(255,255,255,0.4); }

/* 動畫 */
/* 動畫 */
.shake-anim { animation: shake 0.12s infinite; filter: brightness(1.2) drop-shadow(0 0 20px rgba(255,255,255,0.6)); }
@keyframes shake {
  0% { transform: translate(0,0) rotate(0); }
  25% { transform: translate(5px, -2px) rotate(3deg); }
  75% { transform: translate(-5px, 2px) rotate(-3deg); }
}

@keyframes modalPop {
  0% { opacity: 0; transform: scale(0.9) translateY(30px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

@keyframes pulse-light {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.1); }
}

@keyframes float-hint {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

@keyframes float-monster {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.spinner {
  width: 45px; height: 45px; border: 4px solid rgba(255,255,255,0.1);
  border-top-color: #fbbf24; border-radius: 50%; animation: spin 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
  margin-bottom: 18px;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>