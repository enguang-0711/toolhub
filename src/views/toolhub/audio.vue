<template>
  <div class="audio-page">
    <header class="audio-header"><a class="back-link" :href="dashboardHref">← 返回 Toolhub</a><span>∿ 音频匹配与编辑 · 离线处理</span></header>
    <iframe title="音频匹配与编辑" :src="audioSrc" allow="clipboard-read; clipboard-write"></iframe>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue';
const dashboardHref = computed(() => `${import.meta.env.BASE_URL}#/dashboard/tools`);
const audioSrc = computed(() => `${import.meta.env.BASE_URL}tools/audio-match-editor/index-standalone.html`);
</script>
<style scoped>
.audio-page{height:calc(100vh - 68px);min-height:600px;display:flex;flex-direction:column}.audio-header{height:44px;display:flex;align-items:center;justify-content:space-between;padding:0 12px 9px;color:#636978;font-size:12px}.back-link{color:#3b70df;text-decoration:none}.back-link:hover{text-decoration:underline}iframe{flex:1;width:100%;border:0;border-radius:8px;background:#0c111b}
</style>
