import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/system/user/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/system/user/Register.vue'),
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
        meta: { title: '仪表盘', icon: 'Odometer', requiresAuth: true }
      },
      {
        path: 'assets',
        name: 'Assets',
        component: () => import('@/views/asset/Index.vue'),
        meta: { title: '资产管理', icon: 'Box', requiresAuth: true }
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
        path: 'categories',
        name: 'Categories',
        component: () => import('@/views/category/Index.vue'),
        meta: { title: '分类管理', icon: 'Tags', requiresAuth: true }
      },
      {
        path: 'suppliers',
        name: 'Suppliers',
        component: () => import('@/views/supplier/Index.vue'),
        meta: { title: '供应商管理', icon: 'Truck', requiresAuth: true }
      },

      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/system/user/Index.vue'),
        meta: { title: '用户管理', icon: 'User', requiresAuth: true }
      },
      {
        path: 'roles',
        name: 'Roles',
        component: () => import('@/views/system/role/Index.vue'),
        meta: { title: '角色管理', icon: 'Lock', requiresAuth: true }
      },
      {
        path: 'departments',
        name: 'Departments',
        component: () => import('@/views/system/department/Index.vue'),
        meta: { title: '部门管理', icon: 'Organization', requiresAuth: true }
      },
      // {
      //   path: 'maintenance',
      //   name: 'Maintenance',
      //   component: () => import('@/views/asset/Maintenance.vue'),
      //   meta: { title: '维修管理', icon: 'Tools' }
      // },
      // {
      //   path: 'approval',
      //   name: 'Approval',
      //   component: () => import('@/views/system/Approval.vue'),
      //   meta: { title: '审批管理', icon: 'DocumentChecked' }
      // },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/system/user/Profile.vue'),
        meta: { title: '个人中心', hidden: true, requiresAuth: true }
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
