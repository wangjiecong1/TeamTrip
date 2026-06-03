# TeamTrip 全局视觉设计规范 Skill

> 适用范围：TeamTrip 项目内所有前端页面、组件、弹窗、表单、卡片、按钮、标签、空状态、提示条、图表容器等 UI 代码。
>
> 本 Skill **只约束视觉设计规范**，不约束具体功能流程、页面信息架构、业务逻辑、接口字段、权限规则、路由规则。功能实现以当前 PRD、设计稿、用户最新指令和项目代码为准。

---

## 1. 总体视觉方向

TeamTrip 的整体气质是：

**清爽、轻旅行、协作感、可信、年轻但不幼稚。**

产品不能做成以下风格：

- 传统重后台系统；
- OTA 旅游商城；
- 过度营销落地页；
- 高饱和游戏化界面；
- 密集表格型管理系统；
- 强烈拟物、强 3D、强玻璃拟态。

推荐呈现方式：

- 大面积浅色背景；
- 白色大圆角卡片；
- 青绿色主色；
- 柔和阴影；
- 低饱和插画氛围；
- 信息层级清晰；
- 线性图标；
- 留白充足。

---

## 2. 主题色规范

### 2.1 主色

主色用于核心操作、选中态、重点状态、品牌识别。

```css
--tt-primary: #00A889;
--tt-primary-600: #07967E;
--tt-primary-700: #087C6A;
--tt-primary-light: #E6F7F4;
--tt-primary-soft: #F0FBF8;
```

使用位置：

- 主按钮；
- 当前选中导航；
- 当前选中 Tab；
- 重要成功状态；
- 主要 Icon；
- 重点数字；
- 进度条；
- 可点击的核心行动入口。

不要大面积铺满高饱和主色。主色应该是“点亮界面”，不是“覆盖界面”。

### 2.2 辅助色

```css
--tt-blue: #3B82F6;
--tt-blue-soft: #EFF6FF;

--tt-orange: #F97316;
--tt-orange-soft: #FFF7ED;

--tt-red: #EF4444;
--tt-red-soft: #FEF2F2;

--tt-green: #22C55E;
--tt-green-soft: #F0FDF4;

--tt-purple: #8B5CF6;
--tt-purple-soft: #F5F3FF;
```

使用原则：

- 蓝色：普通信息、轻提示、地图或路线辅助信息；
- 橙色：待处理、轻度警告、分歧、未完成；
- 红色：删除、错误、危险操作；
- 绿色：完成、成功；
- 紫色：少量用于人格、偏好、AI 辅助感，不可泛滥。

### 2.3 中性色

```css
--tt-text-primary: #102033;
--tt-text-secondary: #475569;
--tt-text-tertiary: #64748B;
--tt-text-muted: #94A3B8;

--tt-border: #E2E8F0;
--tt-border-light: #EEF2F6;

--tt-bg-page: #F7FAFC;
--tt-bg-card: #FFFFFF;
--tt-bg-subtle: #F8FAFC;
--tt-bg-muted: #F1F5F9;
```

正文不要使用纯黑。主要文字使用 `#102033`，弱文字使用 `#64748B` 或 `#94A3B8`。

---

## 3. 背景规范

页面背景应保持轻旅行氛围，但不能喧宾夺主。

### 3.1 推荐背景层级

常规页面：

```css
background:
  linear-gradient(180deg, rgba(247, 250, 252, 0.96) 0%, rgba(247, 250, 252, 0.9) 100%),
  url("/项目内已有背景图路径");
background-size: cover;
background-position: center bottom;
background-repeat: no-repeat;
```

背景图来源：

- 使用项目中已有背景资源；
- 不要在代码里临时生成、拼接、硬编码外部图片；
- 不要引入强目的地属性过重的背景，除非页面明确是该目的地主题。

### 3.2 背景强度

- 页面中心区域应保持足够干净，保证卡片可读。
- 插画背景适合出现在页面边缘、底部、顶部淡区。
- 不要让背景图穿透到文字密集区域造成阅读困难。
- 卡片上方可以有非常轻的纸飞机虚线、定位点、远山、湖面等点缀，但必须低透明度。

### 3.3 禁止

- 大面积纯图片铺底导致页面像旅游海报；
- 强烈城市地标背景泛用于所有页面；
- 高饱和天空、海报级夕阳、强对比山水；
- 背景图滚动时产生强烈视差干扰阅读；
- 卡片区域透明度过高导致文字压在背景图上。

---

## 4. 圆角规范

TeamTrip 的整体圆角偏大，形成柔和、轻旅行、友好的感觉。

```css
--tt-radius-xs: 6px;
--tt-radius-sm: 8px;
--tt-radius-md: 12px;
--tt-radius-lg: 16px;
--tt-radius-xl: 20px;
--tt-radius-2xl: 24px;
--tt-radius-3xl: 28px;
--tt-radius-full: 999px;
```

推荐使用：

- 页面主卡片：`24px` 或 `28px`
- 普通模块卡片：`20px` 或 `24px`
- 小卡片 / 列表项：`16px`
- 按钮：`12px` 或 `14px`
- 输入框：`12px`
- 标签：`999px`
- 头像：圆形
- 图片缩略图：`12px` 或 `16px`

禁止：

- 大量使用 0px / 2px / 4px 小圆角；
- 传统后台式直角容器；
- 同一页面圆角体系混乱。

---

## 5. 阴影与边框规范

### 5.1 阴影

阴影必须轻，不要厚重悬浮。

```css
--tt-shadow-xs: 0 1px 2px rgba(15, 23, 42, 0.04);
--tt-shadow-sm: 0 4px 12px rgba(15, 23, 42, 0.06);
--tt-shadow-md: 0 10px 24px rgba(15, 23, 42, 0.08);
--tt-shadow-lg: 0 18px 42px rgba(15, 23, 42, 0.10);
```

推荐：

- 主卡片：`shadow-md`
- 普通卡片：`shadow-sm`
- 弹窗 / 抽屉：`shadow-lg`
- 小控件：`shadow-xs` 或无阴影

### 5.2 边框

```css
border: 1px solid var(--tt-border-light);
```

边框用于建立层级，颜色必须浅。  
不要使用重黑边、深灰边、强分割线。

---

## 6. 字体与排版规范

### 6.1 字体

```css
font-family:
  "PingFang SC",
  "Microsoft YaHei",
  "Inter",
  system-ui,
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  sans-serif;
```

中文界面优先使用系统中文字体。不要引入未经确认的特殊字体文件。

### 6.2 字号

```css
--tt-font-xs: 12px;
--tt-font-sm: 13px;
--tt-font-base: 14px;
--tt-font-md: 15px;
--tt-font-lg: 16px;
--tt-font-xl: 18px;
--tt-font-2xl: 22px;
--tt-font-3xl: 28px;
--tt-font-4xl: 34px;
```

推荐使用：

- 页面标题：28–34px，字重 700
- 页面副标题：14–16px，颜色 `--tt-text-tertiary`
- 模块标题：18–22px，字重 650/700
- 卡片标题：16–18px，字重 650
- 正文：14–15px
- 辅助说明：12–13px
- 按钮文字：14–15px，字重 600

### 6.3 行高

```css
--tt-leading-tight: 1.25;
--tt-leading-normal: 1.5;
--tt-leading-relaxed: 1.7;
```

正文默认 `1.5`，长说明使用 `1.7`。

---

## 7. 间距规范

使用 4px 基础栅格。

```css
--tt-space-1: 4px;
--tt-space-2: 8px;
--tt-space-3: 12px;
--tt-space-4: 16px;
--tt-space-5: 20px;
--tt-space-6: 24px;
--tt-space-8: 32px;
--tt-space-10: 40px;
--tt-space-12: 48px;
```

推荐：

- 页面左右主边距：32–64px，视页面宽度而定；
- 主卡片内边距：28–40px；
- 普通卡片内边距：20–28px；
- 列表项间距：12–16px；
- 模块间距：24–32px；
- 图标与文字间距：6–8px；
- 标签间距：8px。

禁止：

- 内容贴边；
- 模块堆得过密；
- 卡片内信息无层级；
- 为了塞内容压缩留白。

---

## 8. 卡片规范

卡片是 TeamTrip 的核心承载方式。

### 8.1 主卡片

```css
.tt-card-main {
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid var(--tt-border-light);
  border-radius: 24px;
  box-shadow: var(--tt-shadow-md);
}
```

适合：

- 页面主内容容器；
- 欢迎卡片；
- 团队概览；
- 行程主体；
- 结果展示。

### 8.2 普通卡片

```css
.tt-card {
  background: #FFFFFF;
  border: 1px solid var(--tt-border-light);
  border-radius: 20px;
  box-shadow: var(--tt-shadow-sm);
}
```

适合：

- 团队卡片；
- 成员卡片；
- 表单模块；
- 数据概览模块；
- 地点卡片。

### 8.3 卡片内部

- 标题区、内容区、操作区层级清楚；
- 图文卡片图片比例统一；
- 卡片内按钮不要过多；
- 一个卡片只突出一个主操作。

---

## 9. 按钮规范

### 9.1 主按钮

```css
.tt-button-primary {
  background: linear-gradient(135deg, #00A889 0%, #07967E 100%);
  color: #FFFFFF;
  border-radius: 14px;
  height: 44px;
  padding: 0 22px;
  font-weight: 600;
  box-shadow: 0 8px 18px rgba(0, 168, 137, 0.18);
}
```

使用位置：

- 创建；
- 进入；
- 保存；
- 确认；
- 锁定；
- 加入；
- 主要 CTA。

主按钮每个模块最多一个。不要同一区域出现多个同权重主按钮。

### 9.2 次按钮

```css
.tt-button-secondary {
  background: #FFFFFF;
  color: var(--tt-primary-600);
  border: 1px solid rgba(0, 168, 137, 0.45);
  border-radius: 14px;
  height: 44px;
  padding: 0 20px;
  font-weight: 600;
}
```

### 9.3 轻按钮 / 文本按钮

用于弱操作：

```css
.tt-button-ghost {
  background: transparent;
  color: var(--tt-text-secondary);
  border-radius: 12px;
}
```

Hover 可使用：

```css
background: var(--tt-bg-subtle);
color: var(--tt-primary-600);
```

### 9.4 危险按钮

删除、移除等操作使用红色，但默认不要过度突出：

```css
color: var(--tt-red);
background: var(--tt-red-soft);
```

---

## 10. 标签与状态规范

标签统一使用胶囊形态。

```css
.tt-tag {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  height: 24px;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 600;
}
```

推荐状态：

```css
.tt-tag-primary {
  background: var(--tt-primary-light);
  color: var(--tt-primary-700);
}

.tt-tag-blue {
  background: var(--tt-blue-soft);
  color: var(--tt-blue);
}

.tt-tag-orange {
  background: var(--tt-orange-soft);
  color: var(--tt-orange);
}

.tt-tag-green {
  background: var(--tt-green-soft);
  color: #15803D;
}

.tt-tag-gray {
  background: var(--tt-bg-muted);
  color: var(--tt-text-tertiary);
}
```

不要使用高饱和实心标签堆满页面。  
标签数量较多时，最多展示 3–5 个，其余折叠或弱化。

---

## 11. 输入框与表单规范

```css
.tt-input {
  height: 44px;
  border-radius: 12px;
  border: 1px solid var(--tt-border);
  background: #FFFFFF;
  padding: 0 14px;
  font-size: 14px;
  color: var(--tt-text-primary);
}
```

Focus：

```css
border-color: var(--tt-primary);
box-shadow: 0 0 0 3px rgba(0, 168, 137, 0.12);
```

表单原则：

- Label 清楚；
- Placeholder 简洁；
- 错误提示使用红色弱背景；
- 帮助说明使用浅灰小字；
- 表单组间距 16–20px；
- 弹窗表单不要过长。

---

## 12. 导航规范

导航需要轻量、清楚、稳定。

### 12.1 顶部导航

- 白色或半透明白底；
- 高度 72–88px；
- Logo 左侧；
- 当前页标题靠左；
- 操作按钮靠右；
- 底部分割线极浅或无；
- 不使用厚重阴影。

### 12.2 侧边栏

- 常规白色侧边栏；
- 不使用深色后台侧边栏；
- 当前选中项使用浅青绿色背景 + 主色文字；
- 图标使用线性图标；
- 分组间留白清楚；
- 底部用户区保持简洁。

选中项示例：

```css
background: var(--tt-primary-soft);
color: var(--tt-primary-700);
border-radius: 14px;
font-weight: 600;
```

---

## 13. 图标规范

推荐使用线性图标，视觉轻量。

- 线宽：1.75–2px；
- 默认颜色：`--tt-text-tertiary`；
- 选中颜色：`--tt-primary-600`；
- 图标尺寸：16px / 18px / 20px / 24px；
- 功能入口图标不要过多彩色化。

禁止：

- 混用多个图标库风格；
- 大量实心复杂图标；
- 图标过大抢主内容；
- 强烈卡通图标用于功能密集区。

---

## 14. 图片与插画规范

项目内已有资源图时，优先复用项目资源。

### 14.1 图片圆角

- 大封面：20–24px；
- 卡片缩略图：12–16px；
- 小头像：圆形；
- 地点缩略图：12px。

### 14.2 图片风格

- 低饱和；
- 明亮；
- 轻旅行；
- 不要强商业广告感；
- 不要过度真实复杂导致和 UI 脱节。

### 14.3 图片缺省态

缺省图应使用浅色插画或渐变底，不要使用灰色破图区域。  
缺省态也必须符合主色和圆角规范。

---

## 15. 弹窗、抽屉、Popover 规范

### 15.1 弹窗

```css
border-radius: 24px;
background: #FFFFFF;
box-shadow: var(--tt-shadow-lg);
```

- 标题 20–22px；
- 内容 14–15px；
- 底部按钮右对齐；
- 遮罩不宜过黑：`rgba(15, 23, 42, 0.28)`。

### 15.2 抽屉

适合复杂表单或地图相关操作。

- 宽度 420–520px；
- 圆角可用于左上 / 左下；
- 内边距 24px；
- 标题区固定，内容区滚动。

### 15.3 Popover

- 圆角 14–16px；
- 白底；
- 浅边框；
- 轻阴影；
- 用于解释状态、展示少量补充信息。

---

## 16. 表格与列表规范

TeamTrip 尽量避免传统重表格。

如必须使用表格：

- 表头浅灰；
- 行高不低于 44px；
- 分割线使用极浅边框；
- 状态使用胶囊标签；
- 操作按钮弱化；
- 不要密集堆字段。

更推荐使用：

- 卡片列表；
- 横向信息块；
- 头像 + 标签 + 简短说明；
- 折叠面板。

---

## 17. 空状态与提示规范

空状态应该轻松、有引导，不要像错误页。

空状态包含：

- 轻量图标或插画；
- 一句话说明；
- 一个主操作；
- 一个可选次操作。

语气：

- 简洁；
- 友好；
- 不强迫；
- 不制造焦虑。

示例语气：

```text
还没有内容，可以先创建一个。
填写后，团队会更容易找到合适的安排。
```

避免：

```text
数据为空
暂无数据
操作失败，请联系管理员
```

---

## 18. 动效规范

动效要轻，不要花哨。

推荐：

```css
transition: all 180ms ease;
```

Hover：

- 卡片轻微上浮：`translateY(-1px)`；
- 按钮亮度微调；
- 边框颜色变主色浅色；
- 胶囊标签不做复杂动画。

禁止：

- 大幅缩放；
- 夸张弹跳；
- 长时间 loading 动画；
- 强视差滚动；
- 大量元素同时动。

---

## 19. 响应式原则

默认 PC 优先。  
在没有明确移动端设计要求时，不要为了移动端强行改变 PC 信息结构。

通用断点可以使用：

```css
--tt-screen-sm: 640px;
--tt-screen-md: 768px;
--tt-screen-lg: 1024px;
--tt-screen-xl: 1280px;
--tt-screen-2xl: 1536px;
```

移动端样式应在有明确页面要求时单独设计，不要自动把复杂 PC 页简单堆叠成不可用的移动页。

---

## 20. Codex 修改 UI 时必须遵守

每次修改 TeamTrip 前端 UI 时，必须先自检：

1. 是否使用了 TeamTrip 主色 `#00A889` 或其规范变体？
2. 是否出现了未经确认的新主色？
3. 卡片圆角是否保持 20–28px 体系？
4. 按钮圆角是否保持 12–16px？
5. 页面是否变得像传统后台？
6. 页面是否变得像旅游商城？
7. 背景是否干扰阅读？
8. 阴影是否过重？
9. 标签是否使用胶囊样式？
10. 图标是否为统一线性风格？
11. 是否保留足够留白？
12. 是否复用了项目已有视觉资源，而不是随意新增外部资源？
13. 是否避免了硬编码大量一次性样式？
14. 是否尽量抽象为可复用 class、token 或组件样式？

不满足以上要求时，必须先调整视觉再完成任务。

---

## 21. 禁止项总表

Codex 不得擅自：

- 引入新的主视觉色；
- 使用深色后台侧边栏；
- 使用直角大容器；
- 使用重阴影；
- 使用密集表格替代卡片；
- 使用高饱和旅游海报背景；
- 使用强目的地地标作为通用背景；
- 使用多个图标库混搭；
- 使用默认浏览器按钮样式；
- 使用纯黑正文；
- 让内容贴边；
- 让功能按钮无层级；
- 新增不符合项目风格的图片资源；
- 把本 Skill 扩展为功能需求文档。

---

## 22. 最终目标

任何页面无论功能如何变化，都必须保持 TeamTrip 的一致视觉识别：

**浅色旅行背景 + 白色大圆角卡片 + 青绿色主色 + 胶囊标签 + 轻阴影 + 清爽协作感。**
