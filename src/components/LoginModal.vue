<template>
  <el-dialog
    v-model="visible"
    width="400px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
  >
    <template #header>
      <div class="dialog-title">
        <span v-if="tokenExists" class="logged-in-title">已登录</span>
        <span v-else>登录</span>
      </div>
    </template>
    <el-form :model="loginForm" :rules="rules" ref="loginFormRef" label-width="80px">
      <el-tabs v-model="activeTab" class="login-tabs">
        <el-tab-pane label="账密登录" name="credentials">
          <el-form-item label="用户名" prop="username">
            <el-input
              v-model="loginForm.username"
              placeholder="请输入用户名"
              clearable
              @keydown.enter="handleLogin"
            />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              show-password
              clearable
              @keydown.enter="handleLogin"
            />
          </el-form-item>
        </el-tab-pane>
        
        <el-tab-pane label="Token登录" name="token">
          <el-form-item label="Token" prop="token">
            <el-input
              v-model="loginForm.token"
              type="textarea"
              :rows="4"
              placeholder="请输入Token"
              clearable
              @keydown.enter="handleLogin"
            />
          </el-form-item>
        </el-tab-pane>
      </el-tabs>
    </el-form>
    
    <template #footer>
      <div class="dialog-footer">
        <div class="footer-left">
          <el-button type="danger" @click="handleClearToken" :disabled="loading">
            <el-icon><Delete /></el-icon> 清除Token
          </el-button>
        </div>
        <div class="footer-right">
          <el-button @click="handleCancel" :disabled="loading">取消</el-button>
          <el-button type="primary" @click="handleLogin" :loading="loading">
            {{ activeTab === 'credentials' ? '登录' : '设置Token' }}
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import { login } from '@/api/auth'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'login-success'])

// 响应式数据
const visible = ref(props.modelValue)
const activeTab = ref('credentials')
const loading = ref(false)
const loginFormRef = ref()

// 表单数据
const loginForm = reactive({
  username: '',
  password: '',
  token: ''
})

// 表单验证规则
const rules = computed(() => {
  if (activeTab.value === 'credentials') {
    return {
      username: [
        { required: true, message: '请输入用户名', trigger: 'blur' }
      ],
      password: [
        { required: true, message: '请输入密码', trigger: 'blur' }
      ]
    }
  } else {
    return {
      token: [
        { required: true, message: '请输入Token', trigger: 'blur' }
      ]
    }
  }
})

// 响应式的token存在状态
const tokenExists = ref(false)

// 获取当前token的函数
const getCurrentToken = () => {
  const pageToken = localStorage.getItem('recordPageToken')
  const publicToken = localStorage.getItem('workTimeToken')
  return pageToken || publicToken
}

// 检查并更新token状态，同时回显token
const updateTokenState = () => {
  const currentToken = getCurrentToken()
  tokenExists.value = !!currentToken
  
  // 回显token到表单
  if (currentToken) {
    loginForm.token = currentToken
  } else {
    loginForm.token = ''
  }
  
  return tokenExists.value
}

// 组件挂载时初始化
onMounted(() => {
  updateTokenState()
})

// 监听props变化
watch(() => props.modelValue, (newVal) => {
  visible.value = newVal
})

// 监听visible变化
watch(visible, (newVal) => {
  emit('update:modelValue', newVal)
  
  // 每次打开弹窗时检查token状态和回显
  if (newVal) {
    updateTokenState()
  }
})

// 账密登录API
const loginWithCredentials = async (username, password) => {
  try {
    const response = await login({
      userName: username,
      password: password
    })

    console.log('登录API响应:', response)

    if (response && response.data) {
      const { data } = response
      
      if (data.success && data.data && data.data.token) {
        return {
          success: true,
          token: data.data.token,
          userInfo: data.data
        }
      } else {
        throw new Error(data.message || '登录失败')
      }
    } else {
      throw new Error('登录响应格式错误')
    }
  } catch (error) {
    console.error('登录失败:', error)
    throw error
  }
}

// 处理登录
const handleLogin = async () => {
  if (!loginFormRef.value) return

  try {
    // 根据当前tab验证对应字段
    if (activeTab.value === 'credentials') {
      // 验证用户名和密码
      await loginFormRef.value.validateField(['username', 'password'])
    } else {
      // 验证token
      await loginFormRef.value.validateField(['token'])
    }
    
    loading.value = true

    if (activeTab.value === 'credentials') {
      // 账密登录
      const result = await loginWithCredentials(loginForm.username, loginForm.password)
      
      // 保存token和用户信息
      localStorage.setItem('workTimeToken', result.token)
      localStorage.setItem('workTimeUserInfo', JSON.stringify(result.userInfo))
      localStorage.setItem('workTimeCredentials', JSON.stringify({
        username: loginForm.username,
        password: loginForm.password
      }))
      
      ElMessage.success('登录成功')
      
    } else {
      // Token登录
      const token = loginForm.token.trim()
      if (!token) {
        ElMessage.error('请输入Token')
        return
      }
      
      // 直接保存token
      localStorage.setItem('workTimeToken', token)
      ElMessage.success('Token设置成功')
    }

    // 更新token状态
    updateTokenState()
    
    // 重置表单
    resetForm()
    
    // 关闭弹窗
    visible.value = false
    
    // 触发登录成功事件
    emit('login-success')
    
  } catch (error) {
    console.error('登录错误:', error)
    ElMessage.error(error.message || '登录失败')
  } finally {
    loading.value = false
  }
}

// 处理取消
const handleCancel = () => {
  resetForm()
  visible.value = false
}

// 重置表单
const resetForm = () => {
  if (loginFormRef.value) {
    loginFormRef.value.resetFields()
  }
  loginForm.username = ''
  loginForm.password = ''
  loginForm.token = ''
}

// 处理清除Token
const handleClearToken = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清除所有Token和登录信息吗？清除后需要重新登录。',
      '确认清除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    // 清除所有相关的本地存储
    localStorage.removeItem('workTimeToken')
    localStorage.removeItem('workTimeUserInfo')
    localStorage.removeItem('workTimeCredentials')
    localStorage.removeItem('recordPageToken')
    
    ElMessage.success('Token已清除')
    
    // 更新token状态
    updateTokenState()
    
    // 重置表单
    resetForm()
    
    // 关闭弹窗
    visible.value = false
    
  } catch (error) {
    // 用户取消操作
    if (error !== 'cancel') {
      console.error('清除Token失败:', error)
      ElMessage.error('清除Token失败')
    }
  }
}

// 切换tab时重置验证
watch(activeTab, () => {
  if (loginFormRef.value) {
    loginFormRef.value.clearValidate()
  }
})
</script>

<style scoped>
.dialog-title {
  font-size: 18px;
  font-weight: 600;
  color: #374151;
}

.logged-in-title {
  color: #10b981;
  font-weight: 700;
}

.login-tabs {
  margin-bottom: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-right {
  display: flex;
  gap: 10px;
}

:deep(.el-dialog__header) {
  background-color: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
}

:deep(.el-dialog__title) {
  color: #374151;
  font-weight: 600;
}

:deep(.el-tabs__item) {
  font-weight: 500;
}

:deep(.el-tabs__item.is-active) {
  color: #3b82f6;
}

:deep(.el-tabs__active-bar) {
  background-color: #3b82f6;
}
</style>