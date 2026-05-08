<template>
  <div class="inventory-container">
    <div class="inventory-bg">
      <div class="glass-overlay"></div>
    </div>
    
    <header class="top-nav">
      <button class="back-btn" @click="$emit('back')">↩ 返回</button>
      <h2 class="title">獵人背包</h2>
      <div class="capacity">📦 {{ inventoryItems.length }} / 300</div>
    </header>

    <div class="tabs-wrapper">
      <div class="tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          class="tab-btn"
          :class="{ active: currentTab === tab.id }"
          @click="currentTab = tab.id"
        >
          {{ tab.name }}
        </button>
      </div>
    </div>

    <main class="inventory-content">
      <div class="grid-container">
        <div 
          v-for="(item, index) in filteredItems" 
          :key="index"
          class="item-card"
          :class="item.rarity"
          @click="selectItem(item)"
        >
          <div class="rarity-glow"></div>
          <div class="item-icon">
            <img v-if="item.isImage" :src="item.icon" class="mini-monster-img" />
            <span v-else>{{ item.icon || getIconFallback(item.type) }}</span>
          </div>
          <div v-if="item.count && item.count > 1" class="item-count">{{ item.count }}</div>
          <div v-if="item.level" class="item-level">Lv.{{ item.level }}</div>
          <div class="item-name">{{ item.name }}</div>
        </div>
      </div>
      
      <div v-if="filteredItems.length === 0" class="empty-state">
        <div class="empty-icon">🪹</div>
        <p>這個分類空空如也...</p>
      </div>
    </main>

    <!-- 底部詳情面板 -->
    <transition name="slide-up">
      <div v-if="selectedItem" class="detail-panel">
        <div class="panel-header">
          <div class="panel-title-group">
            <div class="detail-icon-wrap" :class="selectedItem.rarity">
              <img v-if="selectedItem.isImage" :src="selectedItem.icon" class="detail-monster-img" />
              <span v-else class="detail-icon">{{ selectedItem.icon || getIconFallback(selectedItem.type) }}</span>
            </div>
            <div>
              <h3 :class="selectedItem.rarity + '-text'">{{ selectedItem.name }}</h3>
              <span class="type-badge">{{ getTypeName(selectedItem.type) }}</span>
            </div>
          </div>
          <button class="close-btn" @click="selectedItem = null">✕</button>
        </div>
        
        <div class="item-stats" v-if="selectedItem.type === 'dragon' || selectedItem.type === 'equipment'">
          <div class="stat" v-if="selectedItem.level"><span>等級:</span> Lv.{{ selectedItem.level }}</div>
          <div class="stat" v-if="selectedItem.element"><span>屬性:</span> {{ selectedItem.element }}</div>
          <div class="stat" v-if="selectedItem.power"><span>攻擊力:</span> +{{ selectedItem.power }}</div>
        </div>

        <p class="item-desc">{{ selectedItem.description || getDefaultDesc(selectedItem.type) }}</p>
        
        <div class="action-buttons">
          <button class="action-btn use-btn" v-if="selectedItem.type === 'item'">
            ✨ 使用道具
          </button>
          <button class="action-btn hatch-btn" v-if="selectedItem.type === 'egg'">
            🥚 前往孵化室
          </button>
          <button class="action-btn equip-btn" v-if="selectedItem.type === 'equipment'">
            ⚔️ 裝備
          </button>
          <button class="action-btn farm-btn" v-if="selectedItem.type === 'dragon'" @click="toggleFarmStatus">
            {{ isDragonInFarm(selectedItem) ? '🎒 收回背包' : '🏞️ 放入牧場' }}
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { supabase } from '../supabase';

const emit = defineEmits(['back']);

const tabs = [
  { id: 'all', name: '全部' },
  { id: 'item', name: '道具' },
  { id: 'dragon', name: '龍' },
  { id: 'egg', name: '龍蛋' },
  { id: 'equipment', name: '裝備' }
];

const currentTab = ref('all');
const selectedItem = ref(null);

// 模擬基礎物品 (未來可改為全從 supabase inventory 表拉取)
const mockInventory = [
  { id: 'i1', name: '回復藥 (大)', type: 'item', rarity: 'common', count: 15, icon: '🧪', description: '能大幅回復生命值的神奇藥水。' },
  { id: 'i2', name: '烤肉組合', type: 'item', rarity: 'common', count: 3, icon: '🍖', description: '上等烤肉，能提升耐力上限。' },
  { id: 'e1', name: '神秘飛龍蛋', type: 'egg', rarity: 'rare', count: 1, icon: '🥚', description: '散發著微熱的龍蛋，不知會孵出什麼魔物？' },
  { id: 'eq1', name: '火龍大劍', type: 'equipment', rarity: 'epic', count: 1, icon: '🗡️', power: 120, description: '使用雄火龍素材打造的大劍，帶有高溫。' },
  { id: 'eq2', name: '迅龍雙刃', type: 'equipment', rarity: 'epic', count: 1, icon: '⚔️', power: 95, description: '極其鋒利，揮動時甚至能斬斷風。' }
];

const inventoryItems = ref([...mockInventory]);

// 從 Supabase 讀取擁有的龍，加進背包清單
const fetchDragons = async () => {
  try {
    const { data, error } = await supabase.from('dragons').select('*');
    if (data) {
      const dragonItems = data.map(d => ({
        id: `d_${d.id}`,
        name: d.name,
        type: 'dragon',
        rarity: d.level > 10 ? 'legendary' : (d.level > 5 ? 'epic' : 'rare'),
        count: 1,
        icon: d.image || '🐲',
        isImage: !!d.image,
        level: d.level,
        element: d.element,
        description: `你培育的魔物。目前擁有 ${d.skills?.length || 0} 個技能。`
      }));
      
      // 合併靜態資料與資料庫的龍
      inventoryItems.value = [...mockInventory, ...dragonItems];
    }
  } catch (err) {
    console.error('背包讀取龍資料失敗:', err);
  }
};

onMounted(() => {
  fetchDragons();
});

const filteredItems = computed(() => {
  if (currentTab.value === 'all') return inventoryItems.value;
  return inventoryItems.value.filter(item => item.type === currentTab.value);
});

const selectItem = (item) => {
  selectedItem.value = item;
};

// 牧場狀態管理
const getFarmDragonIds = () => JSON.parse(localStorage.getItem('farm_dragon_ids') || '[]');
const isDragonInFarm = (item) => {
  if (!item || item.type !== 'dragon') return false;
  const id = item.id.replace('d_', '');
  return getFarmDragonIds().includes(id);
};

const toggleFarmStatus = () => {
  if (!selectedItem.value) return;
  const id = selectedItem.value.id.replace('d_', '');
  let ids = getFarmDragonIds();
  
  if (ids.includes(id)) {
    ids = ids.filter(i => i !== id);
    alert(`${selectedItem.value.name} 已收回背包！`);
  } else {
    ids.push(id);
    alert(`${selectedItem.value.name} 已放入牧場！`);
  }
  
  localStorage.setItem('farm_dragon_ids', JSON.stringify(ids));
  // 觸發 Vue 響應式更新按鈕文字
  selectedItem.value = { ...selectedItem.value };
};

// 輔助函式
const getTypeName = (type) => {
  const map = { item: '道具', dragon: '魔物', egg: '龍蛋', equipment: '裝備' };
  return map[type] || '未知';
};
const getIconFallback = (type) => {
  const map = { item: '🎒', dragon: '🐲', egg: '🥚', equipment: '🛡️' };
  return map[type] || '📦';
};
const getDefaultDesc = (type) => {
  return '這是一個神秘的物品。';
};
</script>

<style scoped>
.inventory-container {
  width: 100%; height: 100%; position: relative; overflow: hidden;
  background: #0a0a0c; font-family: 'Montserrat', sans-serif;
  color: white; display: flex; flex-direction: column;
}

/* 背景設計 */
.inventory-bg { position: absolute; inset: 0; z-index: 0; background: radial-gradient(circle at top right, #2a2a35, #0a0a0c); }
.glass-overlay { position: absolute; inset: 0; background: url('data:image/svg+xml;utf8,<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><filter id="noiseFilter"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23noiseFilter)" opacity="0.05"/></svg>'); opacity: 0.5; }

/* 導航列 */
.top-nav {
  position: relative; z-index: 10; padding: 50px 20px 15px;
  display: flex; justify-content: space-between; align-items: center;
  background: rgba(10, 10, 12, 0.8); backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.back-btn { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 8px 15px; border-radius: 20px; font-weight: bold; cursor: pointer; transition: all 0.2s; }
.back-btn:hover { background: rgba(255,255,255,0.2); }
.title { margin: 0; font-size: 1.2rem; font-weight: 800; letter-spacing: 2px; }
.capacity { background: rgba(0,0,0,0.6); padding: 5px 12px; border-radius: 15px; font-size: 0.85rem; font-weight: bold; color: #aaa; }

/* 分頁導航 */
.tabs-wrapper { position: relative; z-index: 10; padding: 15px 20px 5px; }
.tabs { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 10px; scrollbar-width: none; }
.tabs::-webkit-scrollbar { display: none; }
.tab-btn {
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #888;
  padding: 8px 18px; border-radius: 20px; font-size: 0.9rem; font-weight: bold; cursor: pointer;
  white-space: nowrap; transition: all 0.3s ease;
}
.tab-btn.active { background: #fff; color: #000; box-shadow: 0 0 15px rgba(255,255,255,0.3); }

/* 主要內容 (網格) */
.inventory-content { flex: 1; overflow-y: auto; position: relative; z-index: 5; padding: 15px 20px 100px; }
.grid-container { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }

/* 物品卡片 */
.item-card {
  aspect-ratio: 1; background: rgba(20, 20, 25, 0.8); border-radius: 15px;
  position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center;
  border: 1px solid rgba(255,255,255,0.1); cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;
  overflow: hidden;
}
.item-card:active { transform: scale(0.95); }
.item-icon { font-size: 2rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5)); z-index: 2; }
.item-count { position: absolute; bottom: 5px; right: 8px; font-size: 0.75rem; font-weight: 900; z-index: 2; }
.item-level { position: absolute; top: 5px; left: 6px; font-size: 0.65rem; background: rgba(0,0,0,0.6); padding: 2px 5px; border-radius: 8px; color: #ffd700; z-index: 2; }
.item-name { position: absolute; bottom: -20px; font-size: 0.6rem; white-space: nowrap; opacity: 0; transition: all 0.2s; }
.item-card:hover .item-name { bottom: 5px; opacity: 1; background: rgba(0,0,0,0.8); padding: 2px 6px; border-radius: 10px; z-index: 3; }
.mini-monster-img { width: 80%; height: 80%; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5)); }

/* 稀有度邊框與光暈 */
.rarity-glow { position: absolute; inset: 0; opacity: 0.2; z-index: 1; }
.common { border-color: #a0aec0; } .common .rarity-glow { background: radial-gradient(circle, #a0aec0 0%, transparent 70%); }
.rare { border-color: #4299e1; } .rare .rarity-glow { background: radial-gradient(circle, #4299e1 0%, transparent 70%); }
.epic { border-color: #9f7aea; } .epic .rarity-glow { background: radial-gradient(circle, #9f7aea 0%, transparent 70%); }
.legendary { border-color: #ecc94b; box-shadow: 0 0 10px rgba(236, 201, 75, 0.3); } .legendary .rarity-glow { background: radial-gradient(circle, #ecc94b 0%, transparent 70%); animation: pulse 2s infinite; }

/* 空狀態 */
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 50vh; color: #555; }
.empty-icon { font-size: 3rem; margin-bottom: 10px; opacity: 0.5; }

/* 底部詳情面板 */
.detail-panel {
  position: absolute; bottom: 0; left: 0; right: 0; z-index: 20;
  background: rgba(20, 20, 25, 0.95); backdrop-filter: blur(20px); border-top: 1px solid rgba(255,255,255,0.1);
  border-radius: 30px 30px 0 0; padding: 25px 25px 40px; box-shadow: 0 -10px 40px rgba(0,0,0,0.8);
}
.panel-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.panel-title-group { display: flex; align-items: center; gap: 15px; }
.detail-icon-wrap { width: 60px; height: 60px; background: rgba(0,0,0,0.5); border-radius: 15px; display: flex; align-items: center; justify-content: center; font-size: 2.2rem; border: 1px solid rgba(255,255,255,0.1); }
.detail-icon-wrap.legendary { border-color: #ecc94b; box-shadow: 0 0 15px rgba(236,201,75,0.4); }
.detail-icon-wrap.epic { border-color: #9f7aea; box-shadow: 0 0 15px rgba(159,122,234,0.4); }
.detail-monster-img { width: 90%; height: 90%; object-fit: contain; }
.panel-title-group h3 { margin: 0 0 5px 0; font-size: 1.3rem; font-weight: 800; }
.epic-text { color: #d6bcfa; } .legendary-text { color: #fef08a; text-shadow: 0 0 10px rgba(236,201,75,0.5); }
.type-badge { font-size: 0.75rem; background: rgba(255,255,255,0.1); padding: 3px 8px; border-radius: 10px; color: #aaa; }
.close-btn { background: rgba(255,255,255,0.1); border: none; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.3s; }

.item-stats { display: flex; gap: 15px; margin-bottom: 15px; background: rgba(0,0,0,0.3); padding: 10px 15px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); }
.stat { font-size: 0.85rem; font-weight: bold; color: #fff; } .stat span { color: #888; font-weight: normal; margin-right: 5px; }

.item-desc { font-size: 0.9rem; line-height: 1.5; color: #ccc; margin-bottom: 25px; }

.action-buttons { display: flex; gap: 10px; }
.action-btn { flex: 1; padding: 15px; border: none; border-radius: 15px; font-size: 1rem; font-weight: 800; color: white; cursor: pointer; transition: transform 0.2s; }
.action-btn:active { transform: scale(0.95); }
.use-btn { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: #000; }
.hatch-btn { background: linear-gradient(135deg, #f6d365 0%, #fda085 100%); color: #000; }
.equip-btn { background: linear-gradient(135deg, #ff0844 0%, #ffb199 100%); }
.farm-btn { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: #000; }

@keyframes pulse { 0%, 100% { opacity: 0.2; } 50% { opacity: 0.4; } }
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.slide-up-enter-from, .slide-up-leave-to { opacity: 0; transform: translateY(100%); }
</style>
