<template>
  <!-- 图片预览组件 -->
  <div 
    v-if="visible" 
    class="image-viewer-overlay" 
    @click="handleClose"
    @wheel.prevent="handleWheel"
    @keydown.stop="handleKeydown"
  >
    <div class="image-viewer-container" @click.stop>
      <img 
        :src="imageUrl" 
        class="preview-image"
        :style="{
          transform: `scale(${imageScale}) translate(${imageTranslateX}px, ${imageTranslateY}px)`,
          cursor: imageScale > 1 ? 'grab' : 'default'
        }"
        @mousedown="handleMouseDown"
        @dragstart.prevent
        @load="handleImageLoad"
        @error="handleImageError"
      />
      <button class="close-btn" @click="handleClose">×</button>
      <div class="zoom-controls">
        <button @click="zoomIn" class="zoom-btn">+</button>
        <span class="zoom-level">{{ Math.round(imageScale * 100) }}%</span>
        <button @click="zoomOut" class="zoom-btn">-</button>
        <button @click="resetZoom" class="reset-btn">重置</button>
      </div>
      
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-indicator">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>
      
      <!-- 错误状态 -->
      <div v-if="error" class="error-indicator">
        <p>图片加载失败</p>
        <button @click="retryLoad" class="retry-btn">重试</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  imageUrl: {
    type: String,
    default: ''
  },
  maxZoom: {
    type: Number,
    default: 5
  },
  minZoom: {
    type: Number,
    default: 0.1
  },
  zoomStep: {
    type: Number,
    default: 1.2
  }
})

const emit = defineEmits(['update:visible', 'close'])

// 响应式数据
const imageScale = ref(1)
const imageTranslateX = ref(0)
const imageTranslateY = ref(0)
const loading = ref(false)
const error = ref(false)

// 监听visible变化，重置状态
watch(() => props.visible, (newVal) => {
  if (newVal) {
    resetZoom()
    loading.value = true
    error.value = false
  }
})

// 关闭预览器
const handleClose = () => {
  emit('update:visible', false)
  emit('close')
}

// 缩放控制
const zoomIn = () => {
  imageScale.value = Math.min(imageScale.value * props.zoomStep, props.maxZoom)
}

const zoomOut = () => {
  imageScale.value = Math.max(imageScale.value / props.zoomStep, props.minZoom)
  // 如果缩放比例小于1，重置位置
  if (imageScale.value <= 1) {
    imageTranslateX.value = 0
    imageTranslateY.value = 0
  }
}

const resetZoom = () => {
  imageScale.value = 1
  imageTranslateX.value = 0
  imageTranslateY.value = 0
}

// 鼠标滚轮缩放
const handleWheel = (e) => {
  const delta = e.deltaY > 0 ? -1 : 1
  const zoomFactor = 1.1
  
  if (delta > 0) {
    imageScale.value = Math.min(imageScale.value * zoomFactor, props.maxZoom)
  } else {
    imageScale.value = Math.max(imageScale.value / zoomFactor, props.minZoom)
    // 如果缩放比例小于1，重置位置
    if (imageScale.value <= 1) {
      imageTranslateX.value = 0
      imageTranslateY.value = 0
    }
  }
}

// 拖拽功能
let isDragging = false
let startX = 0
let startY = 0
let startTranslateX = 0
let startTranslateY = 0

const handleMouseDown = (e) => {
  if (imageScale.value <= 1) return
  
  isDragging = true
  startX = e.clientX
  startY = e.clientY
  startTranslateX = imageTranslateX.value
  startTranslateY = imageTranslateY.value
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
  e.target.style.cursor = 'grabbing'
}

const handleMouseMove = (e) => {
  if (!isDragging) return
  
  const deltaX = e.clientX - startX
  const deltaY = e.clientY - startY
  
  imageTranslateX.value = startTranslateX + deltaX / imageScale.value
  imageTranslateY.value = startTranslateY + deltaY / imageScale.value
}

const handleMouseUp = (e) => {
  isDragging = false
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
  if (e.target) {
    e.target.style.cursor = imageScale.value > 1 ? 'grab' : 'default'
  }
}

// 图片加载事件
const handleImageLoad = () => {
  loading.value = false
  error.value = false
}

const handleImageError = () => {
  loading.value = false
  error.value = true
}

const retryLoad = () => {
  loading.value = true
  error.value = false
  // 强制重新加载图片
  const img = document.querySelector('.preview-image')
  if (img) {
    img.src = props.imageUrl + '?t=' + Date.now()
  }
}

// 键盘事件支持
const handleKeydown = (e) => {
  if (!props.visible) return
  
  switch (e.key) {
    case 'Escape':
      e.preventDefault()
      e.stopPropagation()
      handleClose()
      break
    case '+':
    case '=':
      e.preventDefault()
      zoomIn()
      break
    case '-':
      e.preventDefault()
      zoomOut()
      break
    case '0':
      e.preventDefault()
      resetZoom()
      break
  }
}

// 添加键盘事件监听
watch(() => props.visible, (newVal) => {
  if (newVal) {
    // 使用capture模式确保事件优先处理
    document.addEventListener('keydown', handleKeydown, true)
  } else {
    document.removeEventListener('keydown', handleKeydown, true)
  }
})

// 组件卸载时清理事件监听器
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown, true)
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
})
</script>

<style scoped>
/* 图片预览器样式 */
.image-viewer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  backdrop-filter: blur(2px);
}

.image-viewer-container {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  transition: transform 0.1s ease-out;
  user-select: none;
}

.close-btn {
  position: absolute;
  top: -40px;
  right: -40px;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  font-size: 24px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: white;
  transform: scale(1.1);
}

/* 缩放控制按钮 */
.zoom-controls {
  position: absolute;
  bottom: -60px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(0, 0, 0, 0.7);
  padding: 10px 15px;
  border-radius: 25px;
  color: white;
  backdrop-filter: blur(4px);
}

.zoom-btn {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.3s ease;
}

.zoom-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.zoom-level {
  font-size: 14px;
  font-weight: 500;
  min-width: 50px;
  text-align: center;
}

.reset-btn {
  padding: 5px 12px;
  border: none;
  border-radius: 15px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.reset-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 加载和错误状态 */
.loading-indicator,
.error-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: white;
  background: rgba(0, 0, 0, 0.7);
  padding: 20px;
  border-radius: 8px;
  backdrop-filter: blur(4px);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.retry-btn {
  margin-top: 10px;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background: #007bff;
  color: white;
  cursor: pointer;
  transition: background 0.3s ease;
}

.retry-btn:hover {
  background: #0056b3;
}
</style>