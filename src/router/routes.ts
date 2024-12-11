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
    name: 'auth',
    path: '/auth',
    component: () => import('layouts/PublicLayout.vue'),
    children: [
      {
        name: 'callbackComponent',
        path: '',
        component: () => import('components/login/CallbackComponent.vue'),
      },
    ],
    meta: { requiresAuth: false, roles: [] },
  },
  // {
  //   path: '/auth',
  //   component: () => import('components/login/CallbackComponent.vue'),
  //   meta: { requiresAuth: false, roles: [] },
  // },
  {
    name: 'catalog',
    path: '/catalog',
    component: () => import('layouts/MainLayout/MainLayout.vue'),
    children: [
      {
        name: 'catalog',
        path: '',
        component: () => import('pages/Private/Catalog/Catalog.vue'),
      },
    ],
    meta: {
      requiresAuth: true,
      permissionLevel: [],
      roles: ['Admin', 'Dev', 'BetaTester'],
    },
  },

  {
    name: 'product',
    path: '/product/:page_name',
    component: () => import('layouts/MainLayout/MainLayout.vue'),
    children: [
      {
        name: 'productPage',
        path: '', // Nested path for /product/:page_name
        component: () =>
          import('pages/Private/Catalog/components/ProductWrapper.vue'), // Use wrapper
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
  {
    name: 'subscription_success_root',
    path: '/subscription_success',
    component: () => import('layouts/MainLayout/MainLayout.vue'),
    children: [
      {
        name: 'subscription_success',
        path: '',
        component: () => import('pages/Private/SubscriptionSuccess.vue'),
      },
    ],
    meta: { requiresAuth: false, roles: [] },
  },

  {
    name: 'user_root',
    path: '/user',
    component: () => import('layouts/MainLayout/MainLayout.vue'),
    children: [
      {
        name: 'user',
        path: '',
        component: () => import('pages/Private/UserPage.vue'),
      },
    ],
    meta: { requiresAuth: true, roles: [] },
  },
];

export default routes;
