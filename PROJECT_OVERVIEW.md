# UI-PrimeNG 项目概览

## 项目简介

这是一个基于 **Angular 18** 和 **PrimeNG** 的前端应用，用于管理虚拟目标（Virtual Targets）。项目采用现代 Angular standalone 组件架构，目前使用 mock 数据作为原型。

## 技术栈

- **Angular 18.2** - 前端框架，使用 standalone 组件
- **PrimeNG 17.18** - UI 组件库
- **PrimeIcons 7.0** - 图标库
- **RxJS 7.8** - 响应式编程
- **TypeScript 5.5** - 类型安全
- **Jasmine + Karma** - 测试框架

## 项目结构

```
ui-primeng/
├── src/
│   ├── app/
│   │   ├── core/                                        # 核心模块
│   │   │   ├── layout/
│   │   │   │   └── main-layout/                        # 主布局组件
│   │   │   │       ├── main-layout.component.ts        # 侧边栏导航 + 路由出口
│   │   │   │       ├── main-layout.component.html
│   │   │   │       └── main-layout.component.scss
│   │   │   └── services/                               # 核心服务
│   │   │       ├── virtual-target-control.service.ts   # 虚拟目标控制服务（含 mock 数据）
│   │   │       └── virtual-target-manager.service.ts   # 虚拟目标管理服务（收藏功能）
│   │   │
│   │   ├── shared/                                     # 共享模块
│   │   │   └── models/                                 # 数据模型
│   │   │       ├── api-response.interface.ts           # API 响应接口
│   │   │       └── virtual-target.interface.ts         # 虚拟目标数据模型
│   │   │
│   │   ├── virtual-targets/                            # 虚拟目标功能模块
│   │   │   ├── virtual-targets.component.ts            # 主页面组件逻辑
│   │   │   ├── virtual-targets.component.html          # 页面模板
│   │   │   └── virtual-targets.component.scss          # 页面样式
│   │   │
│   │   ├── app.component.ts                            # 根组件
│   │   ├── app.component.html                          # 根组件模板
│   │   ├── app.component.scss                          # 根组件样式
│   │   ├── app.config.ts                               # 应用配置
│   │   └── app.routes.ts                               # 路由配置
│   │
│   ├── main.ts                                         # 应用入口
│   ├── index.html                                      # HTML 模板
│   └── styles.scss                                     # 全局样式
│
├── public/                                             # 静态资源
│   └── favicon.ico
│
├── package.json                                        # 依赖配置
├── tsconfig.json                                       # TypeScript 配置
├── tsconfig.app.json                                   # 应用 TS 配置
├── tsconfig.spec.json                                  # 测试 TS 配置
└── angular.json                                        # Angular CLI 配置
```

## 核心功能

### 1. 虚拟目标列表页面

**位置**: `src/app/virtual-targets/virtual-targets.component.ts`

**功能特性**:
- ✅ **平台筛选**: SIMICS / QEMU 单选切换
- ✅ **搜索功能**: 按名称或 ID（barcode）实时搜索
- ✅ **收藏过滤**: 仅显示已收藏的目标
- ✅ **数据表格**:
  - 可排序列（名称、ID、创建者）
  - 分页显示（每页 50 条）
  - 收藏标记（星标图标，可点击切换）
  - Singleton 标识（圆点图标）
  - 预留按钮（RESERVE，根据条件禁用）
- ✅ **条件逻辑**:
  - 如果 `createdBy` 为空，显示警告图标且禁用预留按钮
  - 如果 `isReservable` 为 false，禁用预留按钮

### 2. 数据模型

#### VirtualTarget 接口
```typescript
export interface VirtualTarget {
  id: string;                      // 唯一标识
  name: string;                    // 目标名称
  barcode: string;                 // 目标 ID/条码
  target_type: string;             // 目标类型
  createdBy: string;               // 创建者
  architecture?: string;           // 架构（如 x86_64, aarch64）
  os?: string;                     // 操作系统
  platform: 'SIMICS' | 'QEMU';    // 平台类型
  version?: string;                // 版本号
  favorite: boolean;               // 是否收藏
  is_singleton: boolean;           // 是否为单例
  isReservable: boolean;           // 是否可预留
}
```

#### ApiResponse 接口
```typescript
export interface ApiResponse {
  status: string;                  // 响应状态
  data: any[];                     // 数据数组
  total?: number;                  // 总记录数
  count?: number;                  // 当前返回数量
  message?: string;                // 消息
}
```

### 3. 服务层

#### VirtualTargetControlService
**位置**: `src/app/core/services/virtual-target-control.service.ts`

**功能**:
- 提供 12 条 mock 虚拟目标数据
- 实现筛选逻辑（平台、搜索文本、收藏）
- 实现排序逻辑（按列名和顺序）
- 更新收藏状态

**Mock 数据包含**:
- 6 个 SIMICS 目标
- 6 个 QEMU 目标
- 不同架构：x86_64, aarch64, arm, riscv64
- 不同操作系统：Linux, VxWorks, Ubuntu, Debian

#### VirtualTargetManagerService
**位置**: `src/app/core/services/virtual-target-manager.service.ts`

**功能**:
- 添加收藏（返回 mock 成功响应）
- 删除收藏（返回 mock 成功响应）

### 4. 布局组件

#### MainLayoutComponent
**位置**: `src/app/core/layout/main-layout/main-layout.component.ts`

**功能**:
- 提供侧边栏导航（可折叠）
- 使用 PrimeNG Menu 组件
- 包含路由出口用于显示子页面
- 当前菜单项：Virtual Targets

### 5. 路由配置

**位置**: `src/app/app.routes.ts`

```typescript
export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', redirectTo: 'virtual-targets', pathMatch: 'full' },
      { path: 'virtual-targets', component: VirtualTargetsComponent }
    ]
  }
];
```

- 根路径重定向到 `/virtual-targets`
- 所有页面使用 MainLayout 布局

## 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器（http://localhost:4200）
npm start

# 构建生产版本
npm run build

# 监听模式构建
npm run watch

# 运行单元测试
npm run test
```

## 当前状态

### ✅ 已完成
- Angular 18 项目基础架构
- PrimeNG 组件集成
- 虚拟目标列表页面 UI
- 筛选、搜索、排序功能
- 收藏功能（前端逻辑）
- Mock 数据服务

### 🚧 待完成
- 连接真实后端 API
- 实现预留（RESERVE）功能
- 添加更多页面和功能
- 完善单元测试
- 添加 E2E 测试
- 国际化支持（i18n）
- 错误处理和加载状态优化

## 设计模式

### Standalone 组件
项目使用 Angular 18 的 standalone 组件架构，无需 NgModule：
- 每个组件独立声明依赖
- 更好的 tree-shaking
- 更简洁的代码结构

### 服务注入
使用 `providedIn: 'root'` 实现单例服务：
```typescript
@Injectable({
  providedIn: 'root'
})
```

### 响应式编程
使用 RxJS Observable 处理异步数据流：
```typescript
getVirtualTargetTemplates(): Observable<ApiResponse>
```

## PrimeNG 组件使用

项目中使用的 PrimeNG 组件：
- **Table** (`p-table`) - 数据表格，支持排序、分页
- **Button** (`p-button`) - 按钮组件
- **InputText** (`pInputText`) - 文本输入框
- **RadioButton** (`p-radioButton`) - 单选按钮
- **Checkbox** (`p-checkbox`) - 复选框
- **Menu** (`p-menu`) - 菜单组件

## 注意事项

1. **Mock 数据**: 当前所有数据都是前端 mock，未连接后端 API
2. **内存操作**: 所有数据操作（筛选、排序、收藏）都在前端内存中完成
3. **预留功能**: RESERVE 按钮目前无实际功能，仅 UI 展示
4. **扩展性**: 代码结构清晰，易于添加新功能和页面

## 未来扩展方向

1. **API 集成**: 替换 mock 服务为真实 HTTP 调用
2. **状态管理**: 考虑引入 NgRx 或 Akita 进行状态管理
3. **更多功能页面**: 
   - 目标详情页
   - 预留管理页
   - 用户管理页
4. **权限控制**: 基于角色的访问控制（RBAC）
5. **实时更新**: WebSocket 或 SSE 实现实时数据推送
6. **性能优化**: 虚拟滚动、懒加载等

---

**文档创建时间**: 2026-04-15  
**项目版本**: 0.0.0  
**Angular 版本**: 18.2.0  
**PrimeNG 版本**: 17.18.15
