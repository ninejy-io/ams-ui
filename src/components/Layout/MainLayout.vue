<template>
  <el-container class="layout-container">
    <el-aside width="200px">
      <div class="logo">
        <span>资产管理系统</span>
      </div>
      <el-menu
        router
        :default-active="$route.path"
        class="el-menu-vertical"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <el-menu-item index="/dashboard">
          <el-icon><Odometer /></el-icon>
          <span>仪表盘</span>
        </el-menu-item>

        <el-sub-menu index="asset">
          <template #title>
            <el-icon><Box /></el-icon>
            <span>资产管理</span>
          </template>
          <el-menu-item index="/assets">
            <el-icon><Memo /></el-icon>
            <span>资产列表</span>
          </el-menu-item>
          <el-menu-item index="/cloud-discovery">
            <el-icon><Cloudy /></el-icon>
            <span>云发现记录</span>
          </el-menu-item>
          <el-menu-item index="/scan">
            <el-icon><Search /></el-icon>
            <span>资产扫描记录</span>
          </el-menu-item>
        </el-sub-menu>

        <!-- <el-sub-menu index="asset-requests">
          <template #title>
            <el-icon><Search /></el-icon>
            <span>资产申请</span>
          </template>
          <el-menu-item index="/approvals">
            <el-icon><DocumentChecked /></el-icon>
            <span>待我审批</span>
          </el-menu-item>
          <el-menu-item index="/asset-requests">
            <el-icon><Document /></el-icon>
            <span>申请列表</span>
          </el-menu-item>
          <el-menu-item index="/asset-requests/my">
            <el-icon><DocumentCopy /></el-icon>
            <span>我的申请</span>
          </el-menu-item>
        </el-sub-menu> -->

        <el-menu-item index="/categories">
          <el-icon><List /></el-icon>
          <span>分类管理</span>
        </el-menu-item>

        <el-menu-item index="/suppliers">
          <el-icon><Grid /></el-icon>
          <span>供应商管理</span>
        </el-menu-item>

        <el-sub-menu index="system">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>系统管理</span>
          </template>
          <el-menu-item index="/system/users">
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
          <el-menu-item index="/system/roles">
            <el-icon><UserFilled /></el-icon>
            <span>角色管理</span>
          </el-menu-item>
          <el-menu-item index="/system/departments">
            <el-icon><Menu /></el-icon>
            <span>部门管理</span>
          </el-menu-item>
        </el-sub-menu>

      </el-menu>
    </el-aside>
    <el-container>
      <el-header>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="el-dropdown-link">
              {{ authStore.user?.realName || authStore.user?.username }}
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { useAuthStore } from '@/store/auth'
import { DocumentCopy } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const handleCommand = async (command) => {
  if (command === 'logout') {
    await authStore.logoutUser()
    router.push('/login')
  } else if (command === 'profile') {
    router.push('/profile')
  }
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}
.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background-color: #2b2f3a;
}
.el-header {
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}
.el-aside {
  background-color: #304156;
}
.el-menu-vertical {
  border-right: none;
}

/* use :deep(...) instead of ::v-deep */
/* ensure icons visible in both expanded and collapsed menu states */
/* :deep(.el-menu-vertical .el-icon),
:deep(.el-menu-vertical .el-menu-item > .el-icon),
:deep(.el-menu-vertical .el-submenu__title > .el-icon) {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  opacity: 1 !important;
  color: #bfcbd9 !important;
  width: 18px;
  margin-right: 8px;
} */

/* when menu is collapsed, center icon and remove right margin */
/* :deep(.el-menu--collapse .el-menu-item > .el-icon),
:deep(.el-menu--collapse .el-submenu__title > .el-icon),
:deep(.el-menu--collapse .el-menu-vertical .el-icon) {
  margin-right: 0 !important;
  width: 24px;
  justify-content: center !important;
} */

/* ensure submenu title icon stays visible */
/* :deep(.el-submenu__title .el-icon) {
  display: inline-flex !important;
  opacity: 1 !important;
} */
</style>
