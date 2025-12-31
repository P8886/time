<template>
  <div class="salary-calculator">
    <div class="header">
      <h1>xxx</h1>
    </div>

    <div class="controls">
      <el-button type="primary" @click="loadUserData" :loading="loading">
        <el-icon><Refresh /></el-icon> 加载用户数据
      </el-button>
      <!-- <el-button type="success" @click="calculateAllSalaries" :disabled="!hasData" :loading="calculating">
        <el-icon><Money /></el-icon> 计算所有工资
      </el-button> -->
      <el-button type="info" @click="exportResults" :disabled="!hasCalculated">
        <el-icon><Download /></el-icon> 导出结果
      </el-button>
    </div>

    <div class="stats-cards" v-if="hasData">
      <div class="stat-card">
        <div class="stat-label">总人数</div>
        <div class="stat-value">{{ filteredUsers.length }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">平均工时</div>
        <div class="stat-value">{{ averageWorkHours.toFixed(1) }}h</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">总工时</div>
        <div class="stat-value">{{ totalWorkHours.toFixed(1) }}h</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">预计总工资</div>
        <div class="stat-value">{{ totalSalary.toLocaleString() }}元</div>
      </div>
    </div>

    <div class="table-container" v-if="hasData">
      <el-table 
        :data="salaryResults" 
        style="width: 100%"
        v-loading="calculating"
        :default-sort="{ prop: 'totalSalary', order: 'descending' }"
        stripe
        :header-cell-style="{ background: '#f8fafc', color: '#374151', fontWeight: '600' }"
      >
        <el-table-column type="index" label="序号" width="80" align="center"></el-table-column>
        
        <el-table-column prop="userName" label="姓名" width="130" sortable>
          <template #default="scope">
            <div style="display: flex; align-items: center;">
              <el-avatar :size="32" style="margin-right: 10px; background: #3b82f6;">
                {{ scope.row.userName ? scope.row.userName.charAt(0) : '?' }}
              </el-avatar>
              <span style="font-weight: 500;">{{ scope.row.userName || '未知用户' }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="level" label="级别" width="130" sortable>
          <template #default="scope">
            <el-tag :type="getLevelTagType(scope.row.level)" size="small">
              {{ scope.row.level }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="baseSalary" label="底薪" width="130" sortable>
          <template #default="scope">
            <span style="color: #2563eb; font-weight: 500;">{{ scope.row.baseSalary.toLocaleString() }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="workHours" label="工时" width="130" sortable>
          <template #default="scope">
            <span style="color: #059669; font-weight: 500;">{{ scope.row.workHours.toFixed(1) }}h</span>
          </template>
        </el-table-column>

        <el-table-column prop="performanceBonus" label="绩效奖金" width="130" sortable>
          <template #default="scope">
            <span style="color: #dc2626; font-weight: 500;">{{ scope.row.performanceBonus.toLocaleString() }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="extraBonus" label="额外奖金" sortable>
          <template #default="scope">
            <div>
              <span style="color: #f59e0b; font-weight: 500;">{{ scope.row.extraBonus.toLocaleString() }}</span>
              <div v-if="scope.row.bonusDetails && scope.row.bonusDetails.length > 0" style="font-size: 12px; color: #6b7280; margin-top: 2px;">
                <div v-for="detail in scope.row.bonusDetails" :key="detail">{{ detail }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="totalSalary" label="总工资" width="120" sortable>
          <template #default="scope">
            <el-tag :type="getSalaryTagType(scope.row.totalSalary)" size="large">
              {{ scope.row.totalSalary.toLocaleString() }}元
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" align="center">
          <template #default="scope">
            <el-button type="primary" size="small" @click="showDetail(scope.row)" round>
              <el-icon style="margin-right: 4px;"><View /></el-icon>
              详情
            </el-button>
            <!-- <el-button type="warning" size="small" @click="recalculate(scope.row)" round style="margin-left: 5px;">
              <el-icon style="margin-right: 4px;"><Refresh /></el-icon>
              重算
            </el-button> -->
          </template>
        </el-table-column>
      </el-table>

      <div v-if="!loading && filteredUsers.length === 0" class="no-data">
        <el-icon style="font-size: 48px; color: #bdc3c7;">
          <DocumentRemove />
        </el-icon>
        <p style="margin-top: 15px;">没有找到用户数据</p>
      </div>
    </div>

    <!-- 详情弹窗 -->
    <el-dialog
      v-model="detailVisible"
      :title="`${currentUser.userName} - 工资计算详情`"
      width="600px"
    >
      <div v-if="currentUser.calculationDetails">
        <div class="detail-summary">
          <p><strong>姓名：</strong>{{ currentUser.userName }}</p>
          <p><strong>级别：</strong>{{ currentUser.level }}</p>
          <p><strong>底薪：</strong>{{ currentUser.baseSalary.toLocaleString() }}元</p>
          <p><strong>工时：</strong>{{ currentUser.workHours.toFixed(1) }}小时</p>
          <p><strong>绩效奖金：</strong>{{ currentUser.performanceBonus.toLocaleString() }}元</p>
          <p v-if="currentUser.extraBonus > 0"><strong>额外奖金：</strong>{{ currentUser.extraBonus.toLocaleString() }}元</p>
          <p v-if="currentUser.bonusDetails && currentUser.bonusDetails.length > 0">
            <strong>奖金明细：</strong>{{ currentUser.bonusDetails.join(', ') }}
          </p>
          <p><strong>总工资：</strong>{{ currentUser.totalSalary.toLocaleString() }}元</p>
        </div>
        
        <el-divider>绩效计算详情</el-divider>
        
        <el-table :data="currentUser.calculationDetails" style="width: 100%" size="small">
          <el-table-column prop="description" label="档位" width="120"></el-table-column>
          <el-table-column prop="range" label="工时范围" width="100"></el-table-column>
          <el-table-column prop="rate" label="单价" width="80">
            <template #default="scope">
              {{ scope.row.rate }}元/h
            </template>
          </el-table-column>
          <el-table-column prop="hours" label="实际工时" width="80">
            <template #default="scope">
              {{ scope.row.hours }}h
            </template>
          </el-table-column>
          <el-table-column prop="bonus" label="奖金" width="100">
            <template #default="scope">
              {{ scope.row.bonus }}元
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Money, Download, View, DocumentRemove } from '@element-plus/icons-vue'

// 响应式数据
const loading = ref(false)
const calculating = ref(false)
const hasData = ref(false)
const hasCalculated = ref(false)
const detailVisible = ref(false)
const currentUser = ref({})

// 用户数据
const originalUsers = ref([])
const salaryResults = ref([])

// 测试人员名单和级别配置
const testPersonnel = ['曹阳', '王俐', '梁巍', '李汀岚', '李丽', '彭文韬', '李嘉', '吁茂林']

// // 老员工list
const oldEmployees = ref(['曹阳', '王俐', '梁巍', '李汀岚', '李丽', '彭文韬'])
// 组长list
const groupLeaders = ref(['曹阳', '王俐'])
// 全勤员工list
const fullAttendanceEmployees = ref(['曹阳', '王俐', '梁巍', '李汀岚', '李丽', '彭文韬', '李嘉', '吁茂林'])

const levelConfig = {
  '曹阳': { level: '中二级', baseSalary: 6500 },
  '李嘉': { level: '初级', baseSalary: 5500 },
  '吁茂林': { level: '初级', baseSalary: 5500 },
  // 其他测试人员默认为中一级
  'default': { level: '中一级', baseSalary: 6000 }
}

// 阶梯绩效规则（从index.js复制）
const performanceTiers = [
  { min: 0, max: 56, rate: 0, description: "无绩效" },
  { min: 56, max: 96, rate: 13, description: "第二档" },
  { min: 96, max: 136, rate: 17, description: "第三档" },
  { min: 136, max: 176, rate: 22, description: "第四档" },
  { min: 176, max: 198, rate: 28, description: "第五档" },
  { min: 198, max: 220, rate: 32, description: "第六档" },
  { min: 220, max: Infinity, rate: 40, description: "第七档(上不封顶)" }
]

// 计算属性
const filteredUsers = computed(() => {
  return originalUsers.value.filter(user => 
    testPersonnel.includes(user.userName)
  )
})

const averageWorkHours = computed(() => {
  if (filteredUsers.value.length === 0) return 0
  const total = filteredUsers.value.reduce((sum, user) => sum + user.totalHours, 0)
  return total / filteredUsers.value.length
})

const totalWorkHours = computed(() => {
  return filteredUsers.value.reduce((sum, user) => sum + user.totalHours, 0)
})

const totalSalary = computed(() => {
  return salaryResults.value.reduce((sum, user) => sum + user.totalSalary, 0)
})

// 绩效计算函数（从index.js移植）
const calculatePerformanceBonus = (workHours) => {
  let totalBonus = 0
  let remainingHours = workHours
  let calculationDetails = []

  for (let i = 0; i < performanceTiers.length && remainingHours > 0; i++) {
    const tier = performanceTiers[i]
    const tierRange = tier.max - tier.min
    
    let hoursInThisTier = 0
    if (remainingHours >= tierRange) {
      hoursInThisTier = tierRange
    } else {
      hoursInThisTier = remainingHours
    }

    const tierBonus = hoursInThisTier * tier.rate
    totalBonus += tierBonus

    if (hoursInThisTier > 0) {
      calculationDetails.push({
        tier: i + 1,
        description: tier.description,
        range: `${tier.min}-${tier.max === Infinity ? '以上' : tier.max}`,
        rate: tier.rate,
        hours: hoursInThisTier,
        bonus: tierBonus
      })
    }

    remainingHours -= hoursInThisTier
  }

  return {
    totalBonus,
    calculationDetails
  }
}

// 获取用户级别和底薪
const getUserLevelInfo = (userName) => {
  return levelConfig[userName] || levelConfig.default
}

// 方法
const loadUserData = () => {
  try {
    loading.value = true
    const data = sessionStorage.getItem('salaryCalculatorData2')
    
    if (!data) {
      ElMessage.warning('没有找到用户数据，请从工时查询页面进入')
      return
    }

    originalUsers.value = JSON.parse(data)
    hasData.value = true
    ElMessage.success(`加载了 ${filteredUsers.value.length} 位测试人员数据`)
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const calculateAllSalaries = () => {
  calculating.value = true
  
  try {
    const results = filteredUsers.value.map(user => {
      const levelInfo = getUserLevelInfo(user.userName)
      const performanceResult = calculatePerformanceBonus(user.totalHours)
      
      // 计算额外奖金
      let extraBonus = 0
      let bonusDetails = []
      
      // 老员工奖金 +300
      if (oldEmployees.value.includes(user.userName)) {
        extraBonus += 300
        bonusDetails.push('老员工奖金+300')
      }
      
      // 组长奖金 +500
      if (groupLeaders.value.includes(user.userName)) {
        extraBonus += 500
        bonusDetails.push('组长奖金+500')
      }
      
      // 全勤奖金 +100
      if (fullAttendanceEmployees.value.includes(user.userName)) {
        extraBonus += 100
        bonusDetails.push('全勤奖金+100')
      }
      
      return {
        userName: user.userName,
        userId: user.userId,
        level: levelInfo.level,
        baseSalary: levelInfo.baseSalary,
        workHours: user.totalHours,
        performanceBonus: performanceResult.totalBonus,
        extraBonus: extraBonus,
        bonusDetails: bonusDetails,
        totalSalary: levelInfo.baseSalary + performanceResult.totalBonus + extraBonus,
        calculationDetails: performanceResult.calculationDetails
      }
    })

    salaryResults.value = results
    hasCalculated.value = true
    ElMessage.success('工资计算完成')
  } catch (error) {
    console.error('计算失败:', error)
    ElMessage.error('计算失败')
  } finally {
    calculating.value = false
  }
}

const showDetail = (user) => {
  currentUser.value = user
  detailVisible.value = true
}

const recalculate = (user) => {
  const index = salaryResults.value.findIndex(item => item.userId === user.userId)
  if (index !== -1) {
    const levelInfo = getUserLevelInfo(user.userName)
    const performanceResult = calculatePerformanceBonus(user.workHours)
    
    // 计算额外奖金
    let extraBonus = 0
    let bonusDetails = []
    
    // 老员工奖金 +300
    if (oldEmployees.value.includes(user.userName)) {
      extraBonus += 300
      bonusDetails.push('老员工奖金+300')
    }
    
    // 组长奖金 +500
    if (groupLeaders.value.includes(user.userName)) {
      extraBonus += 500
      bonusDetails.push('组长奖金+500')
    }
    
    // 全勤奖金 +100
    if (fullAttendanceEmployees.value.includes(user.userName)) {
      extraBonus += 100
      bonusDetails.push('全勤奖金+100')
    }
    
    salaryResults.value[index] = {
      ...user,
      performanceBonus: performanceResult.totalBonus,
      extraBonus: extraBonus,
      bonusDetails: bonusDetails,
      totalSalary: levelInfo.baseSalary + performanceResult.totalBonus + extraBonus,
      calculationDetails: performanceResult.calculationDetails
    }
    
    ElMessage.success(`${user.userName} 工资重新计算完成`)
  }
}

const exportResults = () => {
  try {
    const csvContent = [
      ['姓名', '级别', '底薪', '工时', '绩效奖金', '额外奖金', '奖金明细', '总工资'],
      ...salaryResults.value.map(user => [
        user.userName,
        user.level,
        user.baseSalary,
        user.workHours.toFixed(1),
        user.performanceBonus,
        user.extraBonus || 0,
        user.bonusDetails ? user.bonusDetails.join(';') : '',
        user.totalSalary
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `工资计算结果_${new Date().toISOString().slice(0, 10)}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

const getLevelTagType = (level) => {
  const typeMap = {
    '初级': 'info',
    '中一级': 'success',
    '中二级': 'warning',
    '高一级': 'danger',
    '高二级': 'danger'
  }
  return typeMap[level] || 'info'
}

const getSalaryTagType = (salary) => {
  if (salary >= 10000) return 'danger'
  if (salary >= 8000) return 'warning'
  if (salary >= 6000) return 'success'
  return 'info'
}

// 初始化
onMounted(() => {
  loadUserData()
  calculateAllSalaries()
})
</script>

<style scoped>
.salary-calculator {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h1 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.header p {
  color: #7f8c8d;
  font-size: 16px;
}

.controls {
  display: flex;
  gap: 15px;
  margin-bottom: 30px;
  justify-content: center;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
}

.table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.no-data {
  text-align: center;
  padding: 60px 20px;
  color: #7f8c8d;
}

.detail-summary {
  background: #f8fafc;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.detail-summary p {
  margin: 8px 0;
  font-size: 14px;
}

:deep(.el-table th) {
  background-color: #f8fafc !important;
}

:deep(.el-dialog__header) {
  background-color: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
}
</style>