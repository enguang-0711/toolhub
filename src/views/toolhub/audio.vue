<template>
  <div class="audio-page">
    <header v-if="!isFullscreen" class="audio-header">
      <a class="back-link" :href="dashboardHref">← 返回 Toolhub</a>
      <span>∿ 音频匹配与编辑 · 离线处理</span>
      <button type="button" class="fullscreen-button" @click="toggleFullscreen">全屏显示</button>
    </header>
    <button v-else type="button" class="fullscreen-button exit-fullscreen" @click="toggleFullscreen">退出全屏</button>
    <iframe title="音频匹配与编辑" :src="audioSrc" allow="clipboard-read; clipboard-write"></iframe>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue';

const dashboardHref = computed(() => `${import.meta.env.BASE_URL}#/dashboard/tools`);
const audioSrc = computed(() => `${import.meta.env.BASE_URL}tools/audio-match-editor/index-standalone.html`);
const isFullscreen = ref(false);

function updateFullscreenState() {
  isFullscreen.value = document.fullscreenElement === document.querySelector('.audio-page');
}

async function toggleFullscreen() {
  const page = document.querySelector('.audio-page');
  if (!page) return;
  if (document.fullscreenElement) await document.exitFullscreen();
  else await page.requestFullscreen();
}

onMounted(() => document.addEventListener('fullscreenchange', updateFullscreenState));
onBeforeUnmount(() => document.removeEventListener('fullscreenchange', updateFullscreenState));
</script>
<style scoped>
.audio-page{position:fixed;z-index:1000;inset:0;height:100dvh;min-height:0;display:flex;flex-direction:column;background:#0c111b}.audio-page:fullscreen{width:100vw;height:100dvh;min-height:0;padding:0;background:#0c111b}.audio-header{flex:none;height:40px;display:flex;align-items:center;justify-content:space-between;padding:0 12px;color:#d6dfed;font-size:12px;background:#101923}.back-link{color:#8db5ff;text-decoration:none}.back-link:hover{text-decoration:underline}.fullscreen-button{border:1px solid #38485d;border-radius:6px;background:#1a2635;padding:5px 11px;color:#c6d8f2;cursor:pointer;font:inherit}.exit-fullscreen{position:absolute;z-index:1;top:8px;right:12px;background:#101923cc}iframe{flex:1;min-height:0;width:100%;border:0;background:#0c111b}
</style>
