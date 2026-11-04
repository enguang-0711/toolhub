<template>
  <n-config-provider :theme-overrides="themeOverrides">
    <n-dialog-provider>
      <n-message-provider>
        <n-notification-provider>
          <div class="app-shell">
            <aside class="sidebar" :class="{ 'sidebar-open': menuOpen }">
              <a class="brand" href="#/">
                <span class="brand-mark">T</span>
                <span><strong>Toolhub</strong><small>工具管理台</small></span>
              </a>
              <div class="nav-caption">工作空间</div>
              <n-menu :value="activeMenu" :options="menuOptions" @update:value="navigate" />
              <div class="sidebar-bottom">
                <div class="account-avatar">T</div>
                <div class="account-copy"><b>本地工作区</b><small>静态工具目录</small></div>
                <n-tag size="small" :bordered="false" type="success" round>在线</n-tag>
              </div>
            </aside>
            <div v-if="menuOpen" class="mobile-scrim" @click="menuOpen = false"></div>
            <main class="main-area">
              <header class="topbar">
                <div class="top-left">
                  <n-button class="mobile-menu" quaternary circle @click="menuOpen = !menuOpen"><span class="hamburger">☰</span></n-button>
                  <n-breadcrumb>
                    <n-breadcrumb-item>Toolhub</n-breadcrumb-item>
                    <n-breadcrumb-item>{{ activeMenu === 'catalog' ? '工具目录' : '概览' }}</n-breadcrumb-item>
                  </n-breadcrumb>
                </div>
                <div class="top-actions">
                  <n-tag :bordered="false" round class="private-tag">仅本地处理</n-tag>
                  <n-button quaternary circle aria-label="帮助" @click="showHelp"><span class="help-icon">?</span></n-button>
                  <n-avatar round size="small" color="#d9e8ff" text-color="#2459a8">T</n-avatar>
                </div>
              </header>
              <div class="page-content">
                <template v-if="activeMenu === 'catalog'">
                  <section class="welcome-row">
                    <div>
                      <n-breadcrumb class="page-breadcrumb"><n-breadcrumb-item>工作空间</n-breadcrumb-item><n-breadcrumb-item>工具目录</n-breadcrumb-item></n-breadcrumb>
                      <h1>工具目录</h1>
                      <p class="page-subtitle">管理和打开你的在线工具。新增工具后会在这里自动生成入口卡片。</p>
                    </div>
                    <n-button type="primary" size="large" class="add-button" @click="showAddTip"><span class="plus">＋</span> 添加工具</n-button>
                  </section>
                  <section class="stats-grid">
                    <n-card class="stat-card" :bordered="false"><div class="stat-label">工具总数</div><div class="stat-main"><strong>{{ tools.length }}</strong><span class="stat-mark blue-mark">▦</span></div><div class="stat-foot">已登记的工具入口</div></n-card>
                    <n-card class="stat-card" :bordered="false"><div class="stat-label">可用工具</div><div class="stat-main"><strong>{{ availableCount }}</strong><n-tag size="small" type="success" round :bordered="false">运行正常</n-tag></div><div class="stat-foot">可直接在浏览器打开</div></n-card>
                    <n-card class="stat-card" :bordered="false"><div class="stat-label">工具分类</div><div class="stat-main"><strong>{{ categories.length }}</strong><span class="stat-mark violet-mark">◇</span></div><div class="stat-foot">按用途整理工具</div></n-card>
                  </section>
                  <section class="catalog-toolbar">
                    <div><h2>全部工具</h2><span class="toolbar-count">{{ filteredTools.length }} 个工具</span></div>
                    <div class="filters">
                      <n-input v-model:value="searchText" clearable placeholder="搜索工具名称或描述" class="search-input">
                        <template #prefix><span class="search-icon">⌕</span></template>
                      </n-input>
                      <n-select v-model:value="selectedCategory" :options="categoryOptions" class="category-select" />
                      <n-button quaternary circle aria-label="刷新工具目录" @click="refreshCatalog">↻</n-button>
                    </div>
                  </section>
                  <section v-if="filteredTools.length" class="tool-grid">
                    <n-card v-for="tool in filteredTools" :key="tool.id" class="tool-card" :bordered="false" content-style="padding: 20px 21px 18px">
                      <div class="card-top"><div class="tool-icon" :class="`icon-${tool.tone}`">{{ tool.icon }}</div><n-tag :bordered="false" size="small" round type="success"><span class="status-dot"></span>可用</n-tag></div>
                      <h3>{{ tool.name }}</h3>
                      <p class="tool-description">{{ tool.description }}</p>
                      <div class="tool-meta"><n-tag v-for="tag in tool.tags" :key="tag" :bordered="false" size="small" round>{{ tag }}</n-tag><span class="category-label">{{ tool.category }}</span></div>
                      <div class="card-bottom"><span>本地浏览器运行</span><n-button type="primary" secondary size="small" @click="openTool(tool)">打开工具 <span class="open-arrow">↗</span></n-button></div>
                    </n-card>
                  </section>
                  <n-empty v-else description="没有匹配的工具" class="empty-state"><template #extra><n-button size="small" @click="resetFilters">清除筛选</n-button></template></n-empty>
                  <footer class="page-footer"><span>Toolhub 管理台 <span class="footer-dot">·</span> 工具数据存储在项目清单中</span><span>部署于 GitHub Pages</span></footer>
                </template>
                <section v-else class="overview-page">
                  <n-breadcrumb class="page-breadcrumb"><n-breadcrumb-item>工作空间</n-breadcrumb-item><n-breadcrumb-item>概览</n-breadcrumb-item></n-breadcrumb>
                  <h1>工作空间概览</h1><p class="page-subtitle">工具箱运行概况与快速入口。</p>
                  <section class="stats-grid overview-stats">
                    <n-card class="stat-card" :bordered="false"><div class="stat-label">已登记工具</div><div class="stat-main"><strong>{{ tools.length }}</strong></div><div class="stat-foot">随仓库持续扩充</div></n-card>
                    <n-card class="stat-card" :bordered="false"><div class="stat-label">应用位置</div><div class="stat-main"><strong class="small-main">GitHub Pages</strong></div><div class="stat-foot">提交后自动构建部署</div></n-card>
                    <n-card class="stat-card" :bordered="false"><div class="stat-label">数据策略</div><div class="stat-main"><strong class="small-main">浏览器本地</strong></div><div class="stat-foot">工具自行控制数据访问</div></n-card>
                  </section>
                  <n-card class="quick-card" :bordered="false"><div class="quick-heading"><div><h2>最近添加</h2><p>从这里快速启动工具。</p></div><n-button text type="primary" @click="navigate('catalog')">查看全部 <span class="open-arrow">→</span></n-button></div><div class="quick-tool" v-for="tool in tools.slice(0,3)" :key="tool.id"><div class="tool-icon mini-icon" :class="`icon-${tool.tone}`">{{ tool.icon }}</div><div class="quick-copy"><b>{{ tool.name }}</b><small>{{ tool.category }} · {{ tool.description }}</small></div><n-button secondary size="small" @click="openTool(tool)">打开</n-button></div></n-card>
                </section>
              </div>
            </main>
          </div>
        </n-notification-provider>
      </n-message-provider>
    </n-dialog-provider>
  </n-config-provider>
</template>

<script setup>
import { computed, h, onMounted, onUnmounted, ref } from 'vue';
import { createDiscreteApi } from 'naive-ui';

const { dialog } = createDiscreteApi(['dialog']);
const menuOpen = ref(false);
const searchText = ref('');
const selectedCategory = ref('全部分类');
const activeMenu = ref(location.hash === '#/overview' ? 'overview' : 'catalog');
const themeOverrides = { common: { primaryColor: '#3b78e7', primaryColorHover: '#2d66cb', primaryColorPressed: '#2458b4', borderRadius: '9px', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }, Card: { borderRadius: '14px', color: '#ffffff' }, Menu: { itemHeight: '42px', itemColorActive: '#edf4ff', itemTextColorActive: '#285eb5', itemColorActiveHover: '#eaf2ff', itemIconColorActive: '#3575dc' } };
const tools = ref([
  { id:'audio-match-editor', name:'音频匹配与编辑', description:'按参考声音定位音频片段，试听确认后插入、替换或删除，并导出 WAV。', category:'音频工具', icon:'∿', tone:'blue', tags:['波形匹配','WAV 导出'], href:'tools/audio-match-editor/' },
]);
const categories = computed(() => [...new Set(tools.value.map(t => t.category))]);
const categoryOptions = computed(() => [{ label:'全部分类', value:'全部分类' }, ...categories.value.map(c => ({label:c,value:c}))]);
const filteredTools = computed(() => tools.value.filter(tool => (selectedCategory.value === '全部分类' || tool.category === selectedCategory.value) && `${tool.name} ${tool.description} ${tool.tags.join(' ')}`.toLowerCase().includes(searchText.value.trim().toLowerCase())));
const availableCount = computed(() => tools.value.length);
const menuOptions = [
  { label:'概览', key:'overview', icon:() => h('span',{class:'menu-symbol','aria-hidden':'true'},'⌂') },
  { label:'工具目录', key:'catalog', icon:() => h('span',{class:'menu-symbol','aria-hidden':'true'},'▦') },
];
function navigate(key) { activeMenu.value=key; menuOpen.value=false; location.hash=key==='catalog'?'#/':'#/overview'; }
function openTool(tool) { location.href=new URL(tool.href, document.baseURI).href; }
function showHelp() { dialog.info({title:'工具箱使用说明',content:'工具卡片由 src/dashboard/App.vue 中的 tools 清单维护。添加新工具时，把页面加入 vite.config.js 的多页入口，再为工具清单登记名称、描述、分类和链接即可。',positiveText:'知道了'}); }
function showAddTip() { dialog.info({title:'添加工具',content:'将新工具页面加入 vite.config.js 的多页面入口，然后在 src/dashboard/App.vue 的 tools 清单添加名称、描述、分类和链接。提交代码后，GitHub Actions 会自动构建并部署。',positiveText:'知道了'}); }
function resetFilters() { searchText.value=''; selectedCategory.value='全部分类'; }
function refreshCatalog() { resetFilters(); dialog.success({title:'目录已刷新',content:'当前已展示全部工具。新增工具后重新部署，即可在此查看。',positiveText:'知道了'}); }
function syncRoute() { activeMenu.value=location.hash==='#/overview'?'overview':'catalog'; }
onMounted(() => window.addEventListener('hashchange',syncRoute));
onUnmounted(() => window.removeEventListener('hashchange',syncRoute));
</script>

<style>
:root{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#202938;background:#f4f6fa;font-synthesis:none;text-rendering:optimizeLegibility}*{box-sizing:border-box}body{margin:0;min-width:320px;min-height:100vh;background:#f4f6fa}.app-shell{min-height:100vh}.sidebar{position:fixed;z-index:30;inset:0 auto 0 0;width:244px;padding:24px 16px 16px;background:#fff;border-right:1px solid #e8ecf2;display:flex;flex-direction:column}.brand{display:flex;align-items:center;gap:11px;padding:2px 8px 31px;color:#192538;text-decoration:none}.brand-mark{display:grid;place-items:center;width:37px;height:37px;border-radius:11px;background:linear-gradient(145deg,#4b8cf3,#2867d2);color:#fff;font-weight:800;font-size:21px;box-shadow:0 5px 12px #3978dc40}.brand strong{display:block;font-size:18px;letter-spacing:-.3px}.brand small{display:block;margin-top:1px;color:#8d98a9;font-size:11px}.nav-caption{padding:0 12px 9px;color:#9ba5b4;font-size:11px;font-weight:650;letter-spacing:.07em;text-transform:uppercase}.sidebar :deep(.n-menu){--n-item-text-color:#667387!important}.sidebar :deep(.n-menu-item-content){border-radius:8px}.sidebar-bottom{display:flex;align-items:center;gap:10px;margin-top:auto;padding:15px 6px 2px;border-top:1px solid #edf0f4}.account-avatar{display:grid;place-items:center;width:34px;height:34px;border-radius:50%;background:#eaf1fc;color:#3569b4;font-weight:700}.account-copy{display:grid;gap:1px;flex:1}.account-copy b{font-size:12px}.account-copy small{color:#929dad;font-size:10px}.main-area{min-height:100vh;margin-left:244px}.topbar{position:sticky;z-index:20;top:0;height:62px;background:#ffffffeb;backdrop-filter:blur(14px);border-bottom:1px solid #e9edf2;display:flex;align-items:center;justify-content:space-between;padding:0 33px}.top-left,.top-actions{display:flex;align-items:center;gap:17px}.topbar :deep(.n-breadcrumb){font-size:12px}.top-actions{gap:13px}.private-tag{color:#4172bc!important;background:#edf4ff!important}.help-icon{display:grid;place-items:center;width:20px;height:20px;border:1.5px solid #8290a4;border-radius:50%;color:#738198;font-size:12px;font-weight:700}.page-content{max-width:1330px;margin:0 auto;padding:33px 38px 22px}.welcome-row{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:24px}.page-breadcrumb{margin-bottom:8px;color:#8c98a9;font-size:11px}.welcome-row h1,.overview-page h1{margin:0;color:#202b3a;font-size:26px;letter-spacing:-.55px;line-height:1.3}.page-subtitle{margin:6px 0 0;color:#8490a2;font-size:12px}.add-button{height:38px;box-shadow:0 5px 11px #3a79db30}.plus{margin-right:5px;font-size:18px;line-height:10px}.stats-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px}.stat-card{min-height:118px;border:1px solid #e9edf2!important;box-shadow:0 3px 11px #1d2b3b06}.stat-label{color:#7e8999;font-size:11px}.stat-main{display:flex;align-items:center;gap:11px;margin-top:8px}.stat-main strong{font-size:26px;line-height:1.15;color:#273446;font-weight:650}.stat-main .small-main{font-size:16px}.stat-foot{margin-top:7px;color:#a0a9b6;font-size:10px}.stat-mark{margin-left:auto;display:grid;place-items:center;width:31px;height:31px;border-radius:9px;font-size:18px}.blue-mark{color:#3878dc;background:#eef4ff}.violet-mark{color:#7a64d0;background:#f3f0ff}.catalog-toolbar{display:flex;align-items:center;justify-content:space-between;gap:16px;margin:31px 0 14px}.catalog-toolbar h2{display:inline;margin:0;font-size:15px;color:#293447}.toolbar-count{margin-left:9px;color:#98a3b2;font-size:11px}.filters{display:flex;align-items:center;gap:8px}.search-input{width:230px}.category-select{width:145px}.search-input :deep(.n-input),.category-select :deep(.n-base-selection){background:#fff}.search-icon{font-size:17px;color:#8c99aa}.tool-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px}.tool-card{min-height:215px;border:1px solid #e8edf3!important;box-shadow:0 3px 11px #1d2b3b08;transition:transform .15s,box-shadow .15s}.tool-card:hover{transform:translateY(-2px);box-shadow:0 9px 22px #1d2b3b13}.card-top{display:flex;align-items:center;justify-content:space-between}.tool-icon{display:grid;place-items:center;width:41px;height:41px;border-radius:12px;font-size:22px}.icon-blue{color:#3475d7;background:#edf4ff}.icon-green{color:#189e79;background:#e6f8f2}.icon-violet{color:#755bce;background:#f0edff}.tool-card h3{margin:15px 0 4px;color:#253144;font-size:15px}.tool-description{display:-webkit-box;min-height:39px;margin:0;color:#8995a5;font-size:11px;line-height:1.65;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.tool-meta{display:flex;align-items:center;gap:5px;margin-top:13px}.tool-meta :deep(.n-tag){font-size:9px}.category-label{margin-left:auto;color:#929dad;font-size:10px}.card-bottom{display:flex;align-items:center;justify-content:space-between;margin-top:15px;padding-top:10px;border-top:1px solid #f0f2f5;color:#a0a9b5;font-size:10px}.card-bottom :deep(.n-button){font-size:10px}.open-arrow{margin-left:4px}.status-dot{display:inline-block;width:6px;height:6px;margin-right:4px;border-radius:50%;background:#27b985;vertical-align:1px}.empty-state{margin:70px 0}.page-footer{display:flex;justify-content:space-between;margin-top:24px;padding:15px 1px;color:#a1aab6;font-size:10px;border-top:1px solid #e8ecf1}.footer-dot{margin:0 5px}.overview-page h1{margin-top:4px}.overview-stats{margin-top:23px}.quick-card{margin-top:18px;border:1px solid #e8edf3!important}.quick-heading{display:flex;align-items:center;justify-content:space-between}.quick-heading h2{margin:0;font-size:15px}.quick-heading p{margin:3px 0 0;color:#909bab;font-size:11px}.quick-tool{display:flex;align-items:center;gap:12px;padding:12px 0;border-top:1px solid #edf0f4}.quick-tool:first-of-type{margin-top:13px}.mini-icon{width:35px;height:35px;font-size:19px}.quick-copy{display:grid;gap:2px;flex:1;min-width:0}.quick-copy b{font-size:12px}.quick-copy small{overflow:hidden;color:#909bab;font-size:10px;text-overflow:ellipsis;white-space:nowrap}.mobile-menu{display:none}.hamburger{font-size:18px;color:#52647a}.mobile-scrim{display:none}
@media(max-width:1050px){.tool-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.page-content{padding-right:25px;padding-left:25px}.topbar{padding:0 25px}}
@media(max-width:720px){.sidebar{transform:translateX(-100%);transition:transform .2s;box-shadow:none}.sidebar-open{transform:translateX(0);box-shadow:0 10px 40px #1114}.main-area{margin-left:0}.mobile-menu{display:inline-flex}.mobile-scrim{position:fixed;z-index:25;inset:0;display:block;background:#1118}.topbar{height:56px;padding:0 14px}.top-left{gap:8px}.top-actions{gap:8px}.private-tag{display:none}.page-content{padding:24px 16px 18px}.welcome-row{align-items:flex-start}.welcome-row h1,.overview-page h1{font-size:22px}.add-button{height:34px;font-size:11px}.stats-grid{gap:8px}.stat-card{min-height:103px}.stat-card :deep(.n-card__content){padding:12px!important}.stat-main strong{font-size:21px}.stat-main .small-main{font-size:12px}.stat-main .n-tag{font-size:9px}.catalog-toolbar{align-items:flex-start;flex-direction:column;margin-top:24px}.filters{width:100%}.search-input{flex:1;width:auto}.category-select{width:125px}.tool-grid{grid-template-columns:1fr}.tool-card{min-height:196px}.page-footer{gap:10px;font-size:9px}.page-footer span:last-child{text-align:right}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;transition:none!important}}
</style>
