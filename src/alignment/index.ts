/* ============================================================
 * src/alignment/index.ts
 * 线形（Alignment）相关的工厂函数与工具
 * ============================================================ */

import type { Alignment, Segment, Point } from '../types';

/**
 * 创建一个新的线形对象
 */
export function createAlignment(
  id: string,
  name: string,
  segments: Segment[] = [],
  color = '#4A90D9',
): Alignment {
  return { id, name, segments, color };
}

/**
 * 获取线形所有点（依次：起点、每个路段终点）
 * 用于 SVG polyline 渲染
 */
export function alignmentToPoints(alignment: Alignment): Point[] {
  if (alignment.segments.length === 0) return [];

  const points: Point[] = [alignment.segments[0].startPoint];
  for (const seg of alignment.segments) {
    points.push(seg.endPoint);
  }
  return points;
}

/**
 * 将 Point[] 转换为 SVG points 属性字符串
 * 格式：'x1,y1 x2,y2 ...'
 */
export function pointsToSvgString(points: Point[]): string {
  return points.map((p) => `${p.x},${p.y}`).join(' ');
}

/**
 * 计算线形的总长度（各路段之和）
 */
export function alignmentTotalLength(alignment: Alignment): number {
  return alignment.segments.reduce((sum, s) => sum + (s.length ?? 0), 0);
}
