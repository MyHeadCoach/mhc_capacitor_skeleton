import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/tabs/trades',
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/LoginPage.vue'),
    meta: { public: true },
  },
  {
    path: '/tabs/',
    component: () => import('@/layouts/TabsLayout.vue'),
    children: [
      { path: '', redirect: '/tabs/trades' },
      { path: 'trades', component: () => import('@/pages/trades/TradesPage.vue') },
      { path: 'trades/:tradeId', component: () => import('@/pages/trades/TradeDetailPage.vue') },
      { path: 'chat', component: () => import('@/pages/chat/ChatPage.vue') },
      { path: 'chat/channel/:channelId', component: () => import('@/pages/chat/ChannelPage.vue') },
      { path: 'chat/channel/:channelId/thread/:messageId', component: () => import('@/pages/chat/ThreadPage.vue') },
      { path: 'chat/dm/:userId', component: () => import('@/pages/chat/DmPage.vue') },
      { path: 'announcements', component: () => import('@/pages/announcements/AnnouncementsPage.vue') },
      { path: 'sessions', component: () => import('@/pages/sessions/SessionsPage.vue') },
      { path: 'profile', component: () => import('@/pages/profile/ProfilePage.vue') },
      { path: 'profile/notifications', component: () => import('@/pages/profile/NotificationSettingsPage.vue') },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore();

  if (!authStore.isInitialized) {
    await authStore.initialize();
  }

  if (to.meta.public) {
    if (authStore.isAuthenticated) {
      return next('/tabs/trades');
    }
    return next();
  }

  if (!authStore.isAuthenticated) {
    return next('/login');
  }

  next();
});

export default router;
