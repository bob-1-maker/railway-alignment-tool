/* ============================================================
 * src/geometry/index.ts
 * 几何计算工具函数
 * ============================================================ */

import type { Point, BoundingBox } from '../types';

/**
 * 计算两点之间的欧氏距离
 */
export function distance(a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 计算两点连线的角度（弧度，相对 x 轴正方向）
 */
export function angle(from: Point, to: Point): number {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

/**
 * 将弧度转换为角度
 */
export function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * 将角度转换为弧度
 */
export function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * 根据一组点计算包围盒（BoundingBox）
 */
export function computeBoundingBox(points: Point[]): BoundingBox | null {
  if (points.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }

  return { minX, minY, maxX, maxY };
}

/**
 * 线性插值：在点 a 和点 b 之间按比例 t (0~1) 取中间点
 */
export function lerp(a: Point, b: Point, t: number): Point {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  };
}
