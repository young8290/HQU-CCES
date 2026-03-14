# HQU CS 综测填写系统

> 华侨大学 计算机科学与技术学院 学生素质综合测评填写系统
> 基于 B/S 架构的全栈 Web 应用，支持实时分数编辑、Excel 批量导入导出、多角色权限控制

---

## 目录

- [快速开始](#快速开始)
- [系统架构](#系统架构)
- [角色与权限](#角色与权限)
- [功能说明](#功能说明)
- [评分规则](#评分规则)
- [API 接口](#api-接口)
- [项目结构](#项目结构)
- [常见问题](#常见问题)

---

## 快速开始

### 环境要求

- **Node.js** ≥ 18
- **npm** ≥ 9

### 安装与启动

```bash
# 1. 安装全部依赖
npm install

# 2. 初始化数据库 & 创建默认管理员
npm run db:push
npm run db:seed

# 3. 一键启动前后端
npm run dev
```

启动后访问：

| 服务 | 地址 |
|------|------|
| **前端** | http://localhost:3000 |
| **后端 API** | http://localhost:4000 |

### 默认管理员账号

| 用户名 | 密码 |
|--------|------|
| `admin` | `admin123` |

> ⚠️ 首次登录后请在「系统设置」中修改默认密码

### 常用命令

```bash
npm run dev              # 同时启动前后端
npm run dev:backend      # 仅启动后端
npm run dev:frontend     # 仅启动前端
npm run build            # 构建前端生产版本
npm run db:push          # 同步 schema 到数据库
npm run db:seed          # 写入种子数据
npm run db:generate      # 生成 Prisma Client
npm run db:studio        # 打开 Prisma Studio
```

---

## 系统架构

```
浏览器 (Vite + React + Tailwind CSS)
    │
    ├── HTTP REST API ──► Express 后端 (Port 4000)
    │                         │
    └── WebSocket ──────► ws 实时通信
                              │
                         Prisma ORM
                              │
                         SQLite 数据库
```

| 层 | 技术 |
|----|------|
| 前端框架 | Vite 7 + React 19 |
| UI 样式 | Tailwind CSS 4 |
| 前端缓存 | 内存 + `sessionStorage` TTL 缓存（年级、班级、学生、导入日志等查询） |
| 后端框架 | Express + TypeScript |
| 数据库 | SQLite (Prisma ORM) |
| 认证 | JWT + bcrypt |
| 实时通信 | WebSocket (ws) |
| 文件处理 | ExcelJS |

---

## 角色与权限

| 功能 | 管理员 | 班长 |
|------|:------:|:----:|
| 编辑学生分数 | ✅ 全部 | ✅ 仅本班 |
| 编辑学业成绩/体育基础分 | ✅ | ❌ |
| 管理年级/班级/学生 | ✅ | ❌ |
| 导入学业成绩/体育基础分 | ✅（全局匹配学号） | ❌ |
| 导入个人综测表 | ✅ | ✅ 仅本班 |
| 导出附件2 | ✅ | ✅ 仅本班 |
| 导出附件4/ZIP/账号 | ✅ | ❌ |
| 管理班长账号 | ✅ | ❌ |
| 管理学年 | ✅ | ❌ |
| 修改自己密码 | ✅ | ✅ |

---

## 功能说明

### 分数编辑（核心功能）

选择年级 → 班级，进入编辑表格。修改通过 **WebSocket 实时保存**（300ms 防抖），多人同时编辑自动同步。

- 白色输入框 = 可编辑字段
- 灰色字段 = 自动计算（学业成绩、体育基础分、体育总分、总分仅管理员可通过导入修改）

### 数据导入

| 类型 | 权限 | Excel 列 | 计算公式 |
|------|------|---------|---------|
| 学业成绩 | 管理员 | A=学号, F=绩点 | 学业分 = (GPA + 2.5) × 8 |
| 体育基础分 | 管理员 | A=学号, H=体育成绩 | 基础分 = 原始分 × 0.04 |
| 个人综测表 | 管理员/班长 | 按学校模板，每 sheet 一个学生 | — |

- 学业成绩和体育基础分按学号**全局匹配**所有学生，无需选择年级班级
- 个人综测表需选择目标班级

### 数据导出

| 导出项 | 文件命名 | 权限 |
|--------|---------|------|
| 附件2（综测成绩汇总表） | `{年级}{班级}附件2.xlsx` | 管理员/班长 |
| 附件4（学年总评表） | `{年级}{班级}附件4.xlsx` | 管理员 |
| 批量导出 ZIP | `{年级}全部附件.zip` | 管理员 |
| 导入失败记录 | `导入失败记录.xlsx` | 管理员 |
| 账号列表 | `账号列表.xlsx` | 管理员 |

### 学生管理（管理员）

- 创建/删除年级和班级
- 添加/删除学生
- 批量导入学生：Excel 格式 A=年级, B=班级, C=学号, D=姓名

### 账号管理（管理员）

- 按年级批量生成班长账号（用户名 `monitor_{年级}_{班级}`, 随机密码）
- 重置密码、删除账号、导出账号列表

---

## 评分规则

| 维度 | 上限 | 编辑权限 | 说明 |
|------|:----:|---------|------|
| 德育测评 | 100 | 管理员/班长 | 手动填写 |
| 学业学术素质 | 60 | 仅管理员 | 通过导入写入 |
| 创新与实践能力 | 13 | 管理员/班长 | 手动填写 |
| 体育基础分 | — | 仅管理员 | 通过导入写入 |
| 体育奖励分 | 3 | 管理员/班长 | 手动填写 |
| 体育总分 | 7 | 自动计算 | = 基础分 + 奖励分 |
| 美育 | 6 | 管理员/班长 | 手动填写 |
| 劳动教育 | 4 | 管理员/班长 | 手动填写 |
| 公益服务 | 10 | 管理员/班长 | 手动填写 |
| 附加分 | 5 | 管理员/班长 | 手动填写 |
| 总分 | — | 自动计算 | 所有维度之和（不含德育单独参考） |

```
总分 = 学业 + 创新 + 体育总分 + 美育 + 劳动 + 公益服务 + 附加分
```

---

## API 接口

所有 API 以 `/api` 为前缀，需携带 `Authorization: Bearer <token>`。

### 认证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | 登录 |
| GET | `/api/auth/me` | 当前用户信息 |
| PUT | `/api/auth/password` | 修改密码 |

### 年级 & 班级 & 学生

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/grades` | 年级列表 |
| POST | `/api/grades` | 创建年级 |
| GET | `/api/grades/:id/classes` | 班级列表 |
| POST | `/api/grades/:id/classes` | 创建班级 |
| GET | `/api/students?classId=` | 学生列表 |
| POST | `/api/students/batch/:classId` | 批量导入学生 |

### 分数

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/scores/class/:classId` | 班级成绩 |
| PUT | `/api/scores` | 更新分数 |

### 导入

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/import/academic` | 导入学业成绩（全局匹配） |
| POST | `/api/import/sports` | 导入体育基础分（全局匹配） |
| POST | `/api/import/personal/:classId` | 导入个人综测表 |

### 导出

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/export/attachment2/:classId` | 导出附件2 |
| GET | `/api/export/attachment4/:classId` | 导出附件4 |
| GET | `/api/export/all/:gradeId` | 批量导出 ZIP |
| GET | `/api/export/failed-records` | 导出失败记录 |
| GET | `/api/export/accounts` | 导出账号列表 |

### WebSocket

连接：`ws://localhost:4000/ws?token=<JWT>`

| 消息类型 | 方向 | 说明 |
|---------|------|------|
| `join:class` | → 服务端 | 加入班级房间 |
| `score:update` | → 服务端 | 提交分数修改 |
| `score:confirmed` | ← 客户端 | 保存确认 |
| `score:updated` | ← 广播 | 分数更新通知 |

---

## 项目结构

```
.
├── package.json                    # 根配置 (npm workspaces)
├── README.md
├── templates/                      # 导出 Excel 模板 (附件2/附件4)
│
└── packages/
    ├── backend/                    # Express + TypeScript 后端
    │   ├── prisma/
    │   │   ├── schema.prisma       # 数据库模型
    │   │   ├── seed.ts             # 种子数据
    │   │   └── dev.db              # 默认 SQLite 数据库文件
    │   └── src/
    │       ├── index.ts            # 入口
    │       ├── config/             # 评分规则、数据库配置
    │       ├── middleware/         # 认证、权限中间件
    │       ├── routes/             # API 路由
    │       ├── services/           # 业务逻辑 (导入/导出/分数)
    │       ├── utils/              # 计算公式
    │       └── ws/                 # WebSocket 服务
    │
    ├── frontend/                   # Vite + React 前端
    │   ├── accounts/               # 静态路由入口
    │   ├── dashboard/              # 静态路由入口
    │   ├── export/                 # 静态路由入口
    │   ├── import/                 # 静态路由入口
    │   ├── login/                  # 静态路由入口
    │   ├── scores/                 # 静态路由入口
    │   ├── settings/               # 静态路由入口
    │   ├── students/               # 静态路由入口
    │   ├── 404.html                # 404 入口
    │   ├── public/                 # 静态资源 (字体、logo)
    │   ├── index.html              # 根入口
    │   ├── vite.config.ts          # 前端构建与代理配置
    │   └── src/
    │       ├── components/         # React 组件
    │       │   ├── auth/           # 登录
    │       │   ├── common/         # 加载态、通用 UI
    │       │   ├── layout/         # 侧边栏
    │       │   ├── dashboard/      # 仪表盘
    │       │   ├── scores/         # 分数编辑
    │       │   ├── students/       # 学生管理
    │       │   ├── import/         # 数据导入
    │       │   ├── export/         # 数据导出
    │       │   ├── accounts/       # 账号管理
    │       │   └── settings/       # 系统设置
    │       ├── hooks/              # useAuth, useScores
    │       ├── lib/                # API、认证、WebSocket、路由工具
    │       ├── routes/             # 页面路由组件
    │       ├── App.tsx             # 应用入口
    │       ├── main.tsx            # 挂载入口
    │       └── styles/             # 全局样式
```

---

## 常见问题

### 重置数据库

```bash
npm run db:push -- --force-reset
npm run db:seed
```

默认数据库文件为 `packages/backend/prisma/dev.db`。如需切换数据库路径，请修改 `packages/backend/.env` 中的 `DATABASE_URL`。

### 忘记管理员密码

删除或备份 `packages/backend/prisma/dev.db` 后，重新执行 `npm run db:push && npm run db:seed`。

### 备份数据

复制 `packages/backend/prisma/dev.db` 文件即可（SQLite 单文件存储）。

### 端口被占用

- 后端：修改 `packages/backend/.env` 中的 `PORT`
- 前端：修改 `packages/frontend/package.json` 中 dev 脚本的 `--port`
- 同步更新 `packages/frontend/vite.config.ts` 中的代理地址

---

*计算机科学与技术学院 学术部制作*
