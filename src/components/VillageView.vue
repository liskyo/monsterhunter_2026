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
      <div class="alert-bubble">💬 老村長：今天也有新的龍蛋運到喔！</div>
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
        <button class="menu-item" @click="$emit('to-battle')">
          <div class="icon">🗺️</div>
          <span>出擊</span>
        </button>
        <button class="menu-item" @click="$emit('to-inventory')">
          <div class="icon">🎒</div>
          <span>背包</span>
        </button>
      </div>
    </footer>
  </div>
</template>

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

/* 中間提示 */
.village-main { flex: 1; position: relative; z-index: 5; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 40px; }
.alert-bubble { background: rgba(255,255,255,0.9); color: #333; padding: 10px 20px; border-radius: 20px 20px 20px 0; font-size: 0.85rem; font-weight: bold; box-shadow: 0 4px 15px rgba(0,0,0,0.3); animation: bounce 3s infinite; }

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
</style>