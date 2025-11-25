import request from './request'

// 获取工时数据
export const getWorkLogs = (params) => {
  return request({
    url: '/oaManager/issueWorkLog/getData',
    method: 'GET',
    params: {
      startTime: params.startTime,
      endTime: params.endTime,
      page: params.page || 1,
      pageSize: params.pageSize || 9999
    }
  })
}

// 根据任务ID获取工时记录
export const getWorkLogsByTaskId = (taskId) => {
  return request({
    url: '/oaManager/issueWorkLog/getByTaskId',
    method: 'GET',
    params: { taskId }
  })
}

// 添加或更新工时记录
export const addOrUpdateWorkLogs = (taskId, data) => {
  return request({
    url: '/oaManager/issueWorkLog/addOrUpdate',
    method: 'POST',
    params: { taskId },
    data
  })
}

// 获取所有负责用户列表
export const getChargeUserList = () => {
  return request({
    url: '/oaManager/issue/getChargeUserList',
    method: 'GET',
    params: {
      type: 0
    }
  })
}

// 获取Bug数据
export const getBugData = (belongingMonth) => {
  return request({
    url: '/oaManager/issueBug/getPage',
    method: 'GET',
    params: {
      belongingMonth,
      page: 1,
      pageSize: 999
    }
  })
}