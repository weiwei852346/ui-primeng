# 虚拟目标机交互页面实现文档

## 概述

本文档记录了虚拟目标机交互页面的实现细节，该页面用于与已订阅（Reserved）的虚拟目标机进行实时交互。

## 实现日期

2026年4月15日

## 功能特性

- **实时终端交互**：通过 WebSocket 连接到后端 Docker 容器，提供 Web 终端界面
- **响应式布局**：70/30 分栏布局（左侧终端，右侧信息面板）
- **深色工业主题**：专业的深色终端风格
- **连接状态监控**：实时显示 WebSocket 连接状态
- **手动连接控制**：支持手动重连和断开连接
- **目标机信息展示**：显示目标机的基本信息

## 技术栈

- **Angular 18**：使用 standalone 组件架构
- **PrimeNG 17.18.15**：UI 组件库（Splitter, Button, Card）
- **xterm.js 5.3.0**：Web 终端模拟器
- **xterm-addon-fit 0.8.0**：终端自适应插件
- **WebSocket API**：原生浏览器 WebSocket
- **RxJS**：响应式编程（Subject, BehaviorSubject）

## 项目结构

### 新建文件

```
src/app/
├── terminal-interaction/
│   ├── terminal-interaction.component.ts       # 主组件逻辑
│   ├── terminal-interaction.component.html     # 模板
│   └── terminal-interaction.component.scss     # 样式
├── core/services/
│   └── websocket-terminal.service.ts           # WebSocket 连接管理服务
└── shared/models/
    └── terminal-connection.interface.ts        # 终端连接状态接口
```

### 修改文件

- `src/app/app.routes.ts` - 添加 `/terminal-interaction` 路由
- `src/app/virtual-targets/virtual-targets.component.ts` - 添加 `onReserve()` 方法
- `src/app/virtual-targets/virtual-targets.component.html` - RESERVE 按钮添加点击事件
- `angular.json` - 引入 xterm.css 样式

## 核心实现

### 1. 数据模型

**文件**: `src/app/shared/models/terminal-connection.interface.ts`

```typescript
export interface TerminalConnectionStatus {
  connected: boolean;
  lastConnected?: Date;
  lastDisconnected?: Date;
  errorMessage?: string;
}
```

### 2. WebSocket 服务

**文件**: `src/app/core/services/websocket-terminal.service.ts`

**核心功能**:
- 管理 WebSocket 连接生命周期
- 提供消息流（Observable）
- 提供连接状态流（BehaviorSubject）
- 纯文本消息格式（不使用 JSON 包装）

**WebSocket URL**: `ws://localhost:3000`（可配置）

**关键方法**:
```typescript
connect(targetId: string): void          // 连接到 WebSocket
send(data: string): void                 // 发送数据到服务器
disconnect(): void                       // 断开连接
getStatus(): Observable<TerminalConnectionStatus>  // 获取连接状态流
getMessages(): Observable<string>        // 获取消息流
```

### 3. 终端交互组件

**文件**: `src/app/terminal-interaction/terminal-interaction.component.ts`

**核心功能**:
1. **数据获取**：通过 Router state 从虚拟目标列表页面获取 VirtualTarget 对象
2. **xterm.js 集成**：
   - 深色主题配置（绿色文字，黑色背景）
   - FitAddon 实现自适应窗口大小
   - 监听用户输入并发送到 WebSocket
3. **WebSocket 连接**：
   - 页面加载时自动连接
   - 接收服务器消息并写入终端
   - 连接状态实时更新
4. **生命周期管理**：
   - ngOnDestroy 中清理资源（断开连接、销毁终端、取消订阅）

**xterm.js 配置**:
```typescript
{
  cursorBlink: true,
  cursorStyle: 'block',
  fontSize: 14,
  fontFamily: 'Menlo, Monaco, "Courier New", monospace',
  theme: terminalTheme,  // 深色主题
  scrollback: 1000,
  convertEol: true
}
```

### 4. 模板布局

**文件**: `src/app/terminal-interaction/terminal-interaction.component.html`

**布局结构**:
- 使用 PrimeNG Splitter 实现 70/30 分栏
- 左侧：终端区域 + 连接状态指示器
- 右侧：目标机信息卡片 + 操作按钮

**连接状态指示器**:
- 绿色：已连接（pi-check-circle）
- 红色：未连接（pi-times-circle）

**操作按钮**:
- Reconnect：仅在断开状态下可用
- Disconnect：仅在连接状态下可用

### 5. 样式设计

**文件**: `src/app/terminal-interaction/terminal-interaction.component.scss`

**设计特点**:
- 深色工业风格（#1e1e1e, #2d2d2d）
- 终端区域全屏显示
- 右侧信息面板卡片式布局
- 连接状态指示器浮动在右上角

### 6. 路由配置

**文件**: `src/app/app.routes.ts`

```typescript
{
  path: 'terminal-interaction',
  component: TerminalInteractionComponent
}
```

**数据传递方式**：通过 Router state 传递 VirtualTarget 对象

### 7. 虚拟目标列表集成

**文件**: `src/app/virtual-targets/virtual-targets.component.ts`

```typescript
onReserve(target: VirtualTarget): void {
  console.log('onReserve called with target:', target);
  this.router.navigate(['/terminal-interaction'], {
    state: { target: target }
  });
}
```

**文件**: `src/app/virtual-targets/virtual-targets.component.html`

```html
<p-button label="RESERVE"
          [disabled]="!row.isReservable || !row.createdBy"
          severity="primary"
          size="small"
          (onClick)="onReserve(row)"></p-button>
```

## 使用流程

1. 用户在虚拟目标列表页面点击 RESERVE 按钮
2. 系统通过 Router state 传递目标机信息到终端交互页面
3. 终端交互页面自动初始化 xterm.js 终端
4. 自动连接到 WebSocket 服务器（`ws://localhost:3000`）
5. 用户可以在终端中输入命令，实时查看输出
6. 右侧面板显示目标机信息和连接控制按钮

## 配置说明

### WebSocket URL 配置

当前 WebSocket URL 配置在 `websocket-terminal.service.ts` 中：

```typescript
const url = `ws://localhost:3000`;
```

**生产环境配置建议**：
- 使用环境变量或配置文件管理 WebSocket URL
- 使用 WSS（加密）协议
- 根据实际后端地址调整端口和路径

### Angular 配置

**文件**: `angular.json`

已添加 xterm.css 到样式数组：
```json
"styles": [
  "node_modules/primeng/resources/themes/lara-light-blue/theme.css",
  "node_modules/primeng/resources/primeng.min.css",
  "node_modules/primeicons/primeicons.css",
  "node_modules/xterm/css/xterm.css",
  "src/styles.scss"
]
```

## 已知问题和注意事项

### 1. 包大小警告

由于添加了 xterm.js 库，构建时会出现以下警告：
- bundle initial exceeded maximum budget
- xterm 和 xterm-addon-fit 不是 ESM 模块

这些是正常的警告，不影响功能。如需优化，可以考虑：
- 调整 angular.json 中的 budget 配置
- 使用懒加载方式加载终端组件

### 2. RESERVE 按钮禁用条件

按钮在以下情况下会被禁用：
- `!row.isReservable` - 目标机不可预订
- `!row.createdBy` - 目标机没有设置创建者

### 3. 调试信息

在 `onReserve()` 方法中添加了 console.log，用于调试：
```typescript
console.log('onReserve called with target:', target);
```

可以通过浏览器控制台查看点击事件是否触发。

### 4. 浏览器兼容性

- xterm.js 支持现代浏览器（Chrome, Firefox, Safari, Edge）
- 不支持 IE 浏览器

### 5. 移动端支持

当前设计主要针对桌面端，移动端体验可能需要额外优化：
- 终端字体大小调整
- 触摸屏键盘支持
- 响应式布局优化

## 测试建议

### 功能测试清单

1. **页面加载**
   - [ ] 从虚拟目标列表点击 RESERVE 按钮能正确跳转
   - [ ] 终端区域正确显示
   - [ ] 右侧信息面板显示目标机信息

2. **WebSocket 连接**
   - [ ] 页面加载后自动连接 WebSocket
   - [ ] 连接状态指示器显示正确（绿色/红色）
   - [ ] 能接收服务器消息并显示在终端

3. **用户交互**
   - [ ] 在终端输入能正确发送到服务器
   - [ ] Reconnect 按钮在断开状态下可用
   - [ ] Disconnect 按钮在连接状态下可用
   - [ ] 点击 Disconnect 能正确断开连接
   - [ ] 点击 Reconnect 能重新连接

4. **响应式设计**
   - [ ] 调整浏览器窗口大小，终端自动适应
   - [ ] 拖动分栏分隔条，布局正确调整

5. **资源清理**
   - [ ] 离开页面时 WebSocket 正确断开
   - [ ] 终端实例正确销毁
   - [ ] 没有内存泄漏

### 调试步骤

1. 打开浏览器开发者工具（F12）
2. 切换到 Console 标签
3. 访问虚拟目标列表页面
4. 点击 RESERVE 按钮
5. 查看控制台输出：
   - 应该看到 "onReserve called with target:" 日志
   - 检查 target 对象是否包含正确的数据
6. 切换到 Network 标签，筛选 WS（WebSocket）
7. 查看 WebSocket 连接状态和消息

## 后续扩展建议

1. **功能增强**
   - 添加终端会话历史记录
   - 支持多标签页（多个终端会话）
   - 添加文件上传/下载功能
   - 集成日志导出功能
   - 添加终端录制/回放功能

2. **性能优化**
   - 实现虚拟滚动（大量输出时）
   - 优化 WebSocket 消息处理
   - 添加消息缓冲机制

3. **用户体验**
   - 添加快捷键支持
   - 自定义终端主题
   - 字体大小调整
   - 全屏模式

4. **安全性**
   - 使用 WSS 加密连接
   - 添加身份验证
   - 实现会话超时机制

## 参考资料

- [xterm.js 官方文档](https://xtermjs.org/)
- [PrimeNG Splitter 组件](https://primeng.org/splitter)
- [Angular Router State](https://angular.io/api/router/NavigationExtras#state)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
