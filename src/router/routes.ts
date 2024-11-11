import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    name: 'root',
    path: '/',
    component: () => import('layouts/PublicLayout.vue'),
    children: [
      {
        name: 'rootComponent',
        path: '',
        component: () => import('pages/Public/IndexPage.vue'),
      },
    ],
    meta: { requiresAuth: false, roles: [] },
  },
  {
    path: '/auth',
    component: () => import('components/login/CallbackComponent.vue'),
    meta: { requiresAuth: false, roles: [] },
  },
  {
    name: 'app_root',
    path: '/app',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        name: 'app',
        path: '',
        component: () => import('pages/Private/MainApp.vue'),
      },
    ],
    meta: {
      requiresAuth: true,
      permissionLevel: [],
      roles: ['Admin', 'Dev', 'BetaTester'],
    },
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
