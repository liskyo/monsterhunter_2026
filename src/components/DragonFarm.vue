<template>
  <div class="farm-container">
    <div class="farm-bg">
      <img src="/game_images/DragonFarm.png" alt="牧場背景" class="bg-img" />
      <div class="overlay"></div>
    </div>
    
    <header class="top-nav">
      <button class="back-btn" @click="$emit('back')">
        <span class="btn-icon">↩</span>
        <span class="btn-text">返回村莊</span>
      </button>
      <div class="title-wrap">
        <h2 class="title">龍之牧場</h2>
        <div class="title-underline"></div>
      </div>
      <div class="currency">
        <span class="coin-glow">🪙</span>
        <span class="coin-amount">{{ coins.toLocaleString() }}</span>
      </div>
    </header>

    <!-- 當牧場是空的時候顯示 -->
    <div v-if="dragons.length === 0 && !isLoading" class="empty-farm">
      <div class="empty-msg-box">
        <div class="empty-icon">🏜️</div>
        <h3>牧場目前空無一龍</h3>
        <p>前往「孵化室」孵化你的第一隻魔物吧！</p>
        <button class="refresh-btn" @click="fetchDragons">🔄 重新整理資料</button>
      </div>
    </div>

    <div class="dragons-area">
      <div 
        v-for="dragon in dragons" 
        :key="dragon.id"
        class="dragon-wrapper"
        :style="{ left: dragon.x + '%', top: dragon.y + '%' }"
        @click="selectDragon(dragon)"
      >
        <div class="dragon" :class="[dragon.element, { walking: dragon.isWalking, breathing: dragon.isBreathing, flying: dragon.isFlying }]" :style="{ width: `${90 * Math.min(2, 1 + (dragon.level - 1) * 0.1)}px`, height: `${90 * Math.min(2, 1 + (dragon.level - 1) * 0.1)}px` }">
          <div class="dragon-flip-wrapper" :style="{ transform: `scaleX(${dragon.direction || 1})` }">
            <!-- 真實龍的圖片 -->
            <img v-if="dragon.image" :src="dragon.image" class="real-dragon-img" alt="Dragon" />
            <div v-else class="real-dragon-img placeholder-dragon">🐲</div>
            
            <!-- 吐息特效 (保留) -->
            <div v-if="dragon.isBreathing" class="breath" :class="dragon.element"></div>
          </div>
        </div>
        <div class="dragon-shadow" :style="{ transform: `scaleX(${Math.min(2, 1 + (dragon.level - 1) * 0.1)})` }"></div>
        <!-- 名字標籤 -->
        <div class="dragon-label">Lv.{{ dragon.level }} {{ dragon.name }}</div>
      </div>
    </div>

    <!-- 底部操作面板 -->
    <transition name="slide-up">
      <div v-if="selectedDragon" class="action-panel">
        <div class="panel-header">
          <div class="panel-title-group">
            <span class="element-icon">{{ selectedDragon.element === 'fire' ? '🔥' : '💧' }}</span>
            <h3>{{ selectedDragon.name }} <span class="lv-badge">Lv.{{ selectedDragon.level }}</span></h3>
          </div>
          <button class="close-btn" @click="selectedDragon = null">✕</button>
        </div>
        
        <div class="stats-section">
          <div class="exp-text">EXP: {{ selectedDragon.exp }} / {{ selectedDragon.maxExp }}</div>
          <div class="progress-bg">
            <div class="progress-fill" :class="selectedDragon.element" :style="{ width: (selectedDragon.exp / selectedDragon.maxExp * 100) + '%' }"></div>
          </div>
        </div>

        <div class="action-buttons">
          <button class="action-btn feed-btn" @click="feedDragon">
            <span class="btn-icon">🥩</span>
            <div class="btn-info">
              <span class="btn-name">餵食</span>
              <span class="btn-desc">+10 EXP</span>
            </div>
            <div class="cost">🪙 50</div>
          </button>
          
          <button class="action-btn skill-btn" @click="learnSkill">
            <span class="btn-icon">✨</span>
            <div class="btn-info">
              <span class="btn-name">學習技能</span>
              <span class="btn-desc">解鎖新招式</span>
            </div>
            <div class="cost">🪙 200</div>
          </button>
          
          <button class="action-btn interact-btn" @click="triggerBreath">
            <span class="btn-icon">⚔️</span>
            <div class="btn-info">
              <span class="btn-name">展現力量</span>
              <span class="btn-desc">觀看動畫</span>
            </div>
          </button>
          
          <button class="action-btn recall-btn" @click="recallDragon">
            <span class="btn-icon">🎒</span>
            <div class="btn-info">
              <span class="btn-name">收回背包</span>
              <span class="btn-desc">返回清單</span>
            </div>
          </button>
        </div>
        
        <div class="skills-list" v-if="selectedDragon.skills.length > 0">
          <h4>已學會技能</h4>
          <div class="skill-tags">
            <span v-for="(skill, idx) in selectedDragon.skills" :key="idx" class="skill-tag" :class="selectedDragon.element">
              {{ skill }}
            </span>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { supabase } from '../supabase';

const emit = defineEmits(['back']);
const coins = ref(2500);

// 從資料庫讀取的龍
const dragons = ref([]);
const isLoading = ref(true);

const selectedDragon = ref(null);
let moveInterval = null;

const fetchDragons = async () => {
  try {
    isLoading.value = true;
    const { data, error } = await supabase.from('dragons').select('*');
    if (error) throw error;
    if (data) {
      // 升級相容性：如果從未設定過牧場清單，預設把所有已有的魔物放入牧場
      let farmIdsStr = localStorage.getItem('farm_dragon_ids');
      if (farmIdsStr === null) {
        const allIds = data.map(d => d.id);
        localStorage.setItem('farm_dragon_ids', JSON.stringify(allIds));
        farmIdsStr = JSON.stringify(allIds);
      }
      
      const farmIds = JSON.parse(farmIdsStr);
      const farmData = data.filter(d => farmIds.includes(d.id));
      
      dragons.value = farmData.map(d => ({
        ...d,
        x: Math.max(15, Math.min(85, 20 + Math.random() * 60)),
        y: Math.max(45, Math.min(85, 40 + Math.random() * 40)),
        isWalking: false,
        isBreathing: false,
        isFlying: false,
        direction: 1 // 1 面向左 (預設), -1 面向右
      }));
    }
  } catch (err) {
    console.error('獲取龍資料失敗:', err);
    // 如果資料庫連不上，可以放幾隻測試用的龍
    // dragons.value = [{ id: 'test', name: '測試火龍', element: 'fire', level: 1, exp: 0, maxExp: 100, skills: [], x: 50, y: 60 }];
  } finally {
    isLoading.value = false;
  }
};

const selectDragon = (dragon) => {
  selectedDragon.value = dragon;
};

// 收回背包邏輯
const recallDragon = () => {
  if (!selectedDragon.value) return;
  const id = selectedDragon.value.id;
  let ids = JSON.parse(localStorage.getItem('farm_dragon_ids') || '[]');
  ids = ids.filter(i => i !== id);
  localStorage.setItem('farm_dragon_ids', JSON.stringify(ids));
  
  // 更新畫面
  dragons.value = dragons.value.filter(d => d.id !== id);
  alert(`${selectedDragon.value.name} 已收回背包！`);
  selectedDragon.value = null;
};

const feedDragon = async () => {
  if (!selectedDragon.value) return;
  if (coins.value >= 50) {
    coins.value -= 50;
    selectedDragon.value.exp += 20;
    
    // 升級邏輯
    if (selectedDragon.value.exp >= selectedDragon.value.maxExp) {
      selectedDragon.value.level++;
      selectedDragon.value.exp -= selectedDragon.value.maxExp;
      selectedDragon.value.maxExp = Math.floor(selectedDragon.value.maxExp * 1.5);
      triggerBreath();
    }
    
    // 同步到 Supabase
    if (selectedDragon.value.id) {
      await supabase.from('dragons').update({
        exp: selectedDragon.value.exp,
        level: selectedDragon.value.level,
        maxExp: selectedDragon.value.maxExp
      }).eq('id', selectedDragon.value.id);
    }
  } else {
    alert('金幣不足！');
  }
};

const learnSkill = async () => {
  if (!selectedDragon.value) return;
  if (coins.value >= 200) {
    const newSkill = selectedDragon.value.element === 'fire' ? '爆裂炎息' : '海嘯水砲';
    if (!selectedDragon.value.skills.includes(newSkill)) {
      coins.value -= 200;
      selectedDragon.value.skills.push(newSkill);
      triggerBreath();
      
      // 同步到 Supabase
      if (selectedDragon.value.id) {
        await supabase.from('dragons').update({
          skills: selectedDragon.value.skills
        }).eq('id', selectedDragon.value.id);
      }
    } else {
      alert(`${selectedDragon.value.name} 已經學會所有基礎技能了!`);
    }
  } else {
    alert('金幣不足！');
  }
};

const triggerBreath = () => {
  if (selectedDragon.value && !selectedDragon.value.isBreathing) {
    const target = selectedDragon.value;
    target.isWalking = false; // 停止移動
    target.isBreathing = true;
    
    // 關閉面板讓玩家觀賞動畫
    selectedDragon.value = null;
    
    setTimeout(() => {
      target.isBreathing = false;
    }, 2000);
  }
};

// 隨機動作邏輯
const randomWalk = () => {
  dragons.value.forEach(dragon => {
    if (dragon.isBreathing || dragon.isFlying) return;
    
    const rand = Math.random();
    if (rand > 0.85) {
      // 15% 機率展翅飛舞
      dragon.isFlying = true;
      setTimeout(() => {
        dragon.isFlying = false;
      }, 2500);
    } else if (rand > 0.5) {
      // 35% 機率移動
      dragon.isWalking = true;
      // 限制活動範圍
      const newX = Math.max(15, Math.min(85, dragon.x + (Math.random() * 30 - 15)));
      const newY = Math.max(45, Math.min(85, dragon.y + (Math.random() * 20 - 10)));
      
      // 判斷方向 (如果向右走，則翻轉)
      dragon.direction = newX > dragon.x ? -1 : 1;
      
      dragon.x = newX;
      dragon.y = newY;
      
      setTimeout(() => {
        dragon.isWalking = false;
      }, 2500); // 配合 CSS transition
    }
  });
};

onMounted(() => {
  fetchDragons();
  moveInterval = setInterval(randomWalk, 3500);
});

onUnmounted(() => {
  if (moveInterval) clearInterval(moveInterval);
});
</script>

<style scoped>
.farm-container {
  width: 100%; height: 100%; position: relative; overflow: hidden;
  background: #000; font-family: 'Montserrat', sans-serif;
  color: white;
}

/* 背景設計 */
.farm-bg { position: absolute; inset: 0; z-index: 0; }
.bg-img { width: 100%; height: 100%; object-fit: cover; }
.overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 40%, rgba(0,0,0,0.4) 100%); }

/* 導航列 */
.top-nav {
  position: relative; z-index: 100; padding: 60px 20px 20px;
  display: flex; justify-content: space-between; align-items: center;
  background: linear-gradient(to bottom, rgba(0,0,0,0.9), rgba(0,0,0,0.5) 70%, transparent);
}
.back-btn { 
  background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); 
  color: white; padding: 8px 15px; border-radius: 50px; 
  font-weight: bold; backdrop-filter: blur(10px); cursor: pointer;
  display: flex; align-items: center; gap: 5px;
  transition: all 0.3s;
}
.back-btn:hover { background: rgba(255,255,255,0.2); transform: translateX(-3px); }

.title-wrap { display: flex; flex-direction: column; align-items: center; max-width: 50%; }
.title { 
  margin: 0; font-size: 1.4rem; font-weight: 900; 
  white-space: nowrap;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 3px;
  background: linear-gradient(to bottom, #ffffff 30%, #a0a0a0 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 4px 4px rgba(0,0,0,0.8)) drop-shadow(0 0 10px rgba(255,255,255,0.2));
  font-family: 'Cinzel', serif;
}
.title-underline { width: 40px; height: 3px; background: #ffd700; margin-top: 5px; border-radius: 2px; box-shadow: 0 0 10px #ffd700; }

.currency { 
  background: rgba(0,0,0,0.7); padding: 8px 16px; border-radius: 50px; 
  font-weight: 900; border: 2px solid #ffd700; color: #ffd700;
  display: flex; align-items: center; gap: 8px;
  box-shadow: 0 0 20px rgba(255,215,0,0.2), inset 0 0 10px rgba(255,215,0,0.1);
  font-size: 1.1rem;
}
.coin-glow { filter: drop-shadow(0 0 5px #ffd700); }

/* 牧場互動區 */
.dragons-area { position: absolute; top: 30%; bottom: 0; left: 0; right: 0; z-index: 5; }

.dragon-wrapper {
  position: absolute; transform: translate(-50%, -50%);
  transition: left 2.5s ease-in-out, top 2.5s ease-in-out;
  cursor: pointer; display: flex; flex-direction: column; align-items: center;
}

.dragon-label {
  margin-top: 2px; background: rgba(0,0,0,0.85); padding: 3px 8px; border-radius: 50px;
  font-size: 0.6rem; font-weight: 800; white-space: nowrap; 
  border: 1px solid #ffd700; color: #fff;
  box-shadow: 0 4px 10px rgba(0,0,0,0.5);
  transition: all 0.3s; opacity: 0.9;
  letter-spacing: 0.5px;
}
.dragon-wrapper:hover .dragon-label { opacity: 1; transform: scale(1.1); }

/* 龍的本體 (圖片替換與 3D 強化) */
.dragon { position: relative; transition: width 0.3s, height 0.3s, transform 0.3s; display: flex; align-items: center; justify-content: center; }
.dragon:hover { transform: scale(1.15); }
.dragon-flip-wrapper { width: 100%; height: 100%; position: relative; transition: transform 0.4s ease-in-out; display: flex; align-items: center; justify-content: center; }
.real-dragon-img { 
  width: 100%; height: 100%; object-fit: contain; 
  animation: idleFloat 3s infinite ease-in-out;
  filter: drop-shadow(0 15px 15px rgba(0,0,0,0.85)) drop-shadow(0 5px 5px rgba(0,0,0,0.5)) brightness(1.1) contrast(1.05); 
}
.placeholder-dragon { font-size: 3rem; display: flex; align-items: center; justify-content: center; }

/* 動作狀態 */
.walking .real-dragon-img { animation: walkBounce 0.5s infinite alternate ease-in-out; }
.breathing .real-dragon-img { animation: breatheScale 2s; }
.flying .real-dragon-img { animation: flyHover 0.4s infinite alternate ease-in-out; }

/* 吐息動畫 */
.breath { position: absolute; top: 10px; left: -50px; width: 60px; height: 15px; border-radius: 20px; opacity: 0; animation: breathShoot 2s ease-out; transform-origin: right center; z-index: 10; pointer-events: none; background: linear-gradient(90deg, transparent, #ccc, #fff); filter: drop-shadow(0 0 5px #fff); }
.breath.fire { background: linear-gradient(90deg, transparent, #ffeb3b, #ff5722); filter: drop-shadow(0 0 8px #ff5722); }
.breath.water { background: linear-gradient(90deg, transparent, #81d4fa, #0288d1); filter: drop-shadow(0 0 8px #0288d1); }

/* 影子 */
.dragon-shadow { 
  width: 60px; height: 15px; background: rgba(0,0,0,0.7); 
  border-radius: 50%; filter: blur(4px); margin-top: -10px; z-index: -1; 
}

/* 底部操作面板 (玻璃擬態) */
.action-panel {
  position: absolute; bottom: 0; left: 0; right: 0; z-index: 20;
  background: rgba(20, 20, 25, 0.85); backdrop-filter: blur(15px); border-top: 1px solid rgba(255,255,255,0.1);
  border-radius: 30px 30px 0 0; padding: 25px 20px 40px; box-shadow: 0 -10px 30px rgba(0,0,0,0.5);
}

.panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.panel-title-group { display: flex; align-items: center; gap: 10px; }
.element-icon { font-size: 1.5rem; background: rgba(255,255,255,0.1); padding: 5px; border-radius: 50%; }
.panel-title-group h3 { margin: 0; font-size: 1.3rem; font-weight: 800; display: flex; align-items: center; gap: 10px; }
.lv-badge { font-size: 0.8rem; background: #ffd700; color: #000; padding: 2px 8px; border-radius: 10px; }
.close-btn { background: rgba(255,255,255,0.1); border: none; color: white; width: 32px; height: 32px; border-radius: 50%; font-size: 1.1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.3s; }
.close-btn:hover { background: rgba(255, 71, 71, 0.5); }

/* 經驗條 */
.stats-section { margin-bottom: 20px; }
.exp-text { font-size: 0.85rem; font-weight: bold; margin-bottom: 5px; color: #ccc; text-align: right; }
.progress-bg { height: 10px; background: rgba(255,255,255,0.1); border-radius: 5px; overflow: hidden; box-shadow: inset 0 2px 4px rgba(0,0,0,0.5); }
.progress-fill { height: 100%; border-radius: 5px; transition: width 0.5s ease-out; }
.progress-fill.fire { background: linear-gradient(90deg, #ff9800, #f44336); box-shadow: 0 0 10px #f44336; }
.progress-fill.water { background: linear-gradient(90deg, #00bcd4, #2196f3); box-shadow: 0 0 10px #2196f3; }

/* 操作按鈕網格 */
.action-buttons { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
.action-btn { 
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 15px; 
  padding: 12px; display: flex; align-items: center; gap: 10px; color: white; cursor: pointer; transition: all 0.2s; 
}
.interact-btn { background: rgba(255,255,255,0.1); }
.recall-btn { background: rgba(255,255,255,0.1); }
.action-btn:active { transform: scale(0.95); background: rgba(255,255,255,0.2); }
.btn-icon { font-size: 1.8rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5)); }
.btn-info { display: flex; flex-direction: column; align-items: flex-start; flex: 1; }
.btn-name { font-weight: bold; font-size: 0.95rem; }
.btn-desc { font-size: 0.7rem; color: #aaa; }
.cost { font-size: 0.8rem; font-weight: bold; background: rgba(0,0,0,0.5); padding: 3px 8px; border-radius: 10px; color: #ffd700; }

/* 技能列表 */
.skills-list h4 { margin: 0 0 10px 0; font-size: 0.9rem; color: #ddd; }
.skill-tags { display: flex; flex-wrap: wrap; gap: 8px; }
.skill-tag { padding: 5px 12px; border-radius: 15px; font-size: 0.8rem; font-weight: bold; text-shadow: 0 1px 2px rgba(0,0,0,0.8); }
.skill-tag.fire { background: rgba(244, 67, 54, 0.3); border: 1px solid #f44336; color: #ffc107; }
.skill-tag.water { background: rgba(33, 150, 243, 0.3); border: 1px solid #2196f3; color: #e1f5fe; }

/* 動畫設定 */
@keyframes idleFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
@keyframes walkBounce { 0% { transform: translateY(0) rotate(0); } 100% { transform: translateY(-10px) rotate(5deg); } }
@keyframes breatheScale { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15) rotate(-5deg); } }
@keyframes flyHover {
  0% { transform: translateY(-40px) scaleY(1.05); filter: drop-shadow(0 40px 15px rgba(0,0,0,0.4)) brightness(1.1); }
  100% { transform: translateY(-30px) scaleY(0.95); filter: drop-shadow(0 30px 10px rgba(0,0,0,0.6)) brightness(1.1); }
}
@keyframes breathShoot { 
  0% { opacity: 0; transform: scaleX(0); } 
  20% { opacity: 1; transform: scaleX(1); } 
  80% { opacity: 1; transform: scaleX(1); } 
  100% { opacity: 0; transform: scaleX(1.2); } 
}

/* 空牧場樣式 */
.empty-farm {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 10;
}
.empty-msg-box {
  background: rgba(0,0,0,0.6); backdrop-filter: blur(10px);
  padding: 40px; border-radius: 30px; border: 1px solid rgba(255,255,255,0.1);
  text-align: center; max-width: 80%;
  animation: fadeIn 0.5s ease-out;
}
.empty-icon { font-size: 4rem; margin-bottom: 20px; filter: grayscale(0.5); }
.empty-msg-box h3 { margin: 0 0 10px 0; font-size: 1.5rem; color: #fff; }
.empty-msg-box p { color: #aaa; margin-bottom: 25px; }
.refresh-btn {
  background: #ffd700; color: #000; border: none; padding: 12px 24px; border-radius: 50px;
  font-weight: 800; cursor: pointer; transition: all 0.2s;
}
.refresh-btn:hover { transform: scale(1.05); box-shadow: 0 0 20px rgba(255,215,0,0.4); }

@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

/* 面板滑出動畫 */
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.slide-up-enter-from, .slide-up-leave-to { opacity: 0; transform: translateY(100%); }
</style>
