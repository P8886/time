# Vue3 工时查询系统

基于Vue3 + Vite + Element Plus构建的现代化工时查询和记录系统。

## 功能特性

- 🚀 **现代化技术栈**: Vue3 组合式API + Vite + Element Plus
- 📊 **工时查询**: 支持时间范围查询、数据统计分析
- 📝 **工时记录**: 便捷的工时录入和管理功能
- 🐛 **Bug管理**: Bug数据查询和详情展示
- 🔒 **安全防护**: IP白名单、开发者工具禁用
- 📱 **响应式设计**: 适配各种屏幕尺寸
- 🎨 **美观界面**: 现代化UI设计，良好的用户体验

## 项目结构

```
vue-worktime-system/
├── public/                 # 静态资源
├── src/
│   ├── api/               # API接口封装
│   │   ├── request.js     # axios配置和拦截器
│   │   ├── auth.js        # 认证相关API
│   │   └── worklog.js     # 工时相关API
│   ├── components/        # 公共组件
│   │   ├── WorkTimeDetail.vue  # 工时详情组件
│   │   └── BugDetail.vue       # Bug详情组件
│   ├── router/            # 路由配置
│   │   └── index.js
│   ├── styles/            # 样式文件
│   │   └── global.scss    # 全局样式
│   ├── utils/             # 工具函数
│   │   ├── common.js      # 通用工具函数
│   │   └── security.js    # 安全相关工具
│   ├── views/             # 页面组件
│   │   ├── WorkTimeQuery.vue  # 工时查询页面
│   │   └── RecordTime.vue     # 工时记录页面
│   ├── App.vue            # 根组件
│   └── main.js            # 入口文件
├── index.html             # HTML模板
├── package.json           # 项目配置
├── vite.config.js         # Vite配置
└── README.md              # 项目说明
```

## 技术栈

- **前端框架**: Vue 3.4+
- **构建工具**: Vite 5.0+
- **UI组件库**: Element Plus 2.4+
- **HTTP客户端**: Axios 1.6+
- **样式预处理**: Sass
- **图标**: Element Plus Icons

## 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0

### 安装依赖

```bash
cd vue-worktime-system
npm install
```

### 开发环境启动

```bash
npm run dev
```

访问 http://localhost:3000

### 生产环境构建

```bash
npm run build
```

### 预览构建结果

```bash
npm run preview
```

## 主要功能

### 1. 工时查询系统

- **时间范围查询**: 支持自定义时间范围查询工时数据
- **数据统计**: 实时计算总工时、平均工时、Bug率等统计指标
- **用户管理**: 支持用户筛选和详情查看
- **数据导出**: 支持工时数据的详细查看和分析

### 2. 工时记录系统

- **便捷录入**: 直观的表格式工时录入界面
- **数据验证**: 完善的数据校验机制
- **实时保存**: 支持实时保存和数据同步
- **用户切换**: 支持多用户登录和切换

### 3. Bug管理系统

- **Bug查询**: 支持按用户查询Bug记录
- **详情展示**: 完整的Bug信息展示
- **环境区分**: 区分产线和测试环境Bug
- **优先级管理**: Bug优先级和状态管理

### 4. 安全特性

- **IP白名单**: 基于IP地址的访问控制
- **开发者工具禁用**: 防止恶意调试
- **Token管理**: 安全的用户认证机制
- **数据加密**: 敏感数据传输加密

## API接口

### 认证接口

- `POST /login` - 用户登录

### 工时接口

- `GET /oaManager/issueWorkLog/getData` - 获取工时数据
- `GET /oaManager/issueWorkLog/getByTaskId` - 根据任务ID获取工时
- `POST /oaManager/issueWorkLog/addOrUpdate` - 添加或更新工时记录

### Bug接口

- `GET /oaManager/issueBug/getPage` - 获取Bug数据

## 配置说明

### Vite配置

项目使用Vite作为构建工具，配置文件为`vite.config.js`：

- 支持Vue3单文件组件
- 路径别名配置（@指向src目录）
- 开发服务器端口3000
- 自动打开浏览器

### Axios配置

HTTP请求配置在`src/api/request.js`中：

- 统一的请求/响应拦截器
- 自动Token注入
- 错误处理和用户提示
- 请求超时设置

### 样式配置

- 使用Sass预处理器
- 全局样式统一管理
- 响应式设计支持
- Element Plus主题定制

## 部署说明

### 开发环境部署

1. 克隆项目到本地
2. 安装依赖：`npm install`
3. 启动开发服务器：`npm run dev`
4. 访问 http://localhost:3000

### 生产环境部署

1. 构建项目：`npm run build`
2. 将`dist`目录部署到Web服务器
3. 配置反向代理（如需要）
4. 确保API接口可正常访问

### Docker部署（可选）

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

## 注意事项

1. **安全配置**: 请根据实际需求配置IP白名单
2. **API地址**: 请确保API接口地址正确配置
3. **浏览器兼容**: 建议使用现代浏览器（Chrome、Firefox、Safari、Edge）
4. **网络环境**: 确保能正常访问后端API接口

## 更新日志

### v1.0.0 (2025-01-12)

- ✨ 初始版本发布
- 🚀 基于Vue3 + Vite重构原有系统
- 📊 完整的工时查询和统计功能
- 📝 便捷的工时记录功能
- 🐛 Bug管理和查询功能
- 🔒 安全防护机制
- 📱 响应式设计支持

## 技术支持

如有问题或建议，请联系开发团队。

## 许可证

本项目仅供内部使用，请勿外传。