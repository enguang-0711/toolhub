<template>
  <div class="toolhub">
    <div class="page-header">
      <div>
        <h1>工具目录</h1>
        <p>管理和启动 Toolhub 中的独立工具。</p>
      </div>
      <n-button type="primary" @click="showAddHelp">添加工具</n-button>
    </div>

    <n-grid cols="1 s:3" responsive="screen" :x-gap="14" :y-gap="14" class="metrics" >
      <n-grid-item v-for="metric in metrics" :key="metric.label">
        <n-card size="small" :bordered="false" class="metric-card">
          <div class="metric-head"><span>{{ metric.label }}</span><n-tag :type="metric.type" :bordered="false" size="small">{{ metric.badge }}</n-tag></div>
          <n-skeleton v-if="loading" :width="54" height="30px" />
          <strong v-else>{{ metric.value }}</strong>
          <small>{{ metric.note }}</small>
        </n-card>
      </n-grid-item>
    </n-grid>

    <n-card :bordered="false" class="catalog-card">
      <div class="catalog-head"><div><h2>已登记工具</h2><p>{{ filteredTools.length }} 个可用工具</p></div><div class="catalog-controls">
        <n-input v-model:value="searchText" clearable placeholder="搜索工具" class="search" />
        <n-select v-model:value="category" :options="categoryOptions" class="category" />
      </div></div>
      <n-grid v-if="filteredTools.length" cols="1 s:2 l:3" responsive="screen" :x-gap="14" :y-gap="14">
        <n-grid-item v-for="tool in filteredTools" :key="tool.id">
          <n-card class="tool-card" size="small" hoverable>
            <div class="tool-head"><span class="tool-icon">{{ tool.icon }}</span><n-tag type="success" :bordered="false" round size="small">可用</n-tag></div>
            <h3>{{ tool.name }}</h3><p>{{ tool.description }}</p>
            <div class="tool-tags"><n-tag v-for="tag in tool.tags" :key="tag" :bordered="false" size="small" round>{{ tag }}</n-tag></div>
            <div class="tool-foot"><span>{{ tool.category }}</span><n-button type="primary" secondary size="small" @click="launch(tool)">打开工具 ↗</n-button></div>
          </n-card>
        </n-grid-item>
      </n-grid>
      <n-empty v-else description="没有匹配的工具" class="empty"><template #extra><n-button size="small" @click="reset">清除筛选</n-button></template></n-empty>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useDialog } from 'naive-ui';
import { useRouter } from 'vue-router';

interface ToolEntry { id:string; name:string; description:string; category:string; icon:string; tags:string[]; route:string }
const dialog = useDialog();
const router = useRouter();
const loading = ref(true);
const searchText = ref('');
const category = ref('全部分类');
const tools = ref<ToolEntry[]>([
  { id:'audio-match-editor', name:'音频匹配与编辑', description:'按参考声音定位音频片段，试听确认后编辑并导出 WAV。音频仅在本地浏览器处理。', category:'音频工具', icon:'∿', tags:['波形匹配','WAV 导出'], route:'/dashboard/audio-match-editor' },
]);
const categories = computed(() => [...new Set(tools.value.map(tool => tool.category))]);
const categoryOptions = computed(() => [{ label:'全部分类', value:'全部分类' }, ...categories.value.map(value => ({label:value,value}))]);
const filteredTools = computed(() => tools.value.filter(tool => (category.value==='全部分类' || tool.category===category.value) && `${tool.name} ${tool.description} ${tool.tags.join(' ')}`.toLowerCase().includes(searchText.value.trim().toLowerCase())));
const metrics = computed(() => [
  {label:'工具总数',value:tools.value.length,type:'info' as const,badge:'目录',note:'项目中已登记的工具'},
  {label:'可用工具',value:tools.value.length,type:'success' as const,badge:'在线',note:'可在浏览器中启动'},
  {label:'工具分类',value:categories.value.length,type:'warning' as const,badge:'分类',note:'按功能整理'},
]);
function launch(tool:ToolEntry) { void router.push(tool.route); }
function reset() { searchText.value=''; category.value='全部分类'; }
function showAddHelp() { dialog.info({title:'添加工具',content:'将独立页面加入 vite.config.mts 的多页构建入口，并在 src/views/toolhub/index.vue 的 tools 列表中登记名称、简介、分类、标签和链接。',positiveText:'知道了'}); }
let timer:number;
onMounted(() => { timer=window.setTimeout(() => { loading.value=false; },450); });
onUnmounted(() => window.clearTimeout(timer));
</script>

<style scoped>
.toolhub{padding:4px 2px 20px}.page-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}.page-header h1{margin:0 0 5px;font-size:23px;font-weight:600}.page-header p,.catalog-head p{margin:0;color:#8b8f99;font-size:12px}.metrics{margin-bottom:16px}.metric-card{min-height:122px}.metric-card :deep(.n-card__content){padding:15px 17px}.metric-head{display:flex;align-items:center;justify-content:space-between;color:#747985;font-size:12px}.metric-card strong{display:block;margin-top:8px;font-size:25px;line-height:1.1}.metric-card small{display:block;margin-top:7px;color:#9b9fa8;font-size:10px}.catalog-card :deep(.n-card__content){padding:17px}.catalog-head{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:17px}.catalog-head h2{margin:0 0 5px;font-size:15px;font-weight:600}.catalog-controls{display:flex;gap:9px}.search{width:210px}.category{width:145px}.tool-card{height:100%;border-radius:8px}.tool-card :deep(.n-card__content){padding:15px}.tool-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}.tool-icon{display:grid;place-items:center;width:38px;height:38px;border-radius:10px;background:#edf3ff;color:#3b70df;font-size:22px;font-weight:700}.tool-card h3{margin:0 0 7px;font-size:14px}.tool-card p{min-height:38px;margin:0;color:#858b96;font-size:11px;line-height:1.7}.tool-tags{display:flex;gap:5px;margin-top:10px}.tool-foot{display:flex;align-items:center;justify-content:space-between;margin-top:14px;padding-top:11px;border-top:1px solid #f0f1f3;color:#9297a0;font-size:10px}.empty{padding:38px 0}@media(max-width:620px){.page-header h1{font-size:20px}.catalog-head{align-items:flex-start;flex-direction:column}.catalog-controls{width:100%}.search{flex:1;min-width:0}.category{width:125px}.metric-card{min-height:110px}}
</style>
