// 通用工具函数

// 获取当月第一天到今天的时间范围
export const getCurrentMonthRange = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const date = now.getDate()
  
  // 当月第一天
  const firstDayStr = `${year}-${(month + 1).toString().padStart(2, '0')}-01`
  
  // 今天
  const todayStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${date.toString().padStart(2, '0')}`
  
  return [firstDayStr, todayStr]
}

// 获取当前时间字符串
export const getCurrentTime = () => {
  const now = new Date()
  return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
}

// 获取星期几
export const getWeekDay = (dateStr) => {
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const date = new Date(dateStr)
  return weekDays[date.getDay()]
}

// 中国法定节假日（2025年）
export const chineseHolidays2025 = [
  // 元旦
  '2025-01-01',
  // 春节
  '2025-01-28', '2025-01-29', '2025-01-30', '2025-01-31', '2025-02-01', '2025-02-02', '2025-02-03',
  // 清明节
  '2025-04-05', '2025-04-06', '2025-04-07',
  // 劳动节
  '2025-05-01', '2025-05-02', '2025-05-03',
  // 端午节
  '2025-05-31', '2025-06-01', '2025-06-02',
  // 中秋节
  '2025-10-06', '2025-10-07', '2025-10-08',
  // 国庆节
  '2025-10-01', '2025-10-02', '2025-10-03', '2025-10-04', '2025-10-05'
]

// 计算应出勤工时、天数等
export const calculateExpectedWorkHours = (timeRange) => {
  if (!timeRange || !timeRange[0] || !timeRange[1]) {
    return {
      expectedWorkHours: 0,
      expectedWorkDays: 0,
      expectedEquivalentDays: 0,
      expectedMonthWorkDays: 0
    }
  }
  
  const startDate = new Date(timeRange[0])
  const endDate = new Date(timeRange[1])
  let totalHours = 0
  let totalDays = 0
  let equivalentDays = 0
  
  // 计算当月应出勤天数（周六算半天）
  const currentDate = new Date()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
  let monthWorkDays = 0
  
  for (let date = new Date(firstDayOfMonth); date <= lastDayOfMonth; date.setDate(date.getDate() + 1)) {
    const dateStr = date.toISOString().split('T')[0]
    const dayOfWeek = date.getDay() // 0=周日, 1=周一, ..., 6=周六
    
    // 跳过法定节假日
    if (chineseHolidays2025.includes(dateStr)) {
      continue
    }
    
    // 周一到周五：算1天
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      monthWorkDays += 1
    }
    // 周六：算0.5天
    else if (dayOfWeek === 6) {
      monthWorkDays += 0.5
    }
    // 周日：不计入
  }
  
  // 遍历时间范围内的每一天
  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    const dateStr = date.toISOString().split('T')[0]
    const dayOfWeek = date.getDay() // 0=周日, 1=周一, ..., 6=周六
    
    // 跳过法定节假日
    if (chineseHolidays2025.includes(dateStr)) {
      continue
    }
    
    // 周一到周五：7.5小时，算1天
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      totalHours += 7.5
      totalDays += 1
      equivalentDays += 1
    }
    // 周六：3小时，算1天，但折合为0.5天
    else if (dayOfWeek === 6) {
      totalHours += 3
      totalDays += 1
      equivalentDays += 0.5
    }
    // 周日：不工作，不算工时和应出勤天数
  }
  
  return {
    expectedWorkHours: totalHours.toFixed(1),
    expectedWorkDays: totalDays,
    expectedEquivalentDays: equivalentDays.toFixed(1),
    expectedMonthWorkDays: monthWorkDays.toFixed(1)
  }
}

// 为taskName生成颜色的函数
export const getTaskNameColor = (taskName) => {
  if (!taskName) return '#64748b'
  
  // 预定义的颜色数组 - 更有区分度的颜色
  const colors = [
    '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
    '#1abc9c', '#e67e22', '#34495e', '#e91e63', '#673ab7',
    '#ff5722', '#009688', '#795548', '#607d8b', '#ff9800',
    '#4caf50', '#2196f3', '#f44336', '#9c27b0', '#00bcd4',
    '#8bc34a', '#ffc107', '#ff6f00', '#d32f2f', '#7b1fa2',
    '#388e3c', '#1976d2', '#c2185b', '#512da8', '#0097a7'
  ]
  
  // 使用taskName的hash值来选择颜色
  let hash = 0
  for (let i = 0; i < taskName.length; i++) {
    hash = taskName.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % colors.length
  return colors[index]
}

// 复制文本到剪贴板
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text.toString())
    return true
  } catch (error) {
    console.error('复制失败:', error)
    // 降级方案：使用传统方法复制
    const textArea = document.createElement('textarea')
    textArea.value = text.toString()
    document.body.appendChild(textArea)
    textArea.select()
    try {
      document.execCommand('copy')
      document.body.removeChild(textArea)
      return true
    } catch (fallbackError) {
      document.body.removeChild(textArea)
      return false
    }
  }
}

// 获取URL参数
export const getUrlParams = () => {
  const urlParams = new URLSearchParams(window.location.search)
  return {
    taskId: urlParams.get('taskId') || ''
  }
}