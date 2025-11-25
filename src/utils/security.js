// 安全工具类 - IP白名单检查和开发者工具禁用

// IP白名单配置
const ipWhitelist = [
  '127.0.0.1',
  'localhost',
  '49.157.61.115'
]

// 检查IP是否在白名单中
export const checkIPWhitelist = async () => {
  try {
    // 检查是否为本地访问
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
      return true
    }
    
    // 获取公网IP地址
    const response = await fetch('https://api.ipify.org?format=json')
    const data = await response.json()
    const userIP = data.ip
    console.log('检测到的公网IP:', userIP)
    
    // 检查IP是否在白名单中
    for (const allowedIP of ipWhitelist) {
      if (allowedIP.includes('/')) {
        // CIDR格式的网段检查（简化版）
        const [network, prefix] = allowedIP.split('/')
        const networkParts = network.split('.').map(Number)
        const userParts = userIP.split('.').map(Number)
        
        // 简单的网段匹配（仅支持/8, /16, /24）
        if (prefix === '8' && networkParts[0] === userParts[0]) return true
        if (prefix === '16' && networkParts[0] === userParts[0] && networkParts[1] === userParts[1]) return true
        if (prefix === '24' && networkParts[0] === userParts[0] && networkParts[1] === userParts[1] && networkParts[2] === userParts[2]) return true
      } else {
        // 精确IP匹配
        if (userIP === allowedIP) {
          console.log('IP通过白名单验证:', userIP)
          return true
        }
      }
    }
    
    console.log('IP不在白名单中:', userIP)
    return false
  } catch (error) {
    console.error('IP检查失败:', error)
    // 如果IP检查失败，默认允许访问（可根据安全需求调整）
    return true
  }
}

// 禁用开发者工具和右键菜单
export const disableDeveloperTools = () => {
  // 禁用F12开发者工具
  document.addEventListener('keydown', function(e) {
    // 禁用F12
    if (e.key === 'F12') {
      e.preventDefault()
      return false
    }
    
    // 禁用Ctrl+Shift+C
    // if (e.ctrlKey && e.shiftKey && e.key === 'C') {
    //   e.preventDefault()
    //   return false
    // }
    // 禁用Ctrl+Shift+I
    if (e.ctrlKey && e.shiftKey && e.key === 'I') {
      e.preventDefault()
      return false
    }
    // 禁用Ctrl+Shift+J
    if (e.ctrlKey && e.shiftKey && e.key === 'J') {
      e.preventDefault()
      return false
    }
    // 禁用Ctrl+U
    if (e.ctrlKey && e.key === 'u') {
      e.preventDefault()
      return false
    }
  })
  
  // 禁用右键菜单
  document.addEventListener('contextmenu', function(e) {
    e.preventDefault()
    return false
  })
}

// 初始化安全检查
export const initSecurity = async (options = {}) => {
  const { enableIPCheck = true, enableDevToolsDisable = true } = options
  
  // 启用开发者工具禁用
  if (enableDevToolsDisable) {
    disableDeveloperTools()
  }
  
  // 启用IP白名单检查
  if (enableIPCheck) {
    const isAllowed = await checkIPWhitelist()
    return isAllowed
  }
  
  return true
}