<template>
  <el-dialog
    v-model="dialogVisible"
    :title="`${user.userName} 工时详情`"
    :width="isFullscreen ? '100%' : '90%'"
    :fullscreen="isFullscreen"
    :before-close="handleClose"
    class="detail-dialog"
    :style="{ '--dialog-body-max-height': isFullscreen ? '90vh' : '84vh' }"
  >
    <template #header="{ close, titleId, titleClass }">
      <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
        <span :id="titleId" :class="titleClass">{{ user.userName }} 工时详情</span>
        <div style="display: flex; align-items: center; gap: 10px;">
          <el-button 
            type="text" 
            @click="toggleFullscreen"
            style="padding: 0; margin-right: 10px;"
            title="全屏/缩小"
          >
            <el-icon size="16">
              <span v-if="isFullscreen">🗗</span>
              <span v-else>🗖</span>
            </el-icon>
          </el-button>
        </div>
      </div>
    </template>
    
    <div class="user-summary">
      <div class="summary-card">
        <div class="summary-item">
          <span class="summary-label">总工时：</span>
          <span class="summary-value">{{ user.totalHours }}h</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">工作天数：</span>
          <span class="summary-value">{{ user.workDays }}天</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">日均工时：</span>
          <span class="summary-value">{{ user.avgDailyHours?.toFixed(1) }}h</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">已勾选工时：</span>
          <span class="summary-value">{{ checkedTotalHours.toFixed(1) }}h</span>
        </div>
      </div>
      <div style="margin-top: 10px; text-align: right;">
        <el-button 
          type="text" 
          @click="toggleExpandAllDays"
          style="padding: 0; margin-right: 10px;"
          :title="expandAllDays ? '收起所有' : '展开所有'"
        >
          <el-icon size="16">
            <span v-if="expandAllDays">📁</span>
            <span v-else>📂</span>
          </el-icon>
        </el-button>
        <el-button type="primary" size="small" @click="checkAllTasks">全选</el-button>
        <el-button type="info" size="small" @click="uncheckAllTasks">取消全选</el-button>
      </div>
      
      <!-- 任务汇总卡片 -->
      <div class="summary-card2">
        <div class="task-summary-title" style="display: flex; align-items: center; justify-content: space-between;">
          <span>任务汇总</span>
          <div style="display: flex; align-items: center; gap: 10px;">
            <el-select 
              v-model="taskSortType" 
              @change="sortTaskSummary"
              size="small" 
              style="width: 120px;"
              placeholder="排序方式"
            >
              <el-option label="时长倒序" value="duration_desc"></el-option>
              <el-option label="时长正序" value="duration_asc"></el-option>
              <el-option label="开始时间" value="start_time"></el-option>
              <el-option label="结束时间" value="end_time"></el-option>
            </el-select>
            <el-button 
              type="text" 
              @click="toggleCollapseSummaryCard"
              style="padding: 0;"
              :title="collapseSummaryCard ? '展开' : '收起'"
            >
              <el-icon size="14">
                <span v-if="collapseSummaryCard">▼</span>
                <span v-else>▲</span>
              </el-icon>
            </el-button>
          </div>
        </div>
        <div class="task-list" v-show="!collapseSummaryCard">
          <div v-for="task in userTaskSummary" :key="task.taskName" class="task-item">
            <el-checkbox 
              v-model="task.checked" 
              @change="onTaskCheckChange(task.taskName)"
              class="task-checkbox"
            />
            <span 
              class="task-name"
              :style="{ color: getTaskNameColor(task.taskName) }"
              @mousedown="handleTaskNameClick($event, task.taskId)"
            >TSK-{{task.taskId}} / {{ task.taskName }}</span>
            <span class="task-hours">{{ task.totalHours.toFixed(1) }}h</span>
            <span 
              style="margin-left: 8px; font-size: 11px; color: #666; background: #f5f5f5; padding: 2px 6px; border-radius: 4px; white-space: nowrap;"
              :title="'任务时间范围: ' + getTaskTimeRange(task.taskName)"
            >
              {{ getTaskTimeRange(task.taskName) }}
            </span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="detail-content" :style="{ maxHeight: collapseSummaryCard ? '60vh' : '50vh' }">
      <div v-for="dayDetail in user.details" :key="dayDetail.workDate" class="day-detail-card">
        <div class="day-header">
          <div style="display: flex; align-items: center; width: 100%;">
            <el-checkbox v-model="dayDetail.checked" @change="updateCheckedHours" style="margin-right: 10px;" />
            <div class="day-info" style="flex-grow: 1;" @click="toggleDayExpand(dayDetail.workDate)">
              <span class="day-date">{{ dayDetail.workDate }} {{ getWeekDay(dayDetail.workDate) }}</span>
              <el-tag :type="dayDetail.taskHour >= 10 ? 'danger' : dayDetail.taskHour > 8 ? 'warning' : 'primary'" size="small">{{ dayDetail.taskHour }}h</el-tag>
              <span class="task-count">{{ dayDetail.taskCount }}个任务</span>
            </div>
            <el-icon class="expand-icon" :class="{ 'expanded': expandedDays.includes(dayDetail.workDate) }" @click="toggleDayExpand(dayDetail.workDate)">
              <ArrowDown />
            </el-icon>
          </div>
        </div>
        
        <el-collapse-transition>
          <div v-show="expandedDays.includes(dayDetail.workDate)" class="day-tasks">
            <div v-for="(task, index) in dayDetail.issueWorkLogs" :key="index" class="task-item">
              <div class="task-header">
                <el-checkbox 
                  v-model="task.checked" 
                  @change="updateCheckedHours"
                  style="margin-right: 10px;"
                />
                <div 
                  style="width: 4px; height: 20px; border-radius: 2px; margin-right: 8px;"
                  :style="{ backgroundColor: getTaskNameColor(task.taskName) }"
                />
                <span 
                  class="task-name"
                  :style="{ color: getTaskNameColor(task.taskName) }"
                >{{ task.taskName }}</span>
                <el-tag size="small" type="success">{{ task.taskHour }}h</el-tag>
              </div>
              <div class="task-content" v-if="task.content && task.content !== '无'">
                {{ task.content }}
              </div>
            </div>
            <div v-if="dayDetail.issueWorkLogs.length === 0" class="no-tasks">
              暂无任务详情
            </div>
          </div>
        </el-collapse-transition>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'
import { getTaskNameColor } from '@/utils/common'
import { getWeekDay } from '@/utils/common'
import { checkIPWhitelist } from '@/utils/security'
import { useRouter } from 'vue-router'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  user: {
    type: Object,
    default: () => ({ userName: '', details: [] })
  }
})

const emit = defineEmits(['update:visible', 'update-checked-hours'])

// 获取路由实例
const router = useRouter()

// 响应式数据
const dialogVisible = ref(false)
const isFullscreen = ref(false)
const expandAllDays = ref(false)
const collapseSummaryCard = ref(false)
const taskSortType = ref('duration_desc')
const expandedDays = ref([])
const checkedTotalHours = ref(0)

// 计算用户任务汇总
const userTaskSummary = computed(() => {
  if (!props.user || !props.user.details) {
    return []
  }
  
  const taskMap = new Map()
  
  props.user.details.forEach(day => {
    if (day.issueWorkLogs) {
      day.issueWorkLogs.forEach(log => {
        const taskName = log.taskName || '未知任务'
        const taskId = log.taskId
        if (taskMap.has(taskName)) {
          const task = taskMap.get(taskName)
          task.totalHours += log.taskHour
          // 更新时间范围
          if (day.workDate < task.startTime) {
            task.startTime = day.workDate
          }
          if (day.workDate > task.endTime) {
            task.endTime = day.workDate
          }
        } else {
          taskMap.set(taskName, {
            taskName: taskName,
            totalHours: log.taskHour,
            taskId: taskId,
            checked: false,
            startTime: day.workDate,
            endTime: day.workDate
          })
        }
      })
    }
  })
  
  let tasks = Array.from(taskMap.values())
  
  // 根据排序类型进行排序
  switch (taskSortType.value) {
    case 'duration_asc':
      tasks.sort((a, b) => a.totalHours - b.totalHours)
      break
    case 'start_time':
      tasks.sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
      break
    case 'end_time':
      tasks.sort((a, b) => new Date(a.endTime) - new Date(b.endTime))
      break
    case 'duration_desc':
    default:
      tasks.sort((a, b) => b.totalHours - a.totalHours)
      break
  }
  
  return tasks
})

// 方法
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
}

const toggleExpandAllDays = () => {
  expandAllDays.value = !expandAllDays.value
  if (expandAllDays.value) {
    expandedDays.value = props.user.details.map(day => day.workDate)
  } else {
    expandedDays.value = []
  }
}

const toggleCollapseSummaryCard = () => {
  collapseSummaryCard.value = !collapseSummaryCard.value
}

const sortTaskSummary = () => {
  console.log('任务排序类型已更改为:', taskSortType.value)
}

const checkAllTasks = () => {
  props.user.details.forEach(day => {
    day.checked = true
    if (day.issueWorkLogs) {
      day.issueWorkLogs.forEach(task => {
        task.checked = true
      })
    }
  })
  userTaskSummary.value.forEach(task => {
    task.checked = true
  })
  updateCheckedHours()
}

const uncheckAllTasks = () => {
  props.user.details.forEach(day => {
    day.checked = false
    if (day.issueWorkLogs) {
      day.issueWorkLogs.forEach(task => {
        task.checked = false
      })
    }
  })
  userTaskSummary.value.forEach(task => {
    task.checked = false
  })
  updateCheckedHours()
}

const onTaskCheckChange = (taskName) => {
  const task = userTaskSummary.value.find(t => t.taskName === taskName)
  if (!task) return
  
  // 根据任务勾选状态，勾选或取消勾选所有相同taskName的单个任务
  props.user.details.forEach(day => {
    if (day.issueWorkLogs) {
      day.issueWorkLogs.forEach(log => {
        if (log.taskName === taskName) {
          log.checked = task.checked
          // 如果勾选了任务，展开对应的日期
          if (task.checked && !expandedDays.value.includes(day.workDate)) {
            expandedDays.value.push(day.workDate)
          }
        }
      })
      
      // 如果取消勾选任务，检查该日期是否还有其他勾选的任务
      if (!task.checked) {
        const hasOtherCheckedTasks = day.issueWorkLogs.some(log => log.checked)
        // 如果没有其他勾选的任务，关闭该日期的展开状态
        if (!hasOtherCheckedTasks) {
          const dayIndex = expandedDays.value.indexOf(day.workDate)
          if (dayIndex > -1) {
            expandedDays.value.splice(dayIndex, 1)
          }
        }
      }
    }
  })
  
  updateCheckedHours()
}

const updateCheckedHours = () => {
  let total = 0
  props.user.details.forEach(day => {
    if (day.checked) {
      total += day.taskHour
    } else {
      // 如果日期没有勾选，计算单个任务的勾选工时
      if (day.issueWorkLogs) {
        day.issueWorkLogs.forEach(task => {
          if (task.checked) {
            total += parseFloat(task.taskHour || 0)
          }
        })
      }
    }
  })
  checkedTotalHours.value = total
  emit('update-checked-hours', total)
}

const toggleDayExpand = (workDate) => {
  const index = expandedDays.value.indexOf(workDate)
  if (index > -1) {
    expandedDays.value.splice(index, 1)
  } else {
    expandedDays.value.push(workDate)
  }
}

const getTaskTimeRange = (taskName) => {
  if (!props.user || !props.user.details) {
    return '暂无数据'
  }
  
  let startTime = null
  let endTime = null
  
  // 遍历所有日期，找到该任务的最早和最晚时间
  props.user.details.forEach(day => {
    if (day.issueWorkLogs) {
      day.issueWorkLogs.forEach(log => {
        if (log.taskName === taskName) {
          const currentDate = day.workDate
          if (!startTime || currentDate < startTime) {
            startTime = currentDate
          }
          if (!endTime || currentDate > endTime) {
            endTime = currentDate
          }
        }
      })
    }
  })
  
  if (!startTime || !endTime) {
    return '暂无数据'
  }
  
  if (startTime === endTime) {
    return startTime
  }
  
  return `${startTime} ~ ${endTime}`
}

const handleTaskNameClick = async (event, taskId) => {
  // 检查是否为鼠标中键（滚轮键）
  if (event.button === 1) {
    event.preventDefault()
    
    // 检查IP白名单
    const isAllowed = await checkIPWhitelist()
    console.log('isAllowed', isAllowed)
    
    if (!isAllowed) {
      return
    }
    
    // 使用 router.push 进行页面导航
    router.push({
      path: '/record',
      query: { taskId }
    })
  }
}

const handleClose = (done) => {
  expandedDays.value = []
  done()
}

// 监听visible变化
watch(() => props.visible, (newVal) => {
  dialogVisible.value = newVal
  if (newVal) {
    // 初始化勾选状态
    props.user.details.forEach(day => {
      day.checked = false
      // 初始化任务勾选状态
      if (day.issueWorkLogs) {
        day.issueWorkLogs.forEach(task => {
          task.checked = false
        })
      }
    })
    
    // 重置已勾选工时
    checkedTotalHours.value = 0
    expandedDays.value = []
  }
})

watch(dialogVisible, (newVal) => {
  emit('update:visible', newVal)
})
</script>