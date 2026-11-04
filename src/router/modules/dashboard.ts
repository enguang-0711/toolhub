import { RouteRecordRaw } from 'vue-router';
import { Layout } from '@/router/constant';
import { AppstoreOutlined } from '@vicons/antd';
import { renderIcon } from '@/utils/index';

const routeName = 'dashboard';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/dashboard',
    name: routeName,
    redirect: '/dashboard/tools',
    component: Layout,
    meta: {
      title: 'route.dashboard',
      icon: renderIcon(AppstoreOutlined),
      sort: 0,
      ignoreAuth: true,
    },
    children: [
      {
        path: 'console',
        name: `${routeName}_console`,
        meta: {
          title: 'route.dashboard_console',
          ignoreAuth: true,
          affix: true,
        },
        component: () => import('@/views/dashboard/console/console.vue'),
      },
      {
        path: 'audio-match-editor',
        name: `${routeName}_audio_match_editor`,
        meta: {
          title: 'route.dashboard_audio_match_editor',
          ignoreAuth: true,
        },
        component: () => import('@/views/toolhub/audio.vue'),
      },
      {
        path: 'tools',
        name: `${routeName}_tools`,
        meta: {
          title: 'route.dashboard_tools',
          ignoreAuth: true,
          affix: true,
        },
        component: () => import('@/views/toolhub/index.vue'),
      },
      {
        path: 'workplace',
        name: `${routeName}_workplace`,
        meta: {
          title: 'route.dashboard_workplace',
          keepAlive: true,
          permissions: ['dashboard_workplace'],
        },
        component: () => import('@/views/dashboard/workplace/workplace.vue'),
      },
    ],
  },
];

export default routes;
