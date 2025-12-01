<template>
  <div class="record-time-container">
    <!-- 安全检查加载状态 -->
    <div v-if="securityChecking" class="security-loading">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <p>正在进行安全验证...</p>
      </div>
    </div>
    
    <!-- IP检查失败时的显示 -->
    <div v-else-if="!securityPassed" class="security-failed">
      <div class="failed-content">
        <div class="failed-icon">🚫</div>
        <h1>访问受限</h1>
        <h2>IP地址未授权</h2>
        <p>抱歉，您的IP地址不在访问白名单中，无法访问此页面。</p>
        <el-button type="danger" @click="window.close()">关闭页面</el-button>
      </div>
    </div>
    
    <!-- 主要内容 - 只有通过安全检查后才显示 -->
    <div v-else-if="securityPassed" class="container">
      <div class="header">
        <h1>嘻嘻哈哈</h1>
      </div>
      
      <div class="task-info" v-if="taskId">
        <div class="task-id">任务ID: {{ taskId }}</div>
      </div>
      
      <!-- Token设置区域 -->
      <div class="token-setting">
        <div class="token-input-group">
          <span class="token-label">页面专用Token：</span>
          <el-input
            v-model="pageToken"
            placeholder="输入页面专用Token（可选，为空则使用公共Token）"
            style="width: 300px; margin-right: 10px;"
            clearable
            @keydown.enter="setPageToken"
          />
          <el-button type="primary" @click="setPageToken" size="small">
            设置Token
          </el-button>
        </div>
        <div class="token-status">
          <span>当前使用Token：{{ currentTokenType }}</span>
        </div>
      </div>
      
      <!-- 工时记录区域 -->
      <div class="content work-log-section">
        <div class="work-log-header-info">
          <h3>{{ taskId ? `TSK-${taskId}` : 'TSK-' }} 详情录入条件需求</h3>
          <div class="total-hours">总计时长: {{ totalHours.toFixed(1) }}h</div>
        </div>
        
        <!-- 统一工时记录表格 -->
        <div class="work-logs-section">
          <div class="section-header">
            <h4>工时记录</h4>
            <div class="header-actions">
              <!-- v-if="availableUsers.length === 0" -->
              <el-button
                type="primary"
                size="small"
                @click="fetchAllUsers"
                :loading="fetchingUsers"
                title="获取所有用户"
              >
                获取所有
              </el-button>
              <el-button 
                type="primary" 
                icon="Plus" 
                size="small"
                @click="addWorkLog"
              >
                添加记录
              </el-button>
            </div>
          </div>
          
          <el-table :data="workLogs" style="width: 100%" border v-if="workLogs.length > 0">
            <el-table-column label="日期" width="150">
              <template #default="scope">
                <el-date-picker
                  v-model="scope.row.workDate"
                  type="date"
                  placeholder="选择日期"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  size="small"
                  style="width: 100%"
                />
              </template>
            </el-table-column>
            <el-table-column label="记录人" width="200">
              <template #default="scope">
                <div style="display: flex; align-items: center; gap: 5px;">
                  <el-select
                    v-model="scope.row.userName"
                    placeholder="选择记录人"
                    size="small"
                    style="flex: 1;"
                    filterable
                    @change="(value) => handleUserChange(scope.row, value)"
                  >
                    <el-option
                      v-for="user in availableUsers"
                      :key="user.nickName"
                      :label="user.nickName"
                      :value="user.nickName"
                    />
                  </el-select>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="内容">
              <template #default="scope">
                <el-input
                  v-model="scope.row.content"
                  placeholder="请输入工作内容"
                  size="small"
                  type="textarea"
                  :rows="2"
                />
              </template>
            </el-table-column>
            <el-table-column label="工时(小时)" width="180">
              <template #default="scope">
                <div style="display: flex; gap: 5px; align-items: center;">
                  <el-input-number
                    v-model="scope.row.taskHour"
                    :min="0.01"
                    :step="0.5"
                    :precision="1"
                    size="small"
                    style="flex: 1;"
                  />
                  <el-button
                    size="small"
                    type="primary"
                    @click="calculateWorkHours(scope.row)"
                    title="自动计算工时"
                    style="padding: 5px 8px;"
                  >
                    计算
                  </el-button>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="scope">
                <el-button 
                  type="danger" 
                  size="small" 
                  circle
                  @click="removeWorkLog(scope.$index)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
        
        <div class="action-buttons">
          <el-button type="default" @click="resetForm">
            取消
          </el-button>
          <el-button 
            type="primary" 
            @click="saveWorkLogs"
            :loading="saveLoading"
            :disabled="workLogs.length === 0"
          >
            保存
          </el-button>
        </div>
      </div>
    </div>
    
    <!-- 加载遮罩 -->
    <div v-loading="pageLoading" class="loading-overlay" element-loading-text="加载中..." v-if="pageLoading">
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import { getWorkLogsByTaskId, addOrUpdateWorkLogs, getChargeUserList } from '@/api/worklog'
import { getUrlParams } from '@/utils/common'
import { initSecurity } from '@/utils/security'
import { useRouter, useRoute  } from 'vue-router'
// 获取路由实例
const router = useRouter()
const route = useRoute()

// 响应式数据
const taskId = ref('')
const pageLoading = ref(false)
const saveLoading = ref(false)
const pageToken = ref('')
const fetchingUsers = ref(false)
const securityChecking = ref(true)  // 安全检查状态
const securityPassed = ref(false)   // 安全检查是否通过

const workLogs = ref([])

// 可选择的用户列表
const availableUsers = ref([])

// 计算总工时
const totalHours = computed(() => {
  return workLogs.value.reduce((sum, log) => sum + (log.taskHour || 0), 0)
})

// 计算当前使用的Token类型
const currentTokenType = computed(() => {
  const pageTokenValue = localStorage.getItem('recordPageToken')
  const publicToken = localStorage.getItem('workTimeToken')
  
  if (pageTokenValue) {
    return '页面专用Token'
  } else if (publicToken) {
    return '公共Token'
  } else {
    return '未设置Token'
  }
})

// 获取当前有效的Token
const getCurrentToken = () => {
  const pageTokenValue = localStorage.getItem('recordPageToken')
  const publicToken = localStorage.getItem('workTimeToken')
  
  return pageTokenValue || publicToken
}

// 方法
const setPageToken = () => {
  if (pageToken.value.trim()) {
    localStorage.setItem('recordPageToken', pageToken.value.trim())
    ElMessage.success('页面专用Token设置成功')
  } else {
    localStorage.removeItem('recordPageToken')
    ElMessage.success('已清除页面专用Token，将使用公共Token')
  }
  pageToken.value = ''
}

const loadWorkLogs = async () => {
  if (!taskId.value) return
  
  const token = getCurrentToken()
  if (!token) {
    ElMessage.warning('Token未设置，请先设置Token')
    return
  }
  
  try {
    pageLoading.value = true
    
    const response = await getWorkLogsByTaskId(taskId.value)
    
    if (response && response.data) {
      if (response.data.code === 200 && Array.isArray(response.data.data)) {
        workLogs.value = response.data.data.map(log => ({
          taskHour: log.taskHour || 0,
          workDate: log.workDate || new Date().toISOString().split('T')[0],
          content: log.content || '',
          userId: log.userId,
          userName: log.userName
        }))
        
        // 提取可用用户列表（去重）
        const uniqueUsers = []
        const userMap = new Map()
        response.data.data.forEach(log => {
          if (log.userName && !userMap.has(log.userName)) {
            userMap.set(log.userName, {
              userName: log.userName,
              nickName: log.nickName || log.userName,
              userId: log.userId
            })
            uniqueUsers.push(userMap.get(log.userName))
          }
        })
        
        availableUsers.value = uniqueUsers
      } else {
        workLogs.value = []
        // 如果没有数据，保持默认用户列表
      }
    } else {
      workLogs.value = []
    }
  } catch (error) {
    console.error('加载工时数据错误:', error)
    ElMessage.warning('加载工时数据失败，将创建新记录')
    workLogs.value = []
  } finally {
    pageLoading.value = false
  }
}

const fetchAllUsers = async () => {
  const token = getCurrentToken()
  if (!token) {
    ElMessage.warning('Token未设置，请先设置Token')
    return
  }
  
  try {
    fetchingUsers.value = true
    const response = await getChargeUserList()
    
    if (response && response.data) {
      if (response.data.code === 200 && Array.isArray(response.data.data)) {
        // 转换数据格式
        const users = response.data.data.map(user => ({
          userName: user.nickName || user.userName,
          nickName: user.nickName || user.userName,
          userId: user.id
        }))
        
        availableUsers.value = users
        ElMessage.success(`成功获取${users.length}个用户`)
      } else {
        ElMessage.error('获取用户列表失败：' + (response.data.message || '数据格式错误'))
      }
    }
  } catch (error) {
    console.error('获取用户列表错误:', error)
    ElMessage.error('获取用户列表失败：' + (error.response?.data?.message || '网络错误'))
  } finally {
    fetchingUsers.value = false
  }
}

const handleUserChange = (row, userName) => {
  // 根据选择的用户名找到对应的用户ID
  const selectedUser = availableUsers.value.find(user => user.userName === userName)
  if (selectedUser) {
    row.userId = selectedUser.userId
  } else {
    // 如果是手动输入的新用户名，userId设为null
    row.userId = null
  }
}

// 自动计算工时函数
const calculateWorkHours = (workLog) => {
  const now = new Date()
  const today = new Date()
  
  // 设置下午5:30的时间
  const fiveThirtyPM = new Date(today)
  fiveThirtyPM.setHours(17, 30, 0, 0)
  
  // 计算当前时间与下午5:30的时间差（小时）
  const timeDiffMs = now.getTime() - fiveThirtyPM.getTime()
  const timeDiffHours = timeDiffMs / (1000 * 60 * 60)
  
  // 如果当前时间早于下午5:30，提示用户
  if (timeDiffHours < 0) {
    ElMessage.warning('当前时间早于下午5:30，无法计算加班工时')
    return
  }
  
  // 计算总工时：基础7.5小时 + 加班时间
  const totalHours = 7.5 + timeDiffHours
  
  // 保留一位小数
  workLog.taskHour = Math.round(totalHours * 10) / 10
  
  ElMessage.success(`已自动计算工时：${workLog.taskHour}小时（基础7.5h + 加班${Math.round(timeDiffHours * 10) / 10}h）`)
}

const addWorkLog = () => {
  const defaultUser = availableUsers.value[0]
  workLogs.value.push({
    // id: null,
    taskHour: 7.5,
    workDate: new Date().toISOString().split('T')[0],
    content: '',
    userId: defaultUser?.userId || null,
    userName: defaultUser?.userName || null
  })
}

const removeWorkLog = (index) => {
  workLogs.value.splice(index, 1)
}

const resetForm = () => {
  loadWorkLogs()
}

const saveWorkLogs = async () => {
  const token = getCurrentToken()
  if (!token) {
    ElMessage.warning('Token未设置，请先设置Token')
    return
  }
  
  if (workLogs.value.length === 0) {
    ElMessage.warning('请先添加工时记录')
    return
  }
  
  // 验证数据
  for (let i = 0; i < workLogs.value.length; i++) {
    const log = workLogs.value[i]
    if (!log.workDate) {
      ElMessage.error(`第${i + 1}条记录的工作日期不能为空`)
      return
    }
    if (!log.taskHour || log.taskHour <= 0) {
      ElMessage.error(`第${i + 1}条记录的工时必须大于0`)
      return
    }
    if (!log.content.trim()) {
      ElMessage.error(`第${i + 1}条记录的工作内容不能为空`)
      return
    }
    if (!log.userName) {
      ElMessage.error(`第${i + 1}条记录的记录人不能为空`)
      return
    }
  }
  
  try {
    saveLoading.value = true
    
    const saveData = workLogs.value.map(log => ({
      taskHour: log.taskHour,
      workDate: log.workDate,
      content: log.content,
      userId: log.userId,
      userName: log.userName
    }))
    
    const response = await addOrUpdateWorkLogs(taskId.value, saveData)
    
    if (response && (response.data?.success || response.status === 200)) {
      ElMessage.success('工时记录保存成功')
      await loadWorkLogs()
    } else {
      ElMessage.error('保存失败：' + (response.data?.message || '未知错误'))
    }
  } catch (error) {
    console.error('保存工时记录错误:', error)
    ElMessage.error('保存失败：' + (error.response?.data?.message || '网络错误'))
  } finally {
    saveLoading.value = false
  }
}

// 页面初始化
onMounted(async () => {
  try {
    // 初始化安全检查 - recordTime页面需要严格的IP白名单验证
    const securityResult = await initSecurity({
      enableIPCheck: true,
      enableDevToolsDisable: true,
      show404OnFail: false  // 不直接显示404，由Vue控制
    })
    
    // 更新安全检查状态
    securityChecking.value = false
    securityPassed.value = securityResult
    
    // 如果安全检查通过，初始化页面数据
    if (securityResult) {
      // const params = getUrlParams()
      const params = route.query
      taskId.value = params.taskId
      
      // 如果有taskId，尝试加载工时数据
      if (taskId.value) {
        loadWorkLogs()
      }
    }
  } catch (error) {
    console.error('安全检查失败:', error)
    securityChecking.value = false
    securityPassed.value = false
  }
})
</script>

<style scoped>
.record-time-container {
  min-height: 100vh;
  padding: 20px;
  background: #F0F4F9;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.header {
  background: #171C1F;
  color: white;
  padding: 20px;
  text-align: center;
}

.header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.task-info {
  background: #f8f9fa;
  padding: 15px 20px;
  border-bottom: 1px solid #e9ecef;
}

.task-info .task-id {
  font-weight: 600;
  color: #495057;
  font-size: 16px;
}

.token-setting {
  background: #f8f9fa;
  padding: 15px 20px;
  border-bottom: 1px solid #e9ecef;
}

.token-input-group {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.token-label {
  font-weight: 500;
  color: #495057;
  margin-right: 10px;
  white-space: nowrap;
}

.token-status {
  font-size: 14px;
  color: #6c757d;
}

.content {
  padding: 20px;
}

.user-info {
  background: #f8f9fa;
  padding: 10px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.user-welcome {
  color: #495057;
  font-weight: 500;
  font-size: 14px;
  display: flex;
  align-items: center;
}

.work-log-header-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.work-log-header-info h3 {
  margin: 0;
  color: #495057;
  font-size: 18px;
}

.total-hours {
  color: #007bff;
  font-weight: 600;
  font-size: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding: 10px 0;
}

.section-header h4 {
  margin: 0;
  color: #495057;
  font-size: 16px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e9ecef;
}

.login-form {
  max-width: 400px;
  margin: 0 auto;
}

.remember-password {
  text-align: left;
  margin-top: 10px;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

/* 安全检查加载样式 */
.security-loading {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background: #f5f5f5;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
}

.loading-content {
  text-align: center;
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e9ecef;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-content p {
  margin: 0;
  color: #495057;
  font-size: 16px;
  font-weight: 500;
}

/* 安全检查失败样式 */
.security-failed {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background: #f5f5f5;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
}

.failed-content {
  text-align: center;
  background: white;
  padding: 60px 40px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  max-width: 500px;
}

.failed-icon {
  font-size: 72px;
  margin-bottom: 20px;
}

.failed-content h1 {
  font-size: 32px;
  color: #e74c3c;
  margin: 0 0 10px 0;
  font-weight: 700;
}

.failed-content h2 {
  font-size: 20px;
  color: #2c3e50;
  margin: 0 0 15px 0;
  font-weight: 600;
}

.failed-content p {
  font-size: 16px;
  color: #7f8c8d;
  margin: 0 0 30px 0;
  line-height: 1.6;
}
</style>