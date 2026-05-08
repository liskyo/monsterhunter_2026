<template>
  <div class="iphone-16-container">
    <div v-if="currentPage === 'START'" class="page start-screen">
      <div class="bg-wrapper">
        <img src="/game_images/start_bg.png" class="bg-img" />
        <div class="overlay-gradient"></div>
        <div class="particles"></div>
      </div>

      <div class="title-container">
        <p class="sub-title">LEGENDARY DEFENSE</p>
        <h1 class="main-title">魔物獵人<br><span class="year">2026</span></h1>
      </div>

      <div class="action-zone">
        <button class="glow-button" @click="enterVillage">
          <span class="btn-text">進入龍穴</span>
          <div class="btn-glow"></div>
        </button>
        <p class="tap-hint">TOUCH TO START</p>
      </div>
    </div>

    <VillageView v-else-if="currentPage === 'VILLAGE'" @to-hatchery="currentPage = 'HATCHERY'" @to-farm="currentPage = 'FARM'" @to-inventory="currentPage = 'INVENTORY'" @to-pokedex="currentPage = 'POKEDEX'" />
    <Hatchery v-else-if="currentPage === 'HATCHERY'" @back="currentPage = 'VILLAGE'" />
    <DragonFarm v-else-if="currentPage === 'FARM'" @back="currentPage = 'VILLAGE'" />
    <Inventory v-else-if="currentPage === 'INVENTORY'" @back="currentPage = 'VILLAGE'" />
    <Pokedex v-else-if="currentPage === 'POKEDEX'" @back="currentPage = 'VILLAGE'" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import VillageView from './components/VillageView.vue'
import Hatchery from './components/Hatchery.vue'
import DragonFarm from './components/DragonFarm.vue'
import Inventory from './components/Inventory.vue'
import Pokedex from './components/Pokedex.vue'

const currentPage = ref('START')
const enterVillage = () => { currentPage.value = 'VILLAGE' }
</script>

<style scoped>
/* 字體設定 */
.iphone-16-container {
  width: 100%; height: 100dvh; max-width: 430px; margin: 0 auto;
  background: #000; overflow: hidden; position: relative;
  font-family: 'Montserrat', sans-serif;
}

/* 背景與遮罩 */
.bg-wrapper { position: absolute; inset: 0; z-index: 0; }
.bg-img { width: 100%; height: 100%; object-fit: cover; transform: scale(1.1); animation: slowPan 20s linear infinite; }
.overlay-gradient { 
  position: absolute; inset: 0; 
  background: linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 40%, rgba(0,0,0,0.9) 90%); 
}

/* 標題特效：史詩感與漸層 */
.title-container { position: relative; z-index: 10; margin-top: 15vh; text-align: center; }
.sub-title { color: #facc15; font-size: 0.8rem; letter-spacing: 0.5em; font-weight: 900; margin-bottom: 10px; opacity: 0.8; }
.main-title { 
  font-family: 'Cinzel', serif; color: #fff; font-size: 3.5rem; line-height: 0.9; 
  text-shadow: 0 0 20px rgba(255,255,255,0.5), 0 5px 10px rgba(0,0,0,0.8);
  animation: titlePulse 3s ease-in-out infinite;
}
.year { color: #ff4747; font-size: 2.5rem; display: block; margin-top: 5px; filter: drop-shadow(0 0 10px #ff4747); }

/* 按鈕特效：脈衝呼吸 */
.action-zone { position: absolute; bottom: 12vh; width: 100%; display: flex; flex-direction: column; align-items: center; gap: 20px; z-index: 10; }
.glow-button {
  position: relative; width: 260px; height: 70px; background: #fff; border: none; border-radius: 50px;
  font-size: 1.4rem; font-weight: 900; cursor: pointer; transition: all 0.3s;
  overflow: hidden; box-shadow: 0 0 30px rgba(255,255,255,0.3);
  animation: btnBreath 2s ease-in-out infinite;
}
.btn-text { position: relative; z-index: 2; color: #000; letter-spacing: 2px; }
.btn-glow {
  position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
  background: conic-gradient(from 0deg, transparent, rgba(255,71,71,0.3), transparent);
  animation: rotateGlow 3s linear infinite;
}
.tap-hint { color: rgba(255,255,255,0.5); font-size: 0.7rem; letter-spacing: 3px; animation: blink 2s infinite; }

/* 動畫定義 */
@keyframes slowPan {
  0% { transform: scale(1.1) translate(0, 0); }
  50% { transform: scale(1.2) translate(-2%, -2%); }
  100% { transform: scale(1.1) translate(0, 0); }
}

@keyframes titlePulse {
  0%, 100% { transform: scale(1); filter: brightness(1); }
  50% { transform: scale(1.02); filter: brightness(1.2); }
}

@keyframes btnBreath {
  0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(255,255,255,0.2); }
  50% { transform: scale(1.05); box-shadow: 0 0 40px rgba(255,255,255,0.5); }
}

@keyframes rotateGlow {
  to { transform: rotate(360deg); }
}

@keyframes blink {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.8; }
}
</style>