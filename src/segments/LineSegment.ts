/* ============================================================
 * src/segments/LineSegment.ts
 * 直线路段
 * ============================================================ */

import type { PointResult } from "../types";
import { Segment } from "./Segment";

/** 构造直线路段所需的参数 */
export interface LineSegmentOptions {
  /** 起点坐标 */
  startPoint: { x: number; y: number };
  /** 终点坐标 */
  endPoint: { x: number; y: number };
  /** 起点里程（m） */
  startMileage: number;
  /** 终点里程（m） */
  endMileage: number;
}

/**
 * 直线路段
 *
 * 几何性质：
 *   - 方位角固定，全段一致
 *   - 切向量 = (cos α, sin α)，其中 α 为方位角对应的笛卡尔角度
 *   - 法向量 = 切向量逆时针旋转 90°：(-sin α, cos α)
 *
 * 方位角约定（测量坐标系，x=东，y=北）：
 *   azimuth = atan2(dx, dy)，0 表示正北，顺时针为正
 */
export class LineSegment extends Segment {
  private readonly x0: number;
  private readonly y0: number;
  private readonly x1: number;
  private readonly y1: number;

  /** 笛卡尔角度（x 轴正方向为 0，逆时针为正） —— 仅用于插值 */
  // private readonly _cartesianAngle: number;

  /** 方位角（正北顺时针，弧度） */
  private readonly _azimuth: number;

  /** 单位切向量 [tx, ty]（笛卡尔坐标系） */
  private readonly _tangent: [number, number];

  /** 单位法向量 [nx, ny]（切向量逆时针 90°） */
  private readonly _normal: [number, number];

  constructor(options: LineSegmentOptions) {
    super(options.startMileage, options.endMileage);

    this.x0 = options.startPoint.x;
    this.y0 = options.startPoint.y;
    this.x1 = options.endPoint.x;
    this.y1 = options.endPoint.y;

    const dx = this.x1 - this.x0;
    const dy = this.y1 - this.y0;
    const len = Math.sqrt(dx * dx + dy * dy);

    if (len === 0) {
      throw new Error("直线路段的起点与终点不能重合");
    }

    // 单位切向量（笛卡尔系）
    const tx = dx / len;
    const ty = dy / len;
    this._tangent = [tx, ty];

    // 逆时针旋转 90°：[−ty, tx]
    this._normal = [-ty, tx];

    // 笛卡尔角（备用，插值时使用）
    // this._cartesianAngle = Math.atan2(dy, dx);

    // 方位角：测量坐标系 x=东 y=北 → azimuth = atan2(dx, dy)
    this._azimuth = Math.atan2(dx, dy);
  }

  /**
   * 在里程 s 处查询直线上的点
   *
   * 插值方式：
   *   t = (s - startMileage) / length    （0~1）
   *   P = startPoint + t × (endPoint - startPoint)
   *
   * 直线上切/法向量与方位角处处相同，直接返回预计算值。
   */
  getPointAt(s: number): PointResult {
    // 将里程映射到 [0, 1]
    const t = this.length > 0 ? (s - this.startMileage) / this.length : 0;

    const x = this.x0 + t * (this.x1 - this.x0);
    const y = this.y0 + t * (this.y1 - this.y0);

    return {
      x,
      y,
      azimuth: this._azimuth,
      tangent: this._tangent,
      normal: this._normal,
    };
  }
}
