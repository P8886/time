import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建axios实例
const request = axios.create({
  baseURL: 'https://products-api-o2o-prod.gs-souvenir.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json;charset=UTF-8',
    'accept': 'application/json, text/plain, */*',
    'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'language': 'zh'
  }
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    // 优先使用页面专用Token，如果没有则使用公共Token
    const pageToken = localStorage.getItem('recordPageToken')
    const publicToken = localStorage.getItem('workTimeToken')
    const token = pageToken || publicToken
    
    if (token) {
      config.headers['token'] = token
    }
    
    // 添加其他必要的请求头
    config.headers['referrer'] = 'https://o2o-manage-prod.gs-souvenir.com/'
    config.headers['referrerPolicy'] = 'strict-origin-when-cross-origin'
    
    return config
  },
  error => {
    console.error('请求拦截器错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    const { data } = response
    
    // 统一处理响应数据
    if (data.success !== undefined) {
      if (data.success) {
        return response
      } else {
        ElMessage.error(data.message || '请求失败')
        return Promise.reject(new Error(data.message || '请求失败'))
      }
    }
    
    // 兼容不同的响应格式
    if (data.code !== undefined) {
      if (data.code === 200) {
        return response
      } else {
        ElMessage.error(data.message || '请求失败')
        return Promise.reject(new Error(data.message || '请求失败'))
      }
    }
    
    return response
  },
  error => {
    console.error('响应拦截器错误:', error)
    
    // 处理401未授权错误
    if (error.response && error.response.status === 401) {
      // 清除本地存储的token和用户信息
      localStorage.removeItem('workTimeToken')
      localStorage.removeItem('workTimeUserInfo')
      localStorage.removeItem('workTimeCredentials')
      
      ElMessage.error('登录已过期，请重新登录')
      
      // 刷新页面重新登录
      setTimeout(() => {
        window.location.reload()
      }, 1500)
      
      return Promise.reject(error)
    }
    
    // 处理网络错误
    if (!error.response) {
      ElMessage.error('网络连接失败，请检查网络')
    } else {
      const message = error.response.data?.message || error.message || '请求失败'
      ElMessage.error(message)
    }
    
    return Promise.reject(error)
  }
)

export default request