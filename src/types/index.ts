/* ============================================================
 * src/types/index.ts
 * 全局共享的 TypeScript 类型定义
 * ============================================================ */

// ---------- 基础几何类型 ----------

/** 二维坐标点 */
export interface Point {
  x: number;
  y: number;
}

/** 包含 z 轴的三维坐标点 */
export interface Point3D extends Point {
  z: number;
}

/** 通用边界框 */
export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

// ---------- CSV / 数据相关类型 ----------

/** Papa Parse 解析完成后的原始行数据（键值对） */
export type CsvRow = Record<string, string>;

/** 解析后的数据集 */
export interface ParsedDataset<T = CsvRow> {
  headers: string[];
  rows: T[];
}

// ---------- Segment（路段）相关类型 ----------

/** 路段基础信息 */
export interface Segment {
  id: string;
  name: string;
  startPoint: Point;
  endPoint: Point;
  length?: number; // 可选：自动计算
}

// ---------- Alignment（线形）相关类型 ----------

/** 线形由多个路段组成 */
export interface Alignment {
  id: string;
  name: string;
  segments: Segment[];
  color?: string; // SVG 渲染颜色
}

// ---------- 交点（JD）类型 ----------

/**
 * 交点（Junction/Design Point）
 * 描述平曲线设计的控制点：
 *   mileage — 交点里程
 *   x, y    — 平面坐标
 *   ls1     — 前缓和曲线长（m）
 *   r       — 圆曲线半径（m，0 表示无圆曲线）
 *   ls2     — 后缓和曲线长（m）
 */
export interface JD {
  mileage: number;
  x: number;
  y: number;
  ls1: number;
  r: number;
  ls2: number;
}

// ---------- 路段查询结果类型 ----------

/**
 * 在任意里程处查询路段返回的结果：
 *   x, y     — 平面坐标
 *   azimuth  — 方位角（弧度，从正北顺时针，0 = 正北，π/2 = 正东）
 *   tangent  — 单位切向量 [tx, ty]
 *   normal   — 单位法向量（逆时针 90°）[nx, ny]
 */
export interface PointResult {
  x: number;
  y: number;
  azimuth: number;
  tangent: [number, number];
  normal: [number, number];
}
