<template>
  <el-dialog
    v-model="dialogVisible"
    :title="`${user.userName} Bug详情`"
    width="90%"
    :before-close="() => dialogVisible = false"
  >
    <div v-loading="loading">
      <div v-if="bugs.length === 0" style="text-align: center; padding: 50px; color: #95a5a6;">
        <el-icon style="font-size: 48px; margin-bottom: 15px;">
          <DocumentRemove />
        </el-icon>
        <p>该用户暂无Bug记录</p>
      </div>
      <el-table v-else :data="bugs" style="width: 100%" stripe>
        <el-table-column type="expand" width="60" align="center">
          <template #default="scope">
            <div style="padding: 20px; background: #f8f9fa; border-radius: 8px; margin: 10px;">
              <h4 style="margin: 0 0 15px 0; color: #495057; font-size: 16px;">Bug详细描述：</h4>
              <div 
                v-html="scope.row.bugDescription || '暂无详细描述'" 
                class="bug-description-content"
                style="
                  line-height: 1.6; 
                  color: #6c757d; 
                  background: white; 
                  padding: 15px; 
                  border-radius: 6px; 
                  border-left: 4px solid #007bff;
                  word-wrap: break-word;
                  max-height: 600px;
                  overflow-y: auto;
                  overflow-x: hidden;
                "
              ></div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="taskId" label="任务ID" width="100" sortable />
        <el-table-column prop="bugTitle" label="Bug标题" min-width="180" sortable />
        <el-table-column prop="createTime" label="创建时间" min-width="180" sortable />
        <el-table-column prop="severity" label="严重程度" width="120" sortable>
          <template #default="scope">
            <el-tag :type="getSeverityTagType(scope.row.severity)" size="small">
              {{ getSeverityText(scope.row.severity) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="bugType" label="Bug类型" width="120" sortable>
          <template #default="scope">
            <el-tag :type="getBugTypeTagType(scope.row.bugType)" size="small">
              {{ getBugTypeText(scope.row.bugType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operateSystem" label="操作系统" width="120" sortable>
          <template #default="scope">
            <el-tag type="info" size="small">
              {{ getOperateSystemText(scope.row.operateSystem) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="browser" label="浏览器" width="100" sortable>
          <template #default="scope">
            <el-tag type="info" size="small">
              {{ getBrowserText(scope.row.browser) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="bugEnvironment" label="环境" width="80" sortable>
          <template #default="scope">
            <el-tag :type="scope.row.bugEnvironment === 2 ? 'danger' : 'success'" size="small">
              {{ getBugEnvironmentText(scope.row.bugEnvironment) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="100" sortable>
          <template #default="scope">
            <span :style="getPriorityStyle(scope.row.priority)" style="font-weight: bold;">
              {{ getPriorityText(scope.row.priority) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" sortable>
          <template #default="scope">
            <el-tag :type="getStatusTagType(scope.row.status)" size="small">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createName" label="创建人" width="100" sortable />
        <el-table-column prop="belongingMonth" label="所属月份" width="120" sortable />
      </el-table>
    </div>
    
    <!-- 图片预览组件 -->
    <ImageViewer
      v-model:visible="imageViewerVisible"
      :image-url="currentImageUrl"
      @close="closeImageViewer"
    />
  </el-dialog>
</template>

<script setup>
import { ref, watch, nextTick, onMounted } from 'vue'
import { DocumentRemove } from '@element-plus/icons-vue'
import ImageViewer from './ImageViewer.vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  user: {
    type: Object,
    default: () => ({ userName: '' })
  },
  bugs: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible'])

const dialogVisible = ref(false)
const imageViewerVisible = ref(false)
const currentImageUrl = ref('')

// 监听visible变化
watch(() => props.visible, (newVal) => {
  dialogVisible.value = newVal
})

watch(dialogVisible, (newVal) => {
  emit('update:visible', newVal)
  if (newVal) {
    // 当对话框打开时，延迟初始化图片点击事件
    setTimeout(() => {
      initImageClickEvents()
    }, 500)
  }
})

// 初始化图片点击事件
const initImageClickEvents = () => {
  console.log('初始化图片点击事件')
  
  // 使用事件委托，监听整个对话框的点击事件
  const dialog = document.querySelector('.el-dialog')
  if (dialog) {
    dialog.addEventListener('click', (e) => {
      if (e.target.tagName === 'IMG' && e.target.closest('.bug-description-content')) {
        console.log('图片被点击:', e.target.src)
        openImageViewer(e.target.src)
      }
    })
  }
  
  // 同时也直接为现有图片添加事件
  const bugDescriptions = document.querySelectorAll('.bug-description-content')
  console.log('找到描述容器数量:', bugDescriptions.length)
  
  bugDescriptions.forEach(container => {
    const images = container.querySelectorAll('img')
    console.log('找到图片数量:', images.length)
    
    images.forEach(img => {
      img.style.cursor = 'pointer'
      img.onclick = (e) => {
        e.preventDefault()
        e.stopPropagation()
        console.log('直接点击图片:', img.src)
        openImageViewer(img.src)
      }
    })
  })
}

// 打开图片预览
const openImageViewer = (imageSrc) => {
  console.log('打开图片预览:', imageSrc)
  currentImageUrl.value = imageSrc
  imageViewerVisible.value = true
}

// 关闭图片预览
const closeImageViewer = () => {
  console.log('关闭图片预览')
  imageViewerVisible.value = false
  currentImageUrl.value = ''
}

// 字典数据
const dictionaries = {
  severity: {
    "1": "致命",
    "2": "严重", 
    "3": "一般",
    "4": "轻微"
  },
  bugEnvironment: {
    "1": "测试",
    "2": "产线"
  },
  bugType: {
    "1": "功能缺陷",
    "2": "样式缺陷", 
    "3": "设计缺陷",
    "4": "优化需求",
    "99": "其他"
  },
  operateSystem: {
    "1": "Windows",
    "2": "移动端",
    "3": "macOS", 
    "4": "Linux",
    "99": "其他"
  },
  browser: {
    "1": "PC",
    "2": "Android",
    "3": "IOS",
    "4": "iPad", 
    "99": "其他"
  },
  priority: {
    "1": "立即解决",
    "2": "高",
    "3": "中", 
    "4": "低"
  },
  status: {
    "1": "待修复",
    "2": "已解决",
    "3": "已关闭"
  }
}

// 获取严重程度文本
const getSeverityText = (val) => {
  return dictionaries.severity[String(val)] || '未知'
}

// 获取严重程度标签类型
const getSeverityTagType = (val) => {
  const severity = String(val)
  if (severity === '1') return 'danger'  // 致命
  if (severity === '2') return 'warning' // 严重
  if (severity === '3') return 'info'    // 一般
  if (severity === '4') return 'success' // 轻微
  return 'info'
}

// 获取Bug类型文本
const getBugTypeText = (val) => {
  return dictionaries.bugType[String(val)] || '未知'
}

// 获取Bug类型标签类型
const getBugTypeTagType = (val) => {
  const type = String(val)
  if (type === '1') return 'danger'   // 功能缺陷
  if (type === '2') return 'warning'  // 样式缺陷
  if (type === '3') return 'info'     // 设计缺陷
  if (type === '4') return 'success'  // 优化需求
  return 'info'
}

// 获取操作系统文本
const getOperateSystemText = (val) => {
  return dictionaries.operateSystem[String(val)] || '未知'
}

// 获取浏览器文本
const getBrowserText = (val) => {
  return dictionaries.browser[String(val)] || '未知'
}

// 获取Bug环境文本
const getBugEnvironmentText = (val) => {
  return dictionaries.bugEnvironment[String(val)] || '未知'
}

// 获取优先级文本
const getPriorityText = (val) => {
  return dictionaries.priority[String(val)] || '未知'
}

// 获取优先级样式
const getPriorityStyle = (val) => {
  const priority = String(val)
  if (priority === '1') {
    return "color:#FF0B0B;"      // 立即解决 - 红色
  } else if (priority === '2') {
    return "color:#FFA22D"       // 高 - 橙色
  } else if (priority === '3') {
    return "color:#FFD9B1"       // 中 - 浅橙色
  } else if (priority === '4') {
    return "color:#9CA3AF"       // 低 - 灰色
  }
  return "color:#666"
}

// 获取状态文本
const getStatusText = (val) => {
  return dictionaries.status[String(val)] || '未知'
}

// 获取状态标签类型
const getStatusTagType = (val) => {
  const status = String(val)
  if (status === '1') return 'warning'  // 待修复
  if (status === '2') return 'success'  // 已解决
  if (status === '3') return 'info'     // 已关闭
  return 'info'
}
</script>

<style scoped>
/* Bug描述内容样式 - 控制图片和媒体元素 */
.bug-description-content :deep(img) {
  max-width: 100% !important;
  height: auto !important;
  display: block;
  margin: 10px 0;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
}

.bug-description-content :deep(img:hover) {
  transform: scale(1.02);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.bug-description-content :deep(video) {
  max-width: 100% !important;
  height: auto !important;
  display: block;
  margin: 10px 0;
}

.bug-description-content :deep(table) {
  width: 100% !important;
  max-width: 100% !important;
  table-layout: fixed;
  word-wrap: break-word;
}

.bug-description-content :deep(pre) {
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-x: auto;
}

/* 移除了图片预览器相关样式，现在使用ImageViewer组件 */
</style>