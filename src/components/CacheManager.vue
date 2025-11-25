<template>
  <div class="cache-manager-wrapper">
    <!-- 缓存操作按钮 -->
    <div class="cache-buttons">
      <el-button 
        type="success" 
        @click="saveToCache" 
        :loading="loading"
        :disabled="!hasData"
      >
        <el-icon><DocumentAdd /></el-icon> 保存查询
      </el-button>
      
      <el-button 
        type="info" 
        @click="showCacheManager"
      >
        <el-icon><FolderOpened /></el-icon> 历史查询
      </el-button>
    </div>

    <!-- 缓存管理器对话框 -->
    <el-dialog
      v-model="cacheManagerVisible"
      title="历史查询管理"
      width="800px"
      :close-on-click-modal="false"
    >
      <div class="cache-manager">
        <div class="cache-header">
          <span>共 {{ cachedQueries.length }} 条历史记录</span>
          <el-button type="danger" size="small" @click="clearAllCache" :disabled="cachedQueries.length === 0">
            <el-icon><Delete /></el-icon> 清空全部
          </el-button>
        </div>
        
        <el-table :data="cachedQueries" style="width: 100%" max-height="400">
          <!-- <el-table-column prop="name" label="查询名称" width="200" /> -->
          <el-table-column prop="dateRange" label="时间范围"  width="220"/>
          <el-table-column prop="recordCount" label="记录数" />
          <el-table-column prop="saveTime" label="保存时间" />
          <el-table-column label="操作" width="200">
            <template #default="scope">
              <el-button type="primary" size="small" @click="loadFromCache(scope.row)">
                加载
              </el-button>
              <el-button type="danger" size="small" @click="deleteCache(scope.row.id)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { DocumentAdd, FolderOpened, Delete } from '@element-plus/icons-vue'

// Props
const props = defineProps({
  // 是否有数据可以保存
  hasData: {
    type: Boolean,
    default: false
  },
  // 加载状态
  loading: {
    type: Boolean,
    default: false
  },
  // 要保存的数据
  cacheData: {
    type: Object,
    default: () => ({})
  }
})

// Emits
const emit = defineEmits(['load-cache'])

// 响应式数据
const cacheManagerVisible = ref(false)
const cachedQueries = ref([])
const cacheDB = ref(null)

// IndexedDB 初始化
const initCacheDB = async () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('WorkTimeCache', 1)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      cacheDB.value = request.result
      resolve(request.result)
    }
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains('queries')) {
        const store = db.createObjectStore('queries', { keyPath: 'id', autoIncrement: true })
        store.createIndex('dateRange', 'dateRange', { unique: false })
        store.createIndex('saveTime', 'saveTime', { unique: false })
      }
    }
  })
}

// 保存到缓存
const saveToCache = async () => {
  if (!props.hasData || !cacheDB.value || !props.cacheData.timeRange) {
    ElMessage.warning('没有可保存的数据')
    return
  }
  
  try {
    const queryName = `查询_${props.cacheData.timeRange[0]}_${props.cacheData.timeRange[1]}`
    
    // 深度克隆数据，确保可以被IndexedDB序列化
    const cloneData = (data) => {
      return JSON.parse(JSON.stringify(data))
    }
    
    const cacheItem = {
      name: queryName,
      dateRange: `${props.cacheData.timeRange[0]} 至 ${props.cacheData.timeRange[1]}`,
      timeRange: cloneData(props.cacheData.timeRange),
      rawData: cloneData(props.cacheData.rawData || []),
      bugData: cloneData(props.cacheData.bugData || []),
      bugMonth: props.cacheData.bugMonth || '',
      recordCount: (props.cacheData.rawData || []).length,
      saveTime: new Date().toLocaleString(),
      timestamp: Date.now()
    }
    
    const transaction = cacheDB.value.transaction(['queries'], 'readwrite')
    const store = transaction.objectStore('queries')
    await store.add(cacheItem)
    
    ElMessage.success('查询结果已保存到缓存')
    await loadCachedQueries()
  } catch (error) {
    console.error('保存缓存失败:', error)
    ElMessage.error('保存缓存失败')
  }
}

// 加载缓存列表
const loadCachedQueries = async () => {
  if (!cacheDB.value) return
  
  try {
    const transaction = cacheDB.value.transaction(['queries'], 'readonly')
    const store = transaction.objectStore('queries')
    const request = store.getAll()
    
    request.onsuccess = () => {
      cachedQueries.value = request.result.sort((a, b) => b.timestamp - a.timestamp)
    }
  } catch (error) {
    console.error('加载缓存列表失败:', error)
  }
}

// 从缓存加载数据
const loadFromCache = async (cacheItem) => {
  try {
    // 通过emit将数据传递给父组件
    emit('load-cache', cacheItem)
    
    cacheManagerVisible.value = false
    ElMessage.success(`已加载缓存数据：${cacheItem.name}`)
  } catch (error) {
    console.error('加载缓存数据失败:', error)
    ElMessage.error('加载缓存数据失败')
  }
}

// 删除缓存
const deleteCache = async (cacheId) => {
  if (!cacheDB.value) return
  
  try {
    const transaction = cacheDB.value.transaction(['queries'], 'readwrite')
    const store = transaction.objectStore('queries')
    await store.delete(cacheId)
    
    await loadCachedQueries()
    ElMessage.success('缓存记录已删除')
  } catch (error) {
    console.error('删除缓存失败:', error)
    ElMessage.error('删除缓存失败')
  }
}

// 清空所有缓存
const clearAllCache = async () => {
  if (!cacheDB.value) return
  
  try {
    const transaction = cacheDB.value.transaction(['queries'], 'readwrite')
    const store = transaction.objectStore('queries')
    await store.clear()
    
    cachedQueries.value = []
    ElMessage.success('所有缓存已清空')
  } catch (error) {
    console.error('清空缓存失败:', error)
    ElMessage.error('清空缓存失败')
  }
}

// 显示缓存管理器
const showCacheManager = async () => {
  await loadCachedQueries()
  cacheManagerVisible.value = true
}

// 初始化
onMounted(async () => {
  try {
    await initCacheDB()
    await loadCachedQueries()
  } catch (error) {
    console.error('初始化缓存数据库失败:', error)
  }
})

// 暴露方法给父组件
defineExpose({
  initCacheDB,
  loadCachedQueries
})
</script>

<style scoped>
.cache-manager-wrapper {
  display: inline-block;
}

.cache-buttons {
  display: inline-flex;
  gap: 10px;
}

/* 缓存管理器样式 */
.cache-manager {
  padding: 10px 0;
}

.cache-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.cache-header span {
  font-weight: 500;
  color: #606266;
}

.el-table {
  border-radius: 4px;
  overflow: hidden;
}

.el-table .el-button {
  margin: 0 2px;
}

.el-table .el-button + .el-button {
  margin-left: 5px;
}
</style>