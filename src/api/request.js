import axios from 'axios'
import { ElMessage } from 'element-plus'

// 固定Token配置 - 如果注释或删除此行，将使用原来的逻辑
const fixedToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6MTM5LCJ1c2VyTmFtZSI6Iml0cXVvdGUiLCJleHAiOjE3NjQ5NTk4MDh9.6iYkKwOD84J93f49Fj6s_8hNbtOioIun-dZgzxfoMYs'

// 创建axios实例
const request = axios.create({
  baseURL: 'https://products-api-o2o-prod.gs-souvenir.com',
  timeout: 100000,
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
    // 检查是否是登录请求，登录请求不需要token
    const isLoginRequest = config.url === '/login'
    
    if (!isLoginRequest) {
      let token = null
      
      // 优先使用localStorage中的token
      const pageToken = localStorage.getItem('recordPageToken')
      const publicToken = localStorage.getItem('workTimeToken')
      token = pageToken || publicToken
      
      // 如果localStorage中没有token，再使用固定token配置
      if (!token && typeof fixedToken !== 'undefined' && fixedToken) {
        token = fixedToken
        localStorage.setItem('workTimeToken', token)
      }
      
      // 如果还是没有token，触发登录弹窗
      if (!token) {
        // 触发全局登录事件
        window.dispatchEvent(new CustomEvent('showLoginModal'))
        return Promise.reject(new Error('需要登录'))
      }
      
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
    const { data, config } = response
    const isLoginRequest = config.url === '/login'
    
    // 统一处理响应数据
    if (data.success !== undefined) {
      if (data.success) {
        return response
      } else {
        // 登录请求的错误由组件自己处理，不在这里显示
        if (!isLoginRequest) {
          ElMessage.error(data.message || '请求失败')
        }
        return Promise.reject(new Error(data.message || '请求失败'))
      }
    }
    
    // 兼容不同的响应格式
    if (data.code !== undefined) {
      if (data.code === 200) {
        return response
      } else {
        // 登录请求的错误由组件自己处理，不在这里显示
        if (!isLoginRequest) {
          ElMessage.error(data.message || '请求失败')
        }
        return Promise.reject(new Error(data.message || '请求失败'))
      }
    }
    
    return response
  },
  error => {
    console.error('响应拦截器错误:', error)
    
    const isLoginRequest = error.config?.url === '/login'
    
    // 处理401未授权错误
    if (error.response && error.response.status === 401) {
      // 检查是否使用固定token
      if (typeof fixedToken === 'undefined' || !fixedToken) {
        // 只有在不使用固定token时才清除本地token
        localStorage.removeItem('workTimeToken')
        localStorage.removeItem('workTimeUserInfo')
        localStorage.removeItem('workTimeCredentials')
        
        // 触发登录弹窗
        window.dispatchEvent(new CustomEvent('showLoginModal'))
      }
      
      // 登录请求的401错误由组件自己处理
      if (!isLoginRequest) {
        ElMessage.error('登录已过期或token无效')
      }
      return Promise.reject(error)
    }
    
    // 处理网络错误
    if (!error.response) {
      // 登录请求的网络错误由组件自己处理
      if (!isLoginRequest) {
        ElMessage.error('网络连接失败，请检查网络')
      }
    } else {
      const message = error.response.data?.message || error.message || '请求失败'
      // 登录请求的错误由组件自己处理
      if (!isLoginRequest) {
        ElMessage.error(message)
      }
    }
    
    return Promise.reject(error)
  }
)

export default request