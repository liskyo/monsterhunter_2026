<template>
  <div class="village-container">
    <div class="village-bg">
      <img src="/game_images/village_bg.png" alt="村莊背景" class="bg-img" />
      <div class="overlay"></div>
    </div>

    <header class="top-nav">
      <div class="user-info">
        <div class="avatar">🐲</div>
        <div>
          <p class="name">羅啟銘 獵人</p>
          <p class="rank">HR 99</p>
        </div>
      </div>
      <div class="currency-group">
        <div class="chip">🪙 2,500</div>
        <div class="chip">💎 100</div>
      </div>
    </header>

    <main class="village-main">
      <div v-if="companion" class="companion-area">
        <div class="alert-bubble companion-speech">💬 {{ companion.name }} 看起來精神很好！</div>
        <div class="companion-wrapper" :class="[companion.element, { walking: companion.isWalking, breathing: companion.isBreathing }]">
          <div class="companion-flip" :style="{ transform: `scaleX(${companion.direction || 1})` }">
            <img :src="companion.image" class="companion-img" @click="showCompanionSelect = true" />
            <div v-if="companion.isBreathing" class="breath" :class="companion.element"></div>
          </div>
        </div>
        <div class="companion-label">
          <span class="lv">Lv.{{ companion.level }}</span> <span class="name-text">{{ companion.name }}</span>
          <button class="change-btn" @click.stop="showCompanionSelect = true">🔁 更換</button>
        </div>
      </div>
      <div v-else class="alert-bubble">💬 老村長：去孵化室取得你的第一隻魔物吧！</div>
      
      <!-- 更換隨行獸選單 -->
      <transition name="fade">
        <div v-if="showCompanionSelect" class="modal-overlay" @click="showCompanionSelect = false">
          <div class="modal-content" @click.stop>
            <h3>選擇隨行獸</h3>
            <div class="dragon-list">
              <div 
                v-for="d in myDragons" 
                :key="d.id" 
                class="dragon-option" 
                :class="{ active: companion && d.id === companion.id }"
                @click="selectCompanion(d)"
              >
                <img :src="d.image" class="option-img" />
                <span>Lv.{{ d.level }} {{ d.name }}</span>
              </div>
            </div>
            <button class="close-modal" @click="showCompanionSelect = false">關閉</button>
          </div>
        </div>
      </transition>
    </main>

    <footer class="bottom-menu">
      <div class="menu-grid">
        <button class="menu-item" @click="$emit('to-hatchery')">
          <div class="icon">🥚</div>
          <span>孵化室</span>
        </button>
        <button class="menu-item" @click="$emit('to-farm')">
          <div class="icon">🏞️</div>
          <span>龍之牧場</span>
        </button>
        <button class="menu-item active">
          <div class="icon">🏠</div>
          <span>村基地</span>
        </button>
        <button class="menu-item" @click="$emit('to-pokedex')">
          <div class="icon">📖</div>
          <span>圖鑑</span>
        </button>
        <button class="menu-item" @click="$emit('to-inventory')">
          <div class="icon">🎒</div>
          <span>背包</span>
        </button>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { supabase } from '../supabase';

const emit = defineEmits(['to-hatchery', 'to-farm', 'to-inventory', 'to-pokedex']);

const myDragons = ref([]);
const companion = ref(null);
const showCompanionSelect = ref(false);

const fetchDragons = async () => {
  try {
    const { data, error } = await supabase.from('dragons').select('*').order('created_at', { ascending: true });
    if (error) throw error;
    if (data && data.length > 0) {
      myDragons.value = data;
      // 讀取上次選擇的隨行獸，沒有的話預設第一隻
      const savedId = localStorage.getItem('companionDragonId');
      let selected = data[0];
      if (savedId) {
        selected = data.find(d => d.id === savedId) || data[0];
      }
      companion.value = { ...selected, isWalking: false, isBreathing: false, direction: 1 };
    }
  } catch (err) {
    console.error('獲取隨行獸資料失敗:', err);
  }
};

const selectCompanion = (dragon) => {
  companion.value = { ...dragon, isWalking: false, isBreathing: false, direction: 1 };
  localStorage.setItem('companionDragonId', dragon.id);
  showCompanionSelect.value = false;
};

let actionInterval = null;

const randomAction = () => {
  if (!companion.value || companion.value.isBreathing) return;
  
  const rand = Math.random();
  if (rand > 0.8) {
    // 20% 機率吐息
    companion.value.isBreathing = true;
    setTimeout(() => {
      if (companion.value) companion.value.isBreathing = false;
    }, 2000);
  } else if (rand > 0.4) {
    // 40% 機率原地跳動並隨機轉向
    companion.value.isWalking = true;
    companion.value.direction = Math.random() > 0.5 ? 1 : -1;
    setTimeout(() => {
      if (companion.value) companion.value.isWalking = false;
    }, 1000);
  }
};

onMounted(() => {
  fetchDragons();
  actionInterval = setInterval(randomAction, 3500);
});

onUnmounted(() => {
  if (actionInterval) clearInterval(actionInterval);
});
</script>

<style scoped>
.village-container {
  width: 100%; height: 100%;
  position: relative; overflow: hidden;
  display: flex; flex-direction: column;
  background: #000;
  font-family: 'Montserrat', sans-serif;
}

/* 背景處理 */
.village-bg { position: absolute; inset: 0; z-index: 0; }
.bg-img { width: 100%; height: 100%; object-fit: cover; }
.overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 40%, rgba(0,0,0,0.4) 100%); }

/* 頂部狀態欄 */
.top-nav {
  position: relative; z-index: 10;
  padding: 60px 20px 20px; /* 預留動態島空間 */
  display: flex; justify-content: space-between; align-items: flex-start;
}
.user-info { display: flex; align-items: center; gap: 10px; color: white; }
.avatar { 
  width: 48px; 
  height: 48px; 
  background: rgba(0, 0, 0, 0.4); 
  border-radius: 50%; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  font-size: 1.6rem; 
  border: 2px solid #eab308; 
  box-shadow: 0 0 10px rgba(234, 179, 8, 0.5);
  animation: float 4s ease-in-out infinite;
}
.name { font-weight: 800; font-size: 0.95rem; margin: 0; letter-spacing: 0.5px; text-shadow: 1px 1px 2px #000; }
.rank { font-size: 0.75rem; color: #fbbf24; margin: 0; font-weight: 700; text-shadow: 1px 1px 2px #000; }
.currency-group { display: flex; flex-direction: column; gap: 6px; }
.chip { 
  background: rgba(0,0,0,0.65); 
  padding: 5px 14px; 
  border-radius: 20px; 
  color: white; 
  font-size: 0.85rem; 
  font-weight: 700; 
  border: 1px solid rgba(255,255,255,0.15);
  box-shadow: 0 2px 8px rgba(0,0,0,0.5);
  backdrop-filter: blur(5px);
  transition: transform 0.2s;
}
.chip:hover { transform: scale(1.05); }

/* 中間提示與隨行獸 */
.village-main { flex: 1; position: relative; z-index: 5; display: flex; flex-direction: column; align-items: center; justify-content: center; padding-bottom: 20px; }
.alert-bubble { background: rgba(255,255,255,0.9); color: #333; padding: 10px 20px; border-radius: 20px 20px 20px 0; font-size: 0.85rem; font-weight: bold; box-shadow: 0 4px 15px rgba(0,0,0,0.3); animation: bounce 3s infinite; margin-bottom: 15px; }

.companion-area { display: flex; flex-direction: column; align-items: center; }
.companion-speech { animation: float-bubble 4s infinite ease-in-out; border-radius: 20px 20px 0 20px; }

.companion-wrapper { position: relative; display: flex; align-items: center; justify-content: center; }
.companion-flip { position: relative; transition: transform 0.4s ease-in-out; display: flex; align-items: center; justify-content: center; }

.companion-img {
  width: 180px; height: 180px; object-fit: contain;
  filter: drop-shadow(0 15px 15px rgba(0,0,0,0.8));
  animation: float-dragon 3s infinite ease-in-out;
  cursor: pointer;
}
.companion-img:hover { transform: scale(1.1); }

/* 動作狀態 */
.walking .companion-img { animation: walkBounce 0.5s infinite alternate ease-in-out; }
.breathing .companion-img { animation: breatheScale 2s; }

/* 吐息動畫 */
.breath { position: absolute; top: 40px; left: -90px; width: 120px; height: 25px; border-radius: 20px; opacity: 0; animation: breathShoot 2s ease-out; transform-origin: right center; z-index: 10; pointer-events: none; }
.breath.fire { background: linear-gradient(90deg, transparent, #ffeb3b, #ff5722); filter: drop-shadow(0 0 8px #ff5722); }
.breath.water { background: linear-gradient(90deg, transparent, #81d4fa, #0288d1); filter: drop-shadow(0 0 8px #0288d1); }

.companion-label {
  margin-top: -10px; background: rgba(0,0,0,0.8); padding: 6px 16px; border-radius: 30px;
  border: 1px solid rgba(255, 215, 0, 0.5); color: white; font-weight: bold; font-size: 0.85rem;
  display: flex; align-items: center; gap: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.5);
  z-index: 10;
}
.companion-label .lv { color: #ffd700; }
.companion-label .name-text { letter-spacing: 1px; }
.change-btn {
  background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); color: white;
  padding: 4px 10px; border-radius: 12px; font-size: 0.7rem; font-weight: bold; cursor: pointer;
  transition: background 0.2s; margin-left: 5px;
}
.change-btn:hover { background: rgba(255,255,255,0.3); }

/* Modal 選單 */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center; z-index: 100;
}
.modal-content {
  background: linear-gradient(135deg, rgba(30,30,35,0.95), rgba(15,15,20,0.95));
  width: 85%; max-height: 70vh; border-radius: 25px; padding: 25px 20px;
  border: 1px solid rgba(255,215,0,0.3); display: flex; flex-direction: column;
  box-shadow: 0 20px 50px rgba(0,0,0,0.8);
}
.modal-content h3 { color: #ffd700; margin: 0 0 15px 0; text-align: center; font-family: 'Cinzel', serif; letter-spacing: 2px; }
.dragon-list {
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
  overflow-y: auto; padding-right: 5px; max-height: 50vh;
}
.dragon-option {
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
  border-radius: 15px; padding: 15px 10px; display: flex; flex-direction: column; align-items: center;
  cursor: pointer; transition: all 0.2s;
}
.dragon-option.active {
  border-color: #ffd700; background: rgba(255, 215, 0, 0.15);
  box-shadow: inset 0 0 15px rgba(255,215,0,0.2);
}
.dragon-option:active { transform: scale(0.95); }
.option-img { width: 70px; height: 70px; object-fit: contain; margin-bottom: 8px; filter: drop-shadow(0 5px 5px rgba(0,0,0,0.5)); }
.dragon-option span { color: white; font-size: 0.75rem; font-weight: 800; text-align: center; letter-spacing: 0.5px; }
.close-modal {
  margin-top: 20px; padding: 12px; border-radius: 15px;
  background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2);
  font-weight: bold; cursor: pointer; transition: background 0.2s;
}
.close-modal:hover { background: rgba(255,255,255,0.2); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* 底部選單 */
.bottom-menu {
  position: relative; z-index: 10;
  background: linear-gradient(to top, rgba(10, 10, 10, 0.98), rgba(26, 26, 26, 0.85));
  backdrop-filter: blur(15px);
  padding: 15px 10px 35px; /* 預留底部 Home Indicator 空間 */
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 -5px 20px rgba(0, 0, 0, 0.5);
}
.menu-grid { display: flex; justify-content: space-around; align-items: center; }
.menu-item { background: none; border: none; color: #777; display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: pointer; transition: all 0.3s ease; }
.menu-item .icon { font-size: 1.6rem; transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), filter 0.3s; filter: grayscale(100%); }
.menu-item span { font-size: 0.7rem; font-weight: 700; transition: color 0.3s; }
.menu-item:hover { color: #ccc; }
.menu-item:hover .icon { transform: translateY(-3px) scale(1.1); filter: grayscale(50%); }
.menu-item.active { color: #fbbf24; text-shadow: 0 0 10px rgba(251, 191, 36, 0.5); }
.menu-item.active .icon { transform: translateY(-5px) scale(1.3); filter: grayscale(0%) drop-shadow(0 0 8px rgba(251, 191, 36, 0.6)); animation: float-icon 3s ease-in-out infinite; }

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

@keyframes float-icon {
  0%, 100% { transform: translateY(-5px) scale(1.3); }
  50% { transform: translateY(-8px) scale(1.3); }
}

@keyframes float-dragon {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes float-bubble {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

@keyframes walkBounce { 0% { transform: translateY(0) rotate(0); } 100% { transform: translateY(-15px) rotate(5deg); } }
@keyframes breatheScale { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15) rotate(-5deg); } }
@keyframes breathShoot { 
  0% { opacity: 0; transform: scaleX(0); } 
  20% { opacity: 1; transform: scaleX(1); } 
  80% { opacity: 1; transform: scaleX(1); } 
  100% { opacity: 0; transform: scaleX(1.2); } 
}
</style>