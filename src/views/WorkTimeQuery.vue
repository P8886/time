<template>
  <div class="container">
    <!-- 控制面板 -->
    <div class="controls">
      <div class="control-group">
        <span class="control-label">时间范围：</span>
        <el-date-picker
          v-model="timeRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          style="width: 300px;"
        />
      </div>
      
      <!-- 跨月时显示bug数据查询月份选择 -->
      <!-- <div class="control-group" v-if="isCrossMonth"> -->
        <!-- <span class="control-label">Bug数据查询月份：</span> -->
        <!-- <el-date-picker -->
          <!-- v-model="bugMonth" -->
          <!-- type="month" -->
          <!-- placeholder="选择月份" -->
          <!-- format="YYYY-MM" -->
          <!-- value-format="YYYY-MM" -->
          <!-- style="width: 200px;" -->
        <!-- /> -->
      <!-- </div> -->
      
      <el-button type="primary" @click="fetchWorkLogs" :loading="loading">
        <el-icon><Search /></el-icon> 查询
      </el-button>
      
      <el-button 
        type="warning" 
        @click="toggleFilter" 
        :loading="loading"
        :disabled="!hasQueryData"
      >
        <el-icon><Filter /></el-icon> 
        {{ isFilterMode ? '取消过滤' : '过滤测试' }}
      </el-button>

      <el-button 
        @click="toggleOptimizationBugFilter"
        :disabled="!hasQueryData"
        :loading="bugLoading"
      >
        <el-icon><Filter /></el-icon> 
        {{ isFilterOptimizationBugs ? '取消过滤优化bug' : '过滤优化bug' }}
      </el-button>
      
      <!-- 缓存管理组件 -->
      <CacheManager 
        :has-data="hasQueryData"
        :loading="loading"
        :cache-data="{
          timeRange: timeRange,
          rawData: originalData,
          bugData: bugData,
          bugMonth: bugMonth
        }"
        @load-cache="handleLoadCache"
      />
      
      <!-- Token管理 -->
      <!-- <div class="control-group">
        <el-input
          v-model="manualToken"
          placeholder="输入Token"
          style="width: 200px; margin-right: 10px;"
          clearable
          @keydown.enter="setManualToken"
        />
        <el-button type="info" @click="setManualToken" :disabled="!manualToken.trim()">
          设置Token
        </el-button>
      </div>
      
      <el-button type="success" @click="refreshToken" :loading="tokenLoading">
        <el-icon><Refresh /></el-icon> 刷新Token
      </el-button> -->

      <!-- 登录管理按钮 -->
      <el-button type="info" @click="showLoginModal = true">
        <el-icon><User /></el-icon> 登录管理
      </el-button>
      
    </div>
    
    <!-- 统计卡片 -->
    <div class="stats">
      <div class="stat-card">
        <div class="stat-label">目前应出勤工时</div>
        <div class="stat-value">{{ expectedWorkHours }}h</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">当月折合应出勤天数</div>
        <div class="stat-value">{{ expectedMonthWorkDays }}天</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">目前应出勤天数</div>
        <div class="stat-value">{{ expectedWorkDays }}天</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">目前折合应出勤天数</div>
        <div class="stat-value">{{ expectedEquivalentDays }}天</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">总用户数</div>
        <div class="stat-value">{{ stats.totalUsers }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">平均工时</div>
        <div class="stat-value">{{ stats.avgWorkTime }}h</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">总工时</div>
        <div class="stat-value">{{ stats.totalWorkTime.toFixed(2) }}h</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">总bug数</div>
        <div class="stat-value">{{ stats.totalBugCount }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">总bug率</div>
        <div class="stat-value">{{ isFilterMode ? stats.totalBugRate.toFixed(2) + '%' : '-' }}</div>
      </div>
    </div>
    
    <!-- 数据表格 -->
    <div class="table-container">
      <div class="table-header">
        <div class="total-users">
          共 <span 
            class="highlight" 
            @mousedown="handleUserCountClick"
          >{{ aggregatedUsers.length }}</span> 位用户
          <span style="margin-left: 20px;">
            共 <span style="color: #e74c3c;" @mousedown="handleTestSalaryClick">{{ highBugRateUsersCount }}</span> 位遇难者
          </span>
          <span style="margin-left: 20px;">
            产线bug权重: 
            <el-input-number 
              v-model="productionBugWeight" 
              :min="1" 
              :max="20" 
              size="small" 
              style="width: 80px;"
              @change="updateStats"
            />
          </span>
        </div>
        <div>数据更新时间: {{ lastUpdate }}</div>
      </div>
      
      <el-table 
        :data="aggregatedUsers" 
        style="width: 100%"
        v-loading="loading"
        :default-sort="{ prop: 'totalHours', order: 'descending' }"
        stripe
        :header-cell-style="{ background: '#f8fafc', color: '#374151', fontWeight: '600' }"
      >
        <el-table-column type="index" label="序号" width="80" align="center"></el-table-column>
        <el-table-column prop="userName" label="用户姓名" width="180" sortable>
          <template #default="scope">
            <div style="display: flex; align-items: center; cursor: pointer;" @click="copyUserId(scope.row.userId)" title="点击复制用户ID">
              <el-avatar :size="32" style="margin-right: 10px; background: #3b82f6;">
                {{ scope.row.userName ? scope.row.userName.charAt(0) : '?' }}
              </el-avatar>
              <span style="font-weight: 500;">{{ scope.row.userName || '未知用户' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="bugCount" label="bug数" sortable>
          <template #default="scope">
            <el-tag :type="scope.row.bugCount === 0 ? 'success' : 'warning'" size="small">{{ scope.row.bugCount }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="bugRate" label="bug率" width="120" sortable>
          <template #default="scope">
            <span :style="{ color: getBugRateColor(scope.row.bugRate), fontWeight: '500' }">{{ scope.row.bugRate.toFixed(2) }}%</span>
          </template>
        </el-table-column>
        <el-table-column prop="hasProductionBug" label="有无产线bug" width="150" sortable>
          <template #default="scope">
            <el-tag :type="scope.row.hasProductionBug ? 'danger' : 'success'" size="small">
              {{ scope.row.hasProductionBug ? '有' : '无' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="totalHours" label="总工时" sortable>
          <template #default="scope">
            <el-tag :type="getWorkTimeTagType(scope.row.totalHours)" size="large">
              {{ scope.row.totalHours.toFixed(1) }}h
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="workDays" label="登记天数" sortable>
          <template #default="scope">
            <span :style="{ color: getWorkDaysColor(scope.row.workDays)}">{{ scope.row.workDays }}天</span>
          </template>
        </el-table-column>
        <el-table-column prop="equivalentWorkDays" label="折合登记天数" width="150" sortable>
          <template #default="scope">
            <span :style="{ color: getEquivalentWorkDaysColor(scope.row.equivalentWorkDays)}">{{ scope.row.equivalentWorkDays }}天</span>
          </template>
        </el-table-column>
        <el-table-column prop="avgDailyHours" label="日均工时" sortable>
          <template #default="scope">
            <span style="color: #6366f1; font-weight: 500;">{{ scope.row.avgDailyHours.toFixed(1) }}h</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="200" align="center">
          <template #default="scope">
            <el-button type="primary" size="small" @click="showDetail(scope.row)" round>
              <el-icon style="margin-right: 4px;"><View /></el-icon>
              详情
            </el-button>
            <el-button type="warning" size="small" @click="showBugDetail(scope.row)" round style="margin-left: 5px;">
              <el-icon style="margin-right: 4px;"><Warning /></el-icon>
              bug详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div v-if="!loading && aggregatedUsers.length === 0" class="no-data">
        <el-icon style="font-size: 48px; color: #bdc3c7;">
          <DocumentRemove />
        </el-icon>
        <p style="margin-top: 15px;">没有找到工时数据</p>
      </div>
    </div>
    
    <!-- 详情弹窗 -->
    <WorkTimeDetail
      v-model:visible="detailVisible"
      :user="currentUser"
      @update-checked-hours="updateCheckedHours"
    />

    <!-- Bug详情弹窗 -->
    <BugDetail
      v-model:visible="bugDetailVisible"
      :user="currentUser"
      :bugs="currentUserBugs"
      :loading="bugLoading"
    />
    
    <!-- 登录弹窗 -->
    <LoginModal
      v-model="showLoginModal"
      @login-success="handleLoginSuccess"
    />
    
    <footer class="page-footer">
      <p>© 2025 333 | 数据更新时间: {{ lastUpdate }}</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, Filter, View, Warning, DocumentRemove, Refresh, User } from '@element-plus/icons-vue'
import { getWorkLogs, getBugData } from '@/api/worklog'
import { refreshToken as refreshTokenAPI } from '@/api/auth'
import { getCurrentMonthRange, getCurrentTime, calculateExpectedWorkHours, getTaskNameColor, copyToClipboard } from '@/utils/common'
import { initSecurity } from '@/utils/security'
import WorkTimeDetail from '@/components/WorkTimeDetail.vue'
import BugDetail from '@/components/BugDetail.vue'
import CacheManager from '@/components/CacheManager.vue'
import LoginModal from '@/components/LoginModal.vue'
import moment from 'moment'

const router = useRouter()

// 响应式数据
const timeRange = ref(getCurrentMonthRange())
const loading = ref(false)
const lastUpdate = ref('')
const rawData = ref([])
const detailVisible = ref(false)
const currentUser = ref({ userName: '', details: [] })
const bugDetailVisible = ref(false)
const currentUserBugs = ref([])
const bugLoading = ref(false)
const bugMonth = ref('')
const bugData = ref([])
const originalBugData = ref([]) // 存储原始bug数据，避免重复请求
const isFilterMode = ref(false)
const filteredUsers = ref(['彭文韬', '曹阳', '王俐', '李丽', '梁巍', '李汀岚', '李嘉', '鲁玮', '吁茂林'])
const originalData = ref([]) // 存储原始查询数据
const hasQueryData = ref(false) // 标记是否已有查询数据
const isFilterOptimizationBugs = ref(true) // 控制是否过滤优化bug（bugType==3和bugType==4），默认为true（过滤）
const manualToken = ref('')
const tokenLoading = ref(false)
const showLoginModal = ref(false) // 控制登录弹窗显示

// 统计数据
const stats = reactive({
  totalUsers: 0,
  avgWorkTime: 0,
  totalWorkTime: 0,
  totalBugCount: 0,
  totalBugRate: 0
})

// 计算属性
const expectedWorkHours = ref(0)
const expectedWorkDays = ref(0)
const expectedEquivalentDays = ref(0)
const expectedMonthWorkDays = ref(0)
const productionBugWeight = ref(5) // 产线bug权重，默认值为5

// 判断是否跨月
const isCrossMonth = computed(() => {
  if (!timeRange.value || timeRange.value.length !== 2) {
    return false
  }
  const startDate = new Date(timeRange.value[0])
  const endDate = new Date(timeRange.value[1])
  const startMonth = startDate.getFullYear() + '-' + String(startDate.getMonth() + 1).padStart(2, '0')
  const endMonth = endDate.getFullYear() + '-' + String(endDate.getMonth() + 1).padStart(2, '0')
  return startMonth !== endMonth
})

// 聚合用户数据
const aggregatedUsers = computed(() => {
  const userMap = new Map()
  
  rawData.value.forEach(record => {
    const userId = record.userId || record.id
    const userName = record.userName || record.name || record.user || '未知用户'
    const taskHour = parseFloat(record.taskHour || record.hours || 0)
    const workDate = record.workDate || record.date
    const issueWorkLogs = record.issueWorkLogs || []
    
    if (!userId) {
      console.warn('记录缺少用户ID:', record)
      return
    }
    
    // 如果是过滤模式，跳过指定的用户
    if (isFilterMode.value && filteredUsers.value.includes(userName)) {
      return
    }
    
    if (!userMap.has(userId)) {
      userMap.set(userId, {
        userId,
        userName,
        totalHours: 0,
        workDays: 0,
        equivalentWorkDays: 0,
        details: [],
        dateMap: new Map()
      })
    }
    
    const user = userMap.get(userId)
    user.totalHours += taskHour
    
    // 按日期聚合
    if (workDate) {
      if (!user.dateMap.has(workDate)) {
        user.dateMap.set(workDate, {
          workDate,
          taskHour: 0,
          taskCount: 0,
          issueWorkLogs: []
        })
        user.workDays++
        
        // 计算折合登记天数
        const date = new Date(workDate)
        const dayOfWeek = date.getDay()
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
          user.equivalentWorkDays += 1
        } else if (dayOfWeek === 6) {
          user.equivalentWorkDays += 0.5
        } else if (dayOfWeek === 0) {
          user.equivalentWorkDays += 1
        }
      }
      
      const dayData = user.dateMap.get(workDate)
      dayData.taskHour += taskHour
      dayData.taskCount += issueWorkLogs.length
      
      // 处理工作日志
      issueWorkLogs.forEach(log => {
        dayData.issueWorkLogs.push({
          taskName: log.taskName || log.title || log.name || '未知任务',
          taskHour: parseFloat(log.taskHour || log.hours || 0),
          content: log.content || log.description || log.remark || '无',
          taskId: log.taskId || '未知Id'
        })
      })
    }
  })
  
  // 转换为数组并计算平均值
  const result = Array.from(userMap.values()).map(user => {
    user.details = Array.from(user.dateMap.values()).sort((a, b) => new Date(b.workDate) - new Date(a.workDate))
    user.avgDailyHours = user.workDays > 0 ? user.totalHours / user.workDays : 0
    user.equivalentWorkDays = parseFloat(user.equivalentWorkDays.toFixed(1))
    
    // 计算用户的bug数量和bug率
    const userBugs = bugData.value.filter(bug => bug.resolveName === user.userName)
    user.bugCount = userBugs.reduce((total, bug) => {
      return total + (bug.bugEnvironmentDesc === "产线" ? productionBugWeight.value : 1)
    }, 0)
    user.bugRate = user.totalHours > 0 ? parseFloat(((user.bugCount / user.totalHours) * 100).toFixed(2)) : 0
    
    // 判断是否有产线bug
    user.hasProductionBug = userBugs.some(bug => bug.bugEnvironmentDesc === "产线")
    
    delete user.dateMap
    return user
  })
  
  return result.sort((a, b) => b.totalHours - a.totalHours)
})

// 计算bug率高于总bug率的用户数量
const highBugRateUsersCount = computed(() => {
  const users = aggregatedUsers.value
  if (users.length === 0 || !isFilterMode.value) return 0
  return users.filter(user => user.bugRate > stats.totalBugRate).length
})

// 处理从缓存加载数据
const handleLoadCache = (cacheItem) => {
  try {
    // 恢复查询参数
    timeRange.value = cacheItem.timeRange
    bugMonth.value = cacheItem.bugMonth || ''
    
    // 恢复数据
    rawData.value = [...cacheItem.rawData]
    originalData.value = [...cacheItem.rawData]
    bugData.value = [...cacheItem.bugData]
    
    // 更新状态
    hasQueryData.value = true
    isFilterMode.value = false
    lastUpdate.value = cacheItem.saveTime
    
    // 重新计算统计数据
    updateStats()
  } catch (error) {
    console.error('加载缓存数据失败:', error)
    ElMessage.error('加载缓存数据失败')
  }
}

// 方法
const fetchWorkLogs = async () => {
  isFilterMode.value = false
  const success = await loadWorkLogs()
  if (success) {
    // 保存原始数据
    originalData.value = [...rawData.value]
    hasQueryData.value = true
  }
}

const toggleFilter = () => {
  if (isFilterMode.value) {
    // 取消过滤，恢复原始数据
    isFilterMode.value = false
    rawData.value = [...originalData.value]
    // 重新计算统计数据
    updateStats()
    ElMessage.success('已取消过滤，显示全部数据')
  } else {
    // 应用过滤，基于原始数据进行本地过滤
    isFilterMode.value = true
    rawData.value = originalData.value.filter(item => 
      !filteredUsers.value.includes(item.userName)
    )
    // 重新计算统计数据
    updateStats()
    ElMessage.success('过滤完成，已过滤指定用户')
  }
}

const toggleOptimizationBugFilter = async () => {
  // 如果没有原始数据，则需要重新获取
  if (originalBugData.value.length === 0) {
    bugLoading.value = true
    try {
      // 切换过滤状态
      isFilterOptimizationBugs.value = !isFilterOptimizationBugs.value
      
      // 重新获取bug数据
      await fetchBugData()
      
      // 显示提示信息
      if (isFilterOptimizationBugs.value) {
        ElMessage.success('已开启过滤优化bug，隐藏设计缺陷和优化需求')
      } else {
        ElMessage.success('已取消过滤优化bug，显示所有bug类型')
      }
    } finally {
      bugLoading.value = false
    }
  } else {
    // 有原始数据，直接本地过滤，速度更快
    isFilterOptimizationBugs.value = !isFilterOptimizationBugs.value
    
    if (isFilterOptimizationBugs.value) {
      // 过滤优化bug
      bugData.value = originalBugData.value.filter(bug => bug.bugType !== 3 && bug.bugType !== 4)
      ElMessage.success('已开启过滤优化bug，隐藏设计缺陷和优化需求')
    } else {
      // 显示所有bug
      bugData.value = [...originalBugData.value]
      ElMessage.success('已取消过滤优化bug，显示所有bug类型')
    }
    
    // 重新计算统计数据
    updateStats()
  }
}

const loadWorkLogs = async () => {
  if (!timeRange.value || !timeRange.value[0] || !timeRange.value[1]) {
    ElMessage.warning('请选择时间范围')
    return false
  }
  
  loading.value = true
  
  try {
    // 检查token
    // const token = localStorage.getItem('workTimeToken')
    // console.log('当前Token:', token ? '已设置' : '未设置')
    
    // if (!token) {
    //   ElMessage.warning('Token不存在，请先设置Token')
    //   loading.value = false
    //   return false
    // }
    
    console.log('开始请求工时数据，时间范围:', timeRange.value)
    
    const response = await getWorkLogs({
      startTime: timeRange.value[0],
      endTime: timeRange.value[1]
    })
    
    console.log('API响应:', response)
    console.log('响应数据:', response?.data)
    
    // 更健壮的响应处理
    if (response && response.data) {
      if (response.data.success && response.data.data && response.data.data.records) {
        rawData.value = response.data.data.records
        lastUpdate.value = getCurrentTime()
        updateStats()
        // 获取工作日志后，同时获取bug数据
        await fetchBugData()
        ElMessage.success(`获取到 ${response.data.data.records.length} 条工时记录`)
        return true
      } else if (response.data.code === 200 && response.data.data) {
        // 处理另一种响应格式
        const records = Array.isArray(response.data.data) ? response.data.data : response.data.data.records || []
        rawData.value = records
        lastUpdate.value = getCurrentTime()
        updateStats()
        await fetchBugData()
        ElMessage.success(`获取到 ${records.length} 条工时记录`)
        return true
      } else {
        throw new Error('获取数据失败: ' + (response.data.message || response.data.msg || '未知错误'))
      }
    } else {
      throw new Error('响应数据格式错误')
    }
  } catch (error) {
    console.error('获取数据失败:', error)
    ElMessage.error('获取数据失败: ' + error.message)
    return false
  } finally {
    loading.value = false
  }
}

const fetchBugData = async () => {
  try {
    let queryMonth = null
    let allBugData = [] // 存储所有原始bug数据
    
    if (isCrossMonth.value) {
      // 跨月查询：不传月份参数，查询所有Bug数据
      console.log('跨月查询，获取所有Bug数据')
      const response = await getBugData() // 不传月份参数
      
      if (response && response.data) {
        let allRecords = []
        if (response.data.success && response.data.data) {
          allRecords = response.data.data.records || response.data.data || []
        } else if (response.data.code === 200 && response.data.data) {
          allRecords = Array.isArray(response.data.data) ? response.data.data : response.data.data.records || []
        }
        
        // 根据时间范围过滤belongingMonth字段
        const startMonth = moment(timeRange.value[0]).format('YYYY-MM')
        const endMonth = moment(timeRange.value[1]).format('YYYY-MM')
        
        // 生成时间范围内的所有月份
        const monthsInRange = []
        let currentMonth = moment(startMonth)
        const lastMonth = moment(endMonth)
        
        while (currentMonth.isSameOrBefore(lastMonth, 'month')) {
          monthsInRange.push(currentMonth.format('YYYY-MM'))
          currentMonth.add(1, 'month')
        }
        
        console.log('查询月份范围:', monthsInRange)
        
        // 根据belongingMonth字段过滤Bug数据，保存所有原始数据
        allBugData = allRecords.filter(bug => {
          return bug.belongingMonth && monthsInRange.includes(bug.belongingMonth)
        })
        
        console.log(`跨月查询：从所有Bug中过滤出 ${allBugData.length} 条记录`)
      }
    } else {
      // 非跨月查询：使用原有逻辑
      const startDate = new Date(timeRange.value[0])
      queryMonth = bugMonth.value || (startDate.getFullYear() + '-' + String(startDate.getMonth() + 1).padStart(2, '0'))
      console.log('单月查询，查询月份:', queryMonth)
      
      const response = await getBugData(queryMonth)
      if (response && response.data) {
        if (response.data.success && response.data.data) {
          allBugData = response.data.data.records || response.data.data || []
        } else if (response.data.code === 200 && response.data.data) {
          allBugData = Array.isArray(response.data.data) ? response.data.data : response.data.data.records || []
        }
      }
    }
    
    // 保存原始数据
    originalBugData.value = [...allBugData]
    
    // 根据当前过滤状态设置显示数据
    if (isFilterOptimizationBugs.value) {
      bugData.value = allBugData.filter(bug => bug.bugType !== 3 && bug.bugType !== 4)
    } else {
      bugData.value = [...allBugData]
    }
    
    console.log(`最终获取到 ${bugData.value.length} 条bug记录`)
    updateStats()
    
  } catch (error) {
    console.error('获取bug数据失败:', error)
    bugData.value = []
    originalBugData.value = []
  }
}

const updateStats = () => {
  const users = aggregatedUsers.value
  stats.totalUsers = users.length
  
  if (users.length > 0) {
    stats.totalWorkTime = users.reduce((sum, user) => sum + user.totalHours, 0)
    stats.avgWorkTime = parseFloat((stats.totalWorkTime / users.length).toFixed(1))
    
    stats.totalBugCount = bugData.value.reduce((total, bug) => {
      return total + (bug.bugEnvironmentDesc === "产线" ? productionBugWeight.value : 1)
    }, 0)
    stats.totalBugRate = stats.totalWorkTime > 0 ? parseFloat(((stats.totalBugCount / stats.totalWorkTime) * 100).toFixed(2)) : 0
  } else {
    stats.totalWorkTime = 0
    stats.avgWorkTime = 0
    stats.totalBugCount = 0
    stats.totalBugRate = 0
  }
}

const getWorkTimeTagType = (hours) => {
  return hours >= stats.avgWorkTime ? 'success' : 'danger'
}

const getBugRateColor = (bugRate) => {
  if (!isFilterMode.value) return '#6c757d'
  return bugRate <= stats.totalBugRate ? '#2ecc71' : '#e74c3c'
}

const getWorkDaysColor = (workDays) => {
  const users = aggregatedUsers.value
  if (users.length === 0) return '#2ecc71'
  
  const avgWorkDays = users.reduce((sum, user) => sum + user.workDays, 0) / users.length
  return workDays < avgWorkDays - 1 ? '#f39c12' : '#2ecc71'
}

const getEquivalentWorkDaysColor = (equivalentWorkDays) => {
  const users = aggregatedUsers.value
  if (users.length === 0) return '#2ecc71'
  
  const avgEquivalentWorkDays = users.reduce((sum, user) => sum + user.equivalentWorkDays, 0) / users.length
  return equivalentWorkDays < avgEquivalentWorkDays - 1 ? '#f39c12' : '#2ecc71'
}

const showDetail = (user) => {
  currentUser.value = user
  detailVisible.value = true
}

const showBugDetail = (user) => {
  currentUser.value = user
  bugLoading.value = true
  bugDetailVisible.value = true
  
  currentUserBugs.value = bugData.value.filter(bug => bug.resolveName === user.userName)
  bugLoading.value = false
}

const copyUserId = async (userId) => {
  const success = await copyToClipboard(userId)
  if (success) {
    ElMessage.success(`用户ID ${userId} 已复制到剪贴板`)
  } else {
    ElMessage.error('复制失败，请手动复制')
  }
}

const updateCheckedHours = (hours) => {
  // 处理勾选工时更新的逻辑
  console.log('更新勾选工时:', hours)
}

const handleUserCountClick = (event) => {
  // 检查是否是鼠标滚轮键点击（button值为1）
  if (event.button === 1) {
    event.preventDefault()
    
    // 检查是否已过滤测试
    if (!isFilterMode.value) {
      // ElMessage.warning('请先点击"过滤测试"按钮后再进入工资计算')
      return
    }
    
    if (aggregatedUsers.value.length === 0) {
      // ElMessage.warning('没有用户数据，无法进入')
      return
    }
    
    
    // 将开发人员数据存储到sessionStorage，供新窗口使用
    sessionStorage.setItem('salaryCalculatorData', JSON.stringify(aggregatedUsers.value))
    
    // 在新窗口打开工资计算页面
    const newWindow = window.open(
      router.resolve({ name: 'SalaryCalculator' }).href,
      '_blank',
      // 'width=1400,height=900,scrollbars=yes,resizable=yes'
    )
    
    if (newWindow) {
      ElMessage.success(`正在新窗口打开...（已过滤测试人员）`)
    } else {
      ElMessage.error('无法打开新窗口，请检查浏览器设置')
    }
  }
}

// 测试工资计算入口
const handleTestSalaryClick = (event) => {
  // 检查是否是鼠标滚轮键点击（button值为1）
  if (event.button === 1) {
    event.preventDefault()
    
    if (aggregatedUsers.value.length === 0) {
      // ElMessage.warning('没有用户数据，无法进入')
      return
    }
    
    // 测试人员名单
    const testPersonnel = ['曹阳', '王俐', '梁巍', '李汀岚', '李丽', '彭文韬', '李嘉', '吁茂林']
    
    // 只保留测试人员数据
    const testUsers = aggregatedUsers.value.filter(user => 
      testPersonnel.includes(user.userName)
    )
    
    if (testUsers.length === 0) {
      // ElMessage.warning('没有测试人员数据，无法进入')
      return
    }
    
    // 将测试人员数据存储到sessionStorage，供新窗口使用
    sessionStorage.setItem('salaryCalculatorData2', JSON.stringify(testUsers))
    
    // 在新窗口打开测试工资计算页面
    const newWindow = window.open(
      router.resolve({ name: 'SalaryCalculator2' }).href,
      '_blank',
      // 'width=1400,height=900,scrollbars=yes,resizable=yes'
    )
    
    if (newWindow) {
      ElMessage.success(`正在新窗口打开...（共${testUsers.length}位测试人员）`)
    } else {
      ElMessage.error('无法打开新窗口，请检查浏览器设置')
    }
  }
}

const setManualToken = () => {
  if (!manualToken.value.trim()) {
    ElMessage.warning('请输入Token')
    return
  }
  
  localStorage.setItem('workTimeToken', manualToken.value.trim())
  ElMessage.success('Token设置成功')
  manualToken.value = ''
}

const refreshToken = async () => {
  try {
    tokenLoading.value = true
    
    const response = await refreshTokenAPI()
    
    console.log('刷新Token API响应:', response)
    
    if (response && response.data) {
      const { data } = response
      
      if (data.success && data.data && data.data.token) {
        localStorage.setItem('workTimeToken', data.data.token)
        ElMessage.success('Token获取成功')
      } else {
        throw new Error('获取Token失败: ' + (data.message || '未知错误'))
      }
    } else {
      throw new Error('刷新Token响应格式错误')
    }
    
  } catch (error) {
    console.error('获取Token失败:', error)
    ElMessage.error('获取Token失败: ' + error.message)
  } finally {
    tokenLoading.value = false
  }
}

// 监听时间范围变化
watch(timeRange, () => {
  const result = calculateExpectedWorkHours(timeRange.value)
  expectedWorkHours.value = result.expectedWorkHours
  expectedWorkDays.value = result.expectedWorkDays
  expectedEquivalentDays.value = result.expectedEquivalentDays
  expectedMonthWorkDays.value = result.expectedMonthWorkDays
}, { immediate: true })

// 处理登录成功
const handleLoginSuccess = () => {
  ElMessage.success('登录成功，可以开始查询数据')
}

// 监听全局登录事件
const handleShowLoginModal = () => {
  showLoginModal.value = true
}

// 初始化
onMounted(async () => {
  // 初始化安全检查
  await initSecurity({
    enableIPCheck: true, // 启用IP检查
    enableDevToolsDisable: true, // 禁用开发者工具
    show404OnFail: false // 检查失败时显示404页面
  })
  
  // 监听全局登录事件
  window.addEventListener('showLoginModal', handleShowLoginModal)
})

// 组件卸载时清理事件监听
import { onUnmounted } from 'vue'
onUnmounted(() => {
  window.removeEventListener('showLoginModal', handleShowLoginModal)
})
</script>

<style scoped>

.user-count-clickable:hover {
  background-color: #e3f2fd;
  transform: scale(1.05);
}

.user-count-clickable:active {
  transform: scale(0.95);
}
</style>