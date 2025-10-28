import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/user/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/user/Register.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/components/Layout/MainLayout.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/Index.vue'),
        meta: { title: '仪表盘', icon: 'Odometer' }
      },
      {
        path: 'assets',
        name: 'Assets',
        component: () => import('@/views/asset/Index.vue'),
        meta: { title: '资产管理', icon: 'Box' }
      },
      // {
      //   path: 'assets/create',
      //   name: 'AssetCreate',
      //   component: () => import('@/views/asset/Create.vue'),
      //   meta: { title: '新增资产', hidden: true }
      // },
      // {
      //   path: 'assets/edit/:id',
      //   name: 'AssetEdit',
      //   component: () => import('@/views/asset/Edit.vue'),
      //   meta: { title: '编辑资产', hidden: true }
      // },
      // {
      //   path: 'assets/detail/:id',
      //   name: 'AssetDetail',
      //   component: () => import('@/views/asset/Detail.vue'),
      //   meta: { title: '资产详情', hidden: true }
      // },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/user/Index.vue'),
        meta: { title: '用户管理', icon: 'User' }
      },
      {
        path: 'roles',
        name: 'Roles',
        component: () => import('@/views/system/Role.vue'),
        meta: { title: '角色管理', icon: 'Lock' }
      },
      {
        path: 'maintenance',
        name: 'Maintenance',
        component: () => import('@/views/asset/Maintenance.vue'),
        meta: { title: '维修管理', icon: 'Tools' }
      },
      {
        path: 'approval',
        name: 'Approval',
        component: () => import('@/views/system/Approval.vue'),
        meta: { title: '审批管理', icon: 'DocumentChecked' }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/user/Profile.vue'),
        meta: { title: '个人中心', hidden: true }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else {
    next()
  }
})

export default router
