/* ============================================================
 * src/segments/ArcSegment.ts
 * 圆弧路段
 * ============================================================ */

import type { PointResult } from '../types';
import { Segment } from './Segment';

/** 构造圆弧路段所需的参数 */
export interface ArcSegmentOptions {
  /** 圆心坐标 */
  center: { x: number; y: number };
  /** 圆弧半径（m） */
  radius: number;
  /**
   * 起始角（弧度，标准笛卡尔角，x 轴正方向为 0，逆时针为正）
   * 即：圆心到弧起点的方向角
   */
  startAngle: number;
  /**
   * 终止角（弧度，标准笛卡尔角）
   * 即：圆心到弧终点的方向角
   */
  endAngle: number;
  /** true = 顺时针行进；false = 逆时针行进 */
  clockwise: boolean;
  /** 起点里程（m） */
  startMileage: number;
  /** 终点里程（m） */
  endMileage: number;
}

/**
 * 圆弧路段
 *
 * 坐标系约定（测量坐标系）：
 *   x = 东（East），y = 北（North）
 *
 * 方位角约定：
 *   azimuth = atan2(tx, ty)，0 = 正北，顺时针为正
 *
 * 弧长插值：
 *   ratio = (s - startMileage) / length
 *   θ(ratio) = startAngle ± ratio × sweepAngle
 *              顺时针：−；逆时针：+
 *
 * 切向量方向：
 *   逆时针行进：切向 = (−sin θ,  cos θ)（对 θ 求导方向）
 *   顺时针行进：切向 = ( sin θ, −cos θ)（取反）
 *
 * 法向量 = 切向量逆时针旋转 90°：[−ty, tx]
 */
export class ArcSegment extends Segment {
  readonly center: { x: number; y: number };
  readonly radius: number;
  readonly startAngle: number;
  readonly endAngle: number;
  readonly clockwise: boolean;

  /**
   * 扫过的角度（正值，单位：弧度）
   * sweepAngle = 弧长 / 半径
   */
  private readonly sweepAngle: number;

  constructor(options: ArcSegmentOptions) {
    super(options.startMileage, options.endMileage);

    if (options.radius <= 0) {
      throw new Error(`圆弧半径必须为正数，当前值：${options.radius}`);
    }

    this.center = options.center;
    this.radius = options.radius;
    this.startAngle = options.startAngle;
    this.endAngle = options.endAngle;
    this.clockwise = options.clockwise;

    // 从里程长度反推扫过的角度，确保与 length 完全一致
    // sweepAngle = arcLength / radius = (endMileage - startMileage) / radius
    this.sweepAngle = this.length / this.radius;
  }

  /**
   * 在里程 s 处查询圆弧上的点
   *
   * @param s 目标里程（m）
   */
  getPointAt(s: number): PointResult {
    // 1. 弧长比例，夹到 [0, 1] 防止浮点越界
    const ratio = this.length > 0
      ? Math.min(1, Math.max(0, (s - this.startMileage) / this.length))
      : 0;

    // 2. 当前弧度
    //    顺时针：角度递减；逆时针：角度递增
    const theta = this.clockwise
      ? this.startAngle - ratio * this.sweepAngle
      : this.startAngle + ratio * this.sweepAngle;

    // 3. 圆上坐标
    const x = this.center.x + this.radius * Math.cos(theta);
    const y = this.center.y + this.radius * Math.sin(theta);

    // 4. 单位切向量
    //    对 P(θ) = (cx + r·cosθ, cy + r·sinθ) 关于弧长求导：
    //      逆时针：dP/ds =  (−sinθ,  cosθ)  （已归一化，模=1）
    //      顺时针：dP/ds =  ( sinθ, −cosθ)
    const [tx, ty]: [number, number] = this.clockwise
      ? [Math.sin(theta), -Math.cos(theta)]
      : [-Math.sin(theta), Math.cos(theta)];

    // 5. 法向量 = 切向量逆时针旋转 90°：(−ty, tx)
    const normal: [number, number] = [-ty, tx];

    // 6. 方位角（测量坐标系：x=东，y=北）
    //    azimuth = atan2(东分量, 北分量) = atan2(tx, ty)
    const azimuth = Math.atan2(tx, ty);

    return { x, y, azimuth, tangent: [tx, ty], normal };
  }
}
