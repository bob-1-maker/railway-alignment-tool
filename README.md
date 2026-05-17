# React + TypeScript + SVG 线路几何可视化

基于 React 和 SVG 的铁路/公路线路平面几何可视化工具。通过交点（JD）数据自动生成线路，支持直线路段与圆弧路段，并提供里程查询与实时 SVG 渲染。

## 技术栈

- **React 18** — 函数组件 + Hooks
- **TypeScript** — 严格模式，完整类型定义
- **SVG** — 纯 SVG 渲染，无第三方图形库依赖
- **Vite** — 构建与开发服务器

## 功能

- **JD 数据驱动** — 输入交点坐标、曲线半径，自动生成完整线路
- **自动线路生成** — `buildAlignment` 根据 JD 数组自动拆分为 LineSegment / ArcSegment 路段链
- **LineSegment** — 直线路段，线性插值、切/法向量、方位角计算
- **ArcSegment** — 圆弧路段，弧长插值、圆心/扫掠角计算，支持左转/右转
- **里程查询** — 输入里程值，实时返回坐标、方位角、切/法向量
- **SVG 可视化** — 自动 viewBox、工程坐标 y 轴翻转、查询点高亮

## 项目结构

```
src/
├── types/
│   └── index.ts              # JD、PointResult 接口定义
├── segments/
│   ├── Segment.ts            # 抽象基类（里程范围、contains、getPointAt）
│   ├── LineSegment.ts        # 直线路段
│   ├── ArcSegment.ts         # 圆弧路段
│   └── index.ts              # 统一导出
├── alignment/
│   ├── buildAlignment.ts     # JD[] → Segment[] 自动生成
│   ├── queryMileage.ts       # 里程查询
│   └── index.ts
├── components/
│   ├── AlignmentView.tsx     # 线路 SVG 渲染组件
│   └── ...
├── App.tsx                   # 入口页面（演示数据 + 查询面板）
└── main.tsx                  # React 挂载
```

## 启动方式

```bash
npm install
npm run dev
```

## 坐标系约定

| 项目 | 规则 |
|------|------|
| 方位角 | `atan2(dx, dy)`，0° 为正北，顺时针为正 |
| 切向量 | 单位切向量，方向沿线路前进方向 |
| 法向量 | 切向量逆时针旋转 90°（`[-ty, tx]`） |
| SVG 翻转 | `svgY = maxY - engY`（工程 y↑ → SVG y↓） |

## 后续可扩展

- **SpiralSegment** — 缓和曲线（回旋线）路段
- **CSV 导入导出** — JD 数据批量导入与线路导出
- **Hover Tooltip** — 鼠标悬停显示里程、坐标等详细信息
