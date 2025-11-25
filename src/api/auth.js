import request from './request'

// 用户登录
export const login = (data) => {
  return request({
    url: '/login',
    method: 'POST',
    data: {
      userName: data.userName,
      password: data.password
    }
  })
}

// 刷新Token（如果需要）
export const refreshToken = () => {
  return request({
    url: '/login',
    method: 'POST',
    data: {
      userName: '汤雨涛',
      password: 'tyt123456789'
    }
  })
}