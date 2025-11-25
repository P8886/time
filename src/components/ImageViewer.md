# ImageViewer 图片预览组件

一个功能完整的图片预览组件，支持缩放、拖拽、键盘操作等功能。

## 功能特性

- ✅ 鼠标滚轮缩放（支持5倍放大，0.1倍缩小）
- ✅ 拖拽移动（放大后可拖拽）
- ✅ 键盘快捷键支持
- ✅ 缩放控制面板
- ✅ 加载状态和错误处理
- ✅ 响应式设计
- ✅ 可自定义配置

## 基本用法

```vue
<template>
  <div>
    <!-- 触发按钮 -->
    <img 
      src="your-image.jpg" 
      @click="showPreview" 
      style="cursor: pointer; width: 200px;"
    />
    
    <!-- 图片预览组件 -->
    <ImageViewer
      v-model:visible="previewVisible"
      :image-url="currentImage"
      @close="handleClose"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ImageViewer from '@/components/ImageViewer.vue'

const previewVisible = ref(false)
const currentImage = ref('')

const showPreview = () => {
  currentImage.value = 'your-image.jpg'
  previewVisible.value = true
}

const handleClose = () => {
  console.log('图片预览已关闭')
}
</script>
```

## 高级用法

```vue
<template>
  <ImageViewer
    v-model:visible="previewVisible"
    :image-url="currentImage"
    :max-zoom="10"
    :min-zoom="0.2"
    :zoom-step="1.5"
    @close="handleClose"
  />
</template>

<script setup>
import { ref } from 'vue'
import ImageViewer from '@/components/ImageViewer.vue'

const previewVisible = ref(false)
const currentImage = ref('https://example.com/large-image.jpg')

const handleClose = () => {
  previewVisible.value = false
}
</script>
```

## Props 属性

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `visible` | Boolean | `false` | 控制预览器显示/隐藏 |
| `imageUrl` | String | `''` | 要预览的图片URL |
| `maxZoom` | Number | `5` | 最大缩放倍数 |
| `minZoom` | Number | `0.1` | 最小缩放倍数 |
| `zoomStep` | Number | `1.2` | 缩放步长 |

## Events 事件

| 事件名 | 参数 | 说明 |
|--------|------|------|
| `update:visible` | `(visible: boolean)` | 预览器显示状态变化 |
| `close` | - | 预览器关闭时触发 |

## 键盘快捷键

| 按键 | 功能 |
|------|------|
| `Escape` | 关闭预览器 |
| `+` / `=` | 放大图片 |
| `-` | 缩小图片 |
| `0` | 重置缩放 |

## 鼠标操作

| 操作 | 功能 |
|------|------|
| 滚轮向上 | 放大图片 |
| 滚轮向下 | 缩小图片 |
| 拖拽 | 移动图片（仅在放大状态下） |
| 点击背景 | 关闭预览器 |

## 在v-html中使用

如果你需要为通过`v-html`渲染的图片添加预览功能，可以参考以下方式：

```vue
<template>
  <div>
    <!-- 包含图片的HTML内容 -->
    <div 
      v-html="htmlContent" 
      class="content-with-images"
      @click="handleImageClick"
    ></div>
    
    <!-- 图片预览组件 -->
    <ImageViewer
      v-model:visible="previewVisible"
      :image-url="currentImage"
    />
  </div>
</template>

<script setup>
import { ref, nextTick, watch } from 'vue'
import ImageViewer from '@/components/ImageViewer.vue'

const htmlContent = ref('<p>一些包含图片的HTML内容 <img src="image1.jpg" /> 更多内容</p>')
const previewVisible = ref(false)
const currentImage = ref('')

// 处理图片点击事件
const handleImageClick = (e) => {
  if (e.target.tagName === 'IMG') {
    currentImage.value = e.target.src
    previewVisible.value = true
  }
}

// 为动态加载的图片添加样式
watch(htmlContent, () => {
  nextTick(() => {
    const images = document.querySelectorAll('.content-with-images img')
    images.forEach(img => {
      img.style.cursor = 'pointer'
      img.style.transition = 'all 0.3s ease'
    })
  })
}, { immediate: true })
</script>

<style scoped>
.content-with-images :deep(img) {
  cursor: pointer;
  transition: all 0.3s ease;
}

.content-with-images :deep(img:hover) {
  transform: scale(1.02);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}
</style>
```

## 样式自定义

组件使用了scoped样式，如果需要自定义样式，可以通过CSS变量或者深度选择器：

```vue
<style>
/* 自定义背景色 */
.image-viewer-overlay {
  background: rgba(0, 0, 0, 0.9) !important;
}

/* 自定义控制面板样式 */
.zoom-controls {
  background: rgba(255, 255, 255, 0.1) !important;
}
</style>
```

## 注意事项

1. **图片加载**：组件会自动处理图片加载状态和错误状态
2. **内存管理**：组件会在关闭时自动清理事件监听器
3. **键盘事件**：只有在预览器打开时才会监听键盘事件
4. **拖拽限制**：只有在缩放比例大于100%时才能拖拽
5. **性能优化**：使用了防抖和节流来优化滚轮缩放性能

## 兼容性

- 支持现代浏览器（Chrome 60+, Firefox 60+, Safari 12+）
- 支持移动端触摸操作
- 支持键盘无障碍访问