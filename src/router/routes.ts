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

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
