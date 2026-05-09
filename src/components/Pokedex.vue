<template>
  <div class="pokedex-container">
    <div class="pokedex-bg">
      <div class="hex-grid"></div>
    </div>
    
    <header class="top-nav">
      <button class="back-btn" @click="$emit('back')">↩ 返回</button>
      <div class="title-group">
        <h2 class="title">生態圖鑑</h2>
        <span class="subtitle">Monster Field Guide</span>
      </div>
      <div class="count">📖 {{ monsters.length }} 種</div>
    </header>

    <div class="search-bar">
      <input type="text" v-model="searchQuery" placeholder="搜尋魔物名稱..." class="search-input" />
      <span class="search-icon">🔍</span>
    </div>

    <main class="pokedex-content">
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>正在查閱古龍觀測所紀錄...</p>
      </div>
      
      <div v-else class="monster-grid">
        <div 
          v-for="(monster, index) in filteredMonsters" 
          :key="index"
          class="monster-card"
          @click="selectMonster(monster)"
        >
          <div class="card-inner">
            <div class="monster-id">#{{ String(monster.originalIndex).padStart(3, '0') }}</div>
            <div class="img-container">
              <img :src="monster.image" @error="handleImageError" class="monster-img" loading="lazy" />
            </div>
            <div class="name-bar">
              <div class="monster-name">{{ monster.name }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="!isLoading && filteredMonsters.length === 0" class="empty-state">
        查無符合條件的魔物。
      </div>
    </main>

    <!-- 底部詳情面板 -->
    <transition name="slide-up">
      <div v-if="selectedMonster" class="detail-panel">
        <div class="panel-header">
          <div class="panel-title">
            <span class="id-badge">#{{ String(selectedMonster.originalIndex).padStart(3, '0') }}</span>
            <h3>{{ selectedMonster.name }}</h3>
          </div>
          <button class="close-btn" @click="selectedMonster = null">✕</button>
        </div>
        
        <div class="detail-body">
          <div class="detail-img-box">
            <img :src="selectedMonster.image" @error="handleImageError" class="detail-img" />
          </div>
          
          <div class="info-section">
            <div class="info-row">
              <span class="label">種類:</span>
              <span class="value">{{ selectedMonster.type || '未知' }}</span>
            </div>
            <div class="info-row" v-if="selectedMonster.description">
              <span class="label">生態:</span>
              <p class="value desc">{{ selectedMonster.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { monsterZhMap, speciesZhMap, validMonsterImages } from '../utils/monsterI18n';

const emit = defineEmits(['back']);

const monsters = ref([]);
const isLoading = ref(true);
const searchQuery = ref('');
const selectedMonster = ref(null);

const initPokedex = async () => {
  try {
    isLoading.value = true;
    const res = await fetch('/game_jsons/All_monsters.json');
    const data = await res.json();
    
    // 顯示所有大型魔物 (無圖片者會自動使用龍蛋替代)
    const largeMonsters = data.魔物.filter(m => m.大型);
    
    monsters.value = largeMonsters.map((m, index) => {
      let desc = '棲息於各地的大型魔物，生態仍有許多未解之謎。';
      const bits = [];
      if (m.屬性?.length) bits.push(`屬性：${m.屬性.join('、')}`);
      if (m.異常狀態?.length) bits.push(`異常狀態：${m.異常狀態.join('、')}`);
      if (m.弱點?.length) bits.push(`弱點：${m.弱點.join('、')}`);
      if (bits.length) desc = `${bits.join('；')}。`;
      
      return {
        originalIndex: index + 1,
        name: m.名稱,
        englishName: m.英文名,
        type: m.種類 || '未知種',
        description: desc,
        image: `/game_images/monsters-small/${m.英文名}.webp`
      };
    });
    
  } catch (err) {
    console.error('圖鑑資料載入失敗:', err);
    // 備援資料
    monsters.value = [
      { originalIndex: 1, name: '雄火龍', englishName: 'Rathalos', type: '飛龍種', description: '被稱為「天空王者」的飛龍。', image: '/game_images/monsters-small/Rathalos.webp' },
      { originalIndex: 2, name: '雷狼龍', englishName: 'Zinogre', type: '牙龍種', description: '全身纏繞雷電的牙龍種。', image: '/game_images/monsters-small/Zinogre.webp' }
    ];
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  initPokedex();
});

const filteredMonsters = computed(() => {
  if (!searchQuery.value) return monsters.value;
  const q = searchQuery.value.toLowerCase();
  return monsters.value.filter(m => 
    m.name.toLowerCase().includes(q) || 
    (m.englishName && m.englishName.toLowerCase().includes(q))
  );
});

const selectMonster = (monster) => {
  selectedMonster.value = monster;
};

const handleImageError = (e) => {
  // 圖片載入失敗時顯示一顆龍蛋作為代替
  e.target.src = '/game_images/eggs/Rathalos.svg';
  e.target.classList.add('fallback-img');
};
</script>

<style scoped>
.pokedex-container {
  width: 100%; height: 100%; position: relative; overflow: hidden;
  background: #0d1117; font-family: 'Montserrat', sans-serif;
  color: #e6edf3; display: flex; flex-direction: column;
}

/* 背景設計：科技感六角形網格 */
.pokedex-bg { position: absolute; inset: 0; z-index: 0; background: linear-gradient(180deg, #161b22, #0d1117); }
.hex-grid {
  position: absolute; inset: 0; opacity: 0.05;
  background-image: url('data:image/svg+xml;utf8,<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><path d="M20 0l20 10v20L20 40 0 30V10z" fill="none" stroke="%23ffffff" stroke-width="1"/></svg>');
  background-size: 30px 30px;
}

/* 導航列 */
.top-nav {
  position: relative; z-index: 10; padding: 50px 20px 15px;
  display: flex; justify-content: space-between; align-items: flex-end;
  background: rgba(13, 17, 23, 0.9); backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255,255,255,0.1);
}
.back-btn { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 8px 15px; border-radius: 20px; font-weight: bold; cursor: pointer; }
.title-group { display: flex; flex-direction: column; align-items: center; }
.title { margin: 0; font-size: 1.2rem; font-weight: 900; letter-spacing: 2px; color: #58a6ff; text-shadow: 0 0 10px rgba(88, 166, 255, 0.4); }
.subtitle { font-size: 0.6rem; color: #8b949e; letter-spacing: 1px; text-transform: uppercase; }
.count { background: rgba(0,0,0,0.5); padding: 5px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: bold; color: #8b949e; border: 1px solid rgba(255,255,255,0.05); }

/* 搜尋列 */
.search-bar {
  position: relative; z-index: 10; padding: 15px 20px 5px;
}
.search-input {
  width: 100%; padding: 12px 15px 12px 40px; border-radius: 20px;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
  color: white; font-size: 0.95rem; outline: none; transition: all 0.3s;
}
.search-input:focus { border-color: #58a6ff; background: rgba(255,255,255,0.1); box-shadow: 0 0 10px rgba(88,166,255,0.2); }
.search-icon { position: absolute; left: 35px; top: 50%; transform: translateY(-50%); opacity: 0.5; font-size: 1rem; }

/* 主要內容 (網格) */
.pokedex-content { flex: 1; overflow-y: auto; position: relative; z-index: 5; padding: 15px 20px 100px; }
.monster-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }

/* 魔物卡片 */
.monster-card {
  aspect-ratio: 1 / 1.2; background: linear-gradient(135deg, rgba(30,35,45,0.8), rgba(20,25,30,0.8));
  border-radius: 15px; border: 1px solid rgba(255,255,255,0.05);
  cursor: pointer; transition: transform 0.2s, border-color 0.2s; overflow: hidden;
  box-shadow: 0 4px 10px rgba(0,0,0,0.5);
}
.monster-card:active { transform: scale(0.95); }
.monster-card:hover { border-color: #58a6ff; }
.card-inner { position: relative; width: 100%; height: 100%; display: flex; flex-direction: column; }
.monster-id { position: absolute; top: 5px; left: 8px; font-size: 0.65rem; color: #8b949e; font-family: monospace; font-weight: bold; z-index: 2; }
.img-container { flex: 1; display: flex; align-items: center; justify-content: center; padding: 15px 10px 5px; }
.monster-img { width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 5px 5px rgba(0,0,0,0.5)); transition: transform 0.3s; }
.monster-card:hover .monster-img { transform: scale(1.1); }
.fallback-img { opacity: 0.3; filter: grayscale(100%); }
.name-bar { background: rgba(0,0,0,0.6); padding: 6px 4px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05); }
.monster-name { font-size: 0.65rem; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* 載入與空狀態 */
.loading-state, .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 50vh; color: #8b949e; }
.spinner { width: 40px; height: 40px; border: 3px solid rgba(88,166,255,0.2); border-top-color: #58a6ff; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 15px; }
@keyframes spin { to { transform: rotate(360deg); } }

/* 底部詳情面板 */
.detail-panel {
  position: absolute; bottom: 0; left: 0; right: 0; z-index: 20;
  background: rgba(13, 17, 23, 0.95); backdrop-filter: blur(20px);
  border-top: 1px solid rgba(88,166,255,0.3); border-radius: 30px 30px 0 0;
  padding: 25px 25px 40px; box-shadow: 0 -10px 40px rgba(0,0,0,0.8);
}
.panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.panel-title { display: flex; align-items: center; gap: 10px; }
.id-badge { font-family: monospace; background: rgba(88,166,255,0.1); color: #58a6ff; padding: 4px 8px; border-radius: 8px; font-weight: bold; font-size: 0.9rem; }
.panel-title h3 { margin: 0; font-size: 1.4rem; font-weight: 900; }
.close-btn { background: rgba(255,255,255,0.1); border: none; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; }

.detail-body { display: flex; flex-direction: column; gap: 20px; }
.detail-img-box { background: radial-gradient(circle, rgba(88,166,255,0.1) 0%, transparent 70%); border-radius: 20px; display: flex; align-items: center; justify-content: center; padding: 20px; }
.detail-img { width: 150px; height: 150px; object-fit: contain; filter: drop-shadow(0 10px 15px rgba(0,0,0,0.6)); animation: float 4s ease-in-out infinite; }

.info-section { background: rgba(255,255,255,0.03); padding: 15px; border-radius: 15px; border: 1px solid rgba(255,255,255,0.05); }
.info-row { margin-bottom: 10px; display: flex; align-items: flex-start; }
.info-row:last-child { margin-bottom: 0; }
.label { color: #8b949e; width: 50px; font-size: 0.85rem; font-weight: bold; flex-shrink: 0; }
.value { color: #e6edf3; font-size: 0.9rem; }
.desc { line-height: 1.6; }

@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.slide-up-enter-from, .slide-up-leave-to { opacity: 0; transform: translateY(100%); }
</style>
