import { createApp } from 'vue';
import { create, NAvatar, NButton, NBreadcrumb, NBreadcrumbItem, NCard, NConfigProvider, NDialogProvider, NEmpty, NIcon, NInput, NMenu, NMessageProvider, NNotificationProvider, NSelect, NTag } from 'naive-ui';
import App from './App.vue';
import './styles.css';

const naive = create({ components:[NAvatar,NButton,NBreadcrumb,NBreadcrumbItem,NCard,NConfigProvider,NDialogProvider,NEmpty,NIcon,NInput,NMenu,NMessageProvider,NNotificationProvider,NSelect,NTag] });
createApp(App).use(naive).mount('#app');
