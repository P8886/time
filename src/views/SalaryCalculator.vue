<template>
  <div class="salary-calculator">
    <div class="header">
      <h1>嘻嘻哈哈</h1>
      <el-button @click="closePage" type="primary">
        关闭页面
      </el-button>
    </div>
    
    <!-- 计算结果 -->
    <div class="salary-results">
      <el-card>
        <template #header>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span>计算结果</span>
            <div>
              <el-button type="primary" @click="calculateSalaries">
                <el-icon><Operation /></el-icon>
                重新计算
              </el-button>
              <el-button type="success" @click="exportResults">
                <el-icon><Download /></el-icon>
                导出结果
              </el-button>
            </div>
          </div>
        </template>

        <el-table 
          :data="calculatedSalaries" 
          style="width: 100%"
          :default-sort="{ prop: 'totalSalary', order: 'descending' }"
          stripe
        >
          <el-table-column type="index" label="序号" width="80" align="center"></el-table-column>
          <el-table-column prop="userName" label="姓名" width="120" sortable></el-table-column>
          <el-table-column prop="level" label="等级" width="80" sortable></el-table-column>
          <el-table-column prop="totalHours" label="总工时" width="100" sortable>
            <template #default="scope">
              {{ scope.row.totalHours.toFixed(1) }}h
            </template>
          </el-table-column>
          <el-table-column prop="baseSalary" label="基础工资" width="120" sortable>
            <template #default="scope">
              ¥{{ scope.row.baseSalary.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="performancePay" label="绩效工资" width="120" sortable>
            <template #default="scope">
              ¥{{ scope.row.performancePay.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column label="奖惩组成" min-width="200">
            <template #default="scope">
              <div class="bonus-breakdown">
                <el-tag 
                  v-for="(bonus, index) in scope.row.bonusBreakdown" 
                  :key="index"
                  size="small"
                  style="margin-right: 5px; margin-bottom: 2px;"
                  :type="getBonusTagType(bonus.amount)"
                >
                  {{ bonus.description }}: {{ bonus.amount >= 0 ? '+' : '' }}¥{{ bonus.amount }}
                </el-tag>
                <span v-if="!scope.row.bonusBreakdown || scope.row.bonusBreakdown.length === 0" style="color: #999;">
                  无奖惩
                </span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="bugBonus" label="累计奖惩" width="120" sortable>
            <template #default="scope">
              <span :style="{ color: scope.row.bugBonus >= 0 ? '#67c23a' : '#f56c6c' }">
                {{ scope.row.bugBonus >= 0 ? '+' : '' }}¥{{ scope.row.bugBonus.toFixed(2) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="totalSalary" label="总工资" width="120" sortable>
            <template #default="scope">
              <el-tag type="success" size="large">
                ¥{{ scope.row.totalSalary.toFixed(2) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="绩效分布" min-width="200">
            <template #default="scope">
              <div class="tier-breakdown">
                <el-tag 
                  v-for="(tier, index) in scope.row.tierBreakdown" 
                  :key="index"
                  size="small"
                  style="margin-right: 5px; margin-bottom: 2px;"
                  :type="getTierTagType(index)"
                >
                  {{ tier.range }}: {{ tier.hours }}h × ¥{{ tier.rate }} = ¥{{ tier.amount.toFixed(2) }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <div v-if="calculatedSalaries.length === 0" class="no-data">
          <el-icon style="font-size: 48px; color: #bdc3c7;">
            <DocumentRemove />
          </el-icon>
          <p style="margin-top: 15px;">暂无工资数据，请先配置员工等级并计算</p>
        </div>
      </el-card>
    </div>

    <!-- 员工等级配置面板 -->
    <div class="config-panel">
      <el-card>
        <template #header>
          <span>员工等级配置</span>
        </template>
        
        <div class="employee-level-config">
          <el-table :data="employeeList" style="width: 100%" max-height="400">
            <el-table-column prop="userName" label="姓名" width="120"></el-table-column>
            <el-table-column prop="totalHours" label="总工时" width="100">
              <template #default="scope">
                {{ scope.row.totalHours?.toFixed(1) || 0 }}h
              </template>
            </el-table-column>
            <el-table-column prop="bugRate" label="Bug率" width="100">
              <template #default="scope">
                {{ scope.row.bugRate?.toFixed(2) || 0 }}%
              </template>
            </el-table-column>
            <el-table-column label="等级" width="150">
              <template #default="scope">
                <el-select v-model="scope.row.level" placeholder="选择等级" size="small">
                  <el-option
                    v-for="level in levelOptions"
                    :key="level.value"
                    :label="level.label"
                    :value="level.value"
                  />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column prop="baseSalary" label="基础工资" width="120">
              <template #default="scope">
                ¥{{ getLevelBaseSalary(scope.row.level) }}
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-card>
    </div>

    <!-- 绩效工资配置 -->
    <div class="performance-config">
      <el-card>
        <template #header>
          <span>绩效工资阶梯配置 (L0固定工资无绩效)</span>
        </template>
        
        <el-table :data="performanceTiers" style="width: 100%">
          <el-table-column label="工时范围" width="150">
            <template #default="scope">
              {{ scope.row.minHours }}-{{ scope.row.maxHours === null ? '以上' : scope.row.maxHours }}
            </template>
          </el-table-column>
          <el-table-column label="L1每小时工价" width="150">
            <template #default="scope">
              ¥{{ scope.row.baseRate }}
            </template>
          </el-table-column>
          <el-table-column label="各等级每小时工价" min-width="400">
            <template #default="scope">
              <div class="level-rates">
                <el-tag size="small" style="margin-right: 5px; background: #f0f0f0;">L0: 固定工资</el-tag>
                <el-tag v-for="(rate, level) in getLevelRates(scope.row.baseRate)" :key="level" size="small" style="margin-right: 5px;">
                  {{ level }}: ¥{{ rate }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- Bug统计信息 -->
    <div class="bug-stats">
      <el-card>
        <template #header>
          <span>Bug统计与奖惩</span>
        </template>
        
        <div class="bug-info">
          <el-row :gutter="16">
            <el-col :span="4">
              <div class="stat-item">
                <div class="stat-label">总Bug率</div>
                <div class="stat-value">{{ totalBugRate.toFixed(2) }}%</div>
              </div>
            </el-col>
            <el-col :span="4">
              <div class="stat-item">
                <div class="stat-label">平均Bug率</div>
                <div class="stat-value">{{ avgBugRate.toFixed(2) }}%</div>
              </div>
            </el-col>
            <el-col :span="5">
              <div class="stat-item">
                <div class="stat-label">Bug率最低</div>
                <div class="stat-value">{{ lowestBugRateUser?.userName || '-' }}</div>
              </div>
            </el-col>
            <el-col :span="5">
              <div class="stat-item">
                <div class="stat-label">Bug率第二低</div>
                <div class="stat-value">{{ secondLowestBugRateUser?.userName || '-' }}</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-label">平均线以下人数</div>
                <div class="stat-value">{{ belowAverageBugRateCount }}</div>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-card>
    </div>

    <!-- 统计信息 -->
    <div class="summary-stats">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-label">总人数</div>
            <div class="stat-value">{{ calculatedSalaries.length }}</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-label">总工资支出</div>
            <div class="stat-value">¥{{ totalSalaryExpense.toFixed(2) }}</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-label">平均工资</div>
            <div class="stat-value">¥{{ averageSalary.toFixed(2) }}</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-label">总工时</div>
            <div class="stat-value">{{ totalWorkHours.toFixed(1) }}h</div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Plus, Operation, Download, DocumentRemove } from '@element-plus/icons-vue'

const router = useRouter()

// 等级配置
const levelConfig = {
  'L0': { label: '实习生 L0', baseSalary: 3500 },
  'L1': { label: '初级（转正）L1', baseSalary: 6000 },
  'L2': { label: '中级一级 L2', baseSalary: 6500 },
  'L3': { label: '中级二级 L3', baseSalary: 7000 },
  'L4': { label: '高级一级 L4', baseSalary: 8000 },
  'L5': { label: '高级二级 L5', baseSalary: 10000 },
  'L6': { label: '资深一级 L6', baseSalary: 12000 },
  'L7': { label: '资深二级 L7', baseSalary: 15000 }
}

const levelOptions = Object.keys(levelConfig).map(key => ({
  value: key,
  label: levelConfig[key].label
}))

// 绩效工资阶梯配置 (L1基础工价)
const performanceTiers = ref([
  { minHours: 55, maxHours: 105, baseRate: 10 },   // L1: ¥10
  { minHours: 105, maxHours: 220, baseRate: 12 },  // L1: ¥12
  { minHours: 220, maxHours: 264, baseRate: 14 },  // L1: ¥14
  { minHours: 264, maxHours: 308, baseRate: 16 },  // L1: ¥16
  { minHours: 308, maxHours: 352, baseRate: 18 },  // L1: ¥18
  { minHours: 352, maxHours: null, baseRate: 22 }  // L1: ¥22 (上不封顶)
])

// 员工等级映射表
const employeeLevelMap = {
  // L0 实习生
  
  // L1 初级（转正）
  '邓珂晗': 'L1', '魏勇程': 'L1', '周坤鹏': 'L1', '张铭': 'L1',
  '敬小毛': 'L1', '方舟': 'L1',
  
  // L2 中级一级
  '陈秀': 'L2', '付思聪': 'L2', '蒋润瑞': 'L2', '涂紫微': 'L2', '姜雪': 'L2', 
  '潘炯民': 'L2', '马愿': 'L2', '张小龙': 'L2', '曹益凡': 'L2', 
  '王雨': 'L2', '汤雨涛': 'L2', '屈焱': 'L2', '张豪': 'L2',
  
  // L3 中级二级
  '沈侨': 'L3', '皮俊': 'L3', '余丽琴': 'L3', '赵一帆': 'L3', 
  '陈刚': 'L3', 
  
  // L4 高级一级
  '李威': 'L4',  '黄凯': 'L4', '张阳': 'L4', '龙哲': 'L4', '龚豪': 'L4','陈锟': 'L4', '何成': 'L4',
  '何瀚卿': 'L4',
  
  // L5 高级二级
  '刘岳梅': 'L5', '沈凡': 'L5', '陈利钦': 'L5', '李佳文': 'L5',
  
  // L6 资深一级
  '肖伟成': 'L6',
  
  // L7 资深二级 (暂无人员)
}

// 员工数据
const employeeList = ref([])
const calculatedSalaries = ref([])

// 计算属性
const totalSalaryExpense = computed(() => {
  return calculatedSalaries.value.reduce((sum, item) => sum + item.totalSalary, 0)
})

const averageSalary = computed(() => {
  return calculatedSalaries.value.length > 0 ? totalSalaryExpense.value / calculatedSalaries.value.length : 0
})

const totalWorkHours = computed(() => {
  return calculatedSalaries.value.reduce((sum, item) => sum + item.totalHours, 0)
})

const avgBugRate = computed(() => {
  if (employeeList.value.length === 0) return 0
  const totalBugRate = employeeList.value.reduce((sum, emp) => sum + (emp.bugRate || 0), 0)
  return totalBugRate / employeeList.value.length
})

// 总bug率计算（基于总工时和总bug数）
const totalBugRate = computed(() => {
  if (totalWorkHours.value === 0) return 0
  const totalBugCount = employeeList.value.reduce((sum, emp) => {
    return sum + (emp.bugCount || 0)
  }, 0)
  return (totalBugCount / totalWorkHours.value) * 100
})

const lowestBugRateUser = computed(() => {
  if (employeeList.value.length === 0) return null
  return [...employeeList.value].sort((a, b) => (a.bugRate || 0) - (b.bugRate || 0))[0]
})

const secondLowestBugRateUser = computed(() => {
  if (employeeList.value.length < 2) return null
  return [...employeeList.value].sort((a, b) => (a.bugRate || 0) - (b.bugRate || 0))[1]
})

const belowAverageBugRateCount = computed(() => {
  return employeeList.value.filter(emp => (emp.bugRate || 0) < avgBugRate.value).length
})

const closePage = () => {
  window.close()
}

const getLevelBaseSalary = (level) => {
  return levelConfig[level]?.baseSalary || 0
}

const getLevelRates = (baseRate) => {
  const rates = {}
  Object.keys(levelConfig).forEach(level => {
    if (level === 'L0') {
      // L0不参与绩效计算，显示为固定工资
      return
    }
    const levelNum = parseInt(level.substring(1))
    // L1基础工价，每升一级+1元
    rates[level] = baseRate + (levelNum - 1)
  })
  return rates
}

const calculateBugBonus = (employee) => {
  const bugRate = employee.bugRate || 0
  const level = employee.level || 'L1'
  const levelNum = parseInt(level.substring(1))
  let bonus = 0
  const bonusBreakdown = []
  
  // L4及以上带人奖励2000元
  if (levelNum >= 4) {
    bonus += 2000
    bonusBreakdown.push({
      type: 'leadership',
      description: '带人奖励',
      amount: 2000
    })
  }
  
  // Bug率平均线以下奖励1000元
  if (bugRate < avgBugRate.value) {
    bonus += 1000
    bonusBreakdown.push({
      type: 'bug_below_avg',
      description: 'Bug率低于平均线',
      amount: 1000
    })
  }
  
  // Bug率最低额外奖励3000元
  if (employee === lowestBugRateUser.value) {
    bonus += 3000
    bonusBreakdown.push({
      type: 'bug_lowest',
      description: 'Bug率最低',
      amount: 3000
    })
  }
  
  // Bug率第二低奖励1500元
  if (employee === secondLowestBugRateUser.value) {
    bonus += 1500
    bonusBreakdown.push({
      type: 'bug_second_lowest',
      description: 'Bug率第二低',
      amount: 1500
    })
  }
  
  // Bug率平均线以上扣除500元
  if (bugRate > avgBugRate.value) {
    bonus -= 500
    bonusBreakdown.push({
      type: 'bug_above_avg',
      description: 'Bug率高于平均线',
      amount: -500
    })
  }
  
  return { bonus, bonusBreakdown }
}

const calculatePerformancePay = (employee) => {
  const totalHours = employee.totalHours || 0
  const level = employee.level || 'L1'
  const levelNum = parseInt(level.substring(1))
  
  // L0员工只拿固定工资，不计算绩效
  if (level === 'L0') {
    return { performancePay: 0, tierBreakdown: [] }
  }
  
  // 0-55工时不算钱
  if (totalHours <= 55) {
    return { performancePay: 0, tierBreakdown: [] }
  }
  
  let performancePay = 0
  const tierBreakdown = []
  
  // 按照累积计算方式，每个阶梯都基于实际工时范围计算
  for (const tier of performanceTiers.value) {
    const tierMinHours = tier.minHours
    const tierMaxHours = tier.maxHours || Infinity
    const baseRate = tier.baseRate
    // L1基础工价，每升一级+1元 (L1=baseRate, L2=baseRate+1, L3=baseRate+2...)
    const levelRate = baseRate + (levelNum - 1)
    
    if (totalHours > tierMinHours) {
      // 计算在当前阶梯内的工时
      const effectiveHours = Math.min(totalHours, tierMaxHours) - tierMinHours
      
      if (effectiveHours > 0 && levelRate > 0) {
        const tierAmount = effectiveHours * levelRate
        performancePay += tierAmount
        tierBreakdown.push({
          hours: effectiveHours,
          rate: levelRate,
          amount: tierAmount,
          range: `${tierMinHours}-${tier.maxHours || '以上'}`
        })
      }
    }
  }
  
  return { performancePay, tierBreakdown }
}

const calculateSalaries = () => {
  if (!employeeList.value || employeeList.value.length === 0) {
    ElMessage.warning('没有员工数据可供计算')
    return
  }

  calculatedSalaries.value = employeeList.value.map(employee => {
    const level = employee.level || 'L1'
    const baseSalary = getLevelBaseSalary(level)
    const { performancePay, tierBreakdown } = calculatePerformancePay(employee)
    const { bonus: bugBonus, bonusBreakdown } = calculateBugBonus(employee)
    const totalSalary = baseSalary + performancePay + bugBonus
    
    return {
      userName: employee.userName,
      level,
      totalHours: employee.totalHours || 0,
      baseSalary,
      performancePay,
      bugBonus,
      bonusBreakdown,
      totalSalary,
      tierBreakdown
    }
  })
  
  ElMessage.success('工资计算完成')
}

const exportResults = () => {
  if (calculatedSalaries.value.length === 0) {
    ElMessage.warning('没有数据可导出')
    return
  }
  
  // 创建CSV内容
  const headers = ['姓名', '等级', '总工时', '基础工资', '绩效工资', 'Bug奖惩', '奖惩组成', '总工资']
  const csvContent = [
    headers.join(','),
    ...calculatedSalaries.value.map(item => [
      item.userName,
      item.level,
      item.totalHours.toFixed(1),
      item.baseSalary.toFixed(2),
      item.performancePay.toFixed(2),
      item.bugBonus.toFixed(2),
      item.totalSalary.toFixed(2)
    ].join(','))
  ].join('\n')
  
  // 下载文件
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `计算结果_${new Date().toISOString().slice(0, 10)}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  ElMessage.success('导出成功')
}

const getTierTagType = (index) => {
  const types = ['', 'success', 'warning', 'danger', 'info']
  return types[index % types.length]
}

const getBonusTagType = (amount) => {
  if (amount > 0) {
    return 'success'  // 绿色表示奖励
  } else if (amount < 0) {
    return 'danger'   // 红色表示扣除
  } else {
    return 'info'     // 灰色表示无变化
  }
}

// 获取员工等级
const getEmployeeLevel = (userName) => {
  return employeeLevelMap[userName] || 'L1' // 默认L1等级
}

// 初始化
onMounted(() => {
  // 优先从sessionStorage获取用户数据（新窗口打开时使用）
  const sessionData = sessionStorage.getItem('salaryCalculatorData')
  if (sessionData) {
    try {
      const userData = JSON.parse(sessionData)
      employeeList.value = userData.map(user => ({
        ...user,
        level: getEmployeeLevel(user.userName) // 自动匹配等级
      }))
      calculateSalaries()
      ElMessage.success(`已自动匹配 ${employeeList.value.length} 位员工的等级`)
      // 使用后清除sessionStorage数据
      sessionStorage.removeItem('salaryCalculatorData')
      return
    } catch (error) {
      console.error('解析sessionStorage数据失败:', error)
    }
  }
  
  // 备用方案：从路由状态获取用户数据（原有方式）
  const routeState = history.state
  if (routeState && routeState.userData) {
    employeeList.value = routeState.userData.map(user => ({
      ...user,
      level: getEmployeeLevel(user.userName) // 自动匹配等级
    }))
    calculateSalaries()
    ElMessage.success(`已自动匹配 ${employeeList.value.length} 位员工的等级`)
  } else {
    ElMessage.warning('没有获取到用户数据，请从工时查询页面进入')
  }
})
</script>

<style scoped>
.salary-calculator {
  padding: 20px;
  max-width: 1600px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h1 {
  margin: 0;
  color: #2c3e50;
}

.config-panel,
.performance-config,
.salary-results,
.bug-stats {
  margin-bottom: 20px;
}

.employee-level-config {
  margin-top: 10px;
}

.level-rates {
  display: flex;
  flex-wrap: wrap;
}

.tier-breakdown {
  display: flex;
  flex-wrap: wrap;
}

.no-data {
  text-align: center;
  padding: 40px;
  color: #999;
}

.summary-stats {
  margin-top: 20px;
}

.stat-card {
  text-align: center;
  padding: 20px;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #2c3e50;
}

.bug-info {
  padding: 10px 0;
}

.stat-item {
  text-align: center;
  padding: 10px;
  background: #f8fafc;
  border-radius: 8px;
}

.stat-item .stat-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
}

.stat-item .stat-value {
  font-size: 16px;
  font-weight: bold;
  color: #2c3e50;
}

:deep(.el-card__header) {
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}
</style>