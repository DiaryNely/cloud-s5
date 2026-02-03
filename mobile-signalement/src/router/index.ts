import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import TabsPage from '../views/TabsPage.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/tabs/home'
  },
  {
    path: '/tabs/',
    component: TabsPage,
    children: [
      {
        path: '',
        redirect: '/tabs/home'
      },
      {
        path: 'home',
        component: () => import('@/views/HomePage.vue')
      },
      {
        path: 'signalements',
        component: () => import('@/views/UserSignalementsPage.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'create',
        component: () => import('@/views/CreateSignalementPage.vue'),
        meta: { requiresAuth: true }
      }
    ]
  },
  {
    path: '/login',
    component: () => import('@/views/LoginPage.vue')
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

// Guard
router.beforeEach(async (to, from, next) => {
  if (to.meta.requiresAuth) {
    try {
      const { Storage } = await import('@ionic/storage');
      const storage = new Storage();
      await storage.create();
      const user = await storage.get('user');
      
      if (!user) {
        console.log('Redirecting to login, user not found');
        next('/login');
        return;
      }
      next();
    } catch (error) {
      console.error('Auth error:', error);
      next('/login');
    }
  } else {
    next();
  }
});

export default router;
