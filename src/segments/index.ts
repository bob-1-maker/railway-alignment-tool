/* ============================================================
 * src/segments/index.ts
 * 路段模块统一出口
 * ============================================================ */

// 抽象基类
export { Segment } from './Segment';

// 直线路段
export { LineSegment } from './LineSegment';
export type { LineSegmentOptions } from './LineSegment';

// 圆弧路段
export { ArcSegment } from './ArcSegment';
export type { ArcSegmentOptions } from './ArcSegment';

// ---- 旧版工具函数（CSV 解析，向后兼容） ----

import type { Segment as SegmentInterface } from '../types';
import { distance } from '../geometry';

/**
 * 创建一个旧版路段数据对象（符合 types/Segment 接口）
 */
export function createSegment(
  id: string,
  name: string,
  startPoint: { x: number; y: number },
  endPoint: { x: number; y: number },
): SegmentInterface {
  return {
    id,
    name,
    startPoint,
    endPoint,
    length: distance(startPoint, endPoint),
  };
}

/**
 * 从 CSV 原始行数据批量解析路段
 * 期望列：id, name, x1, y1, x2, y2
 */
export function parseSegmentsFromCsv(
  rows: Record<string, string>[],
): SegmentInterface[] {
  return rows
    .map((row) => {
      const x1 = parseFloat(row['x1'] ?? '');
      const y1 = parseFloat(row['y1'] ?? '');
      const x2 = parseFloat(row['x2'] ?? '');
      const y2 = parseFloat(row['y2'] ?? '');

      if ([x1, y1, x2, y2].some(isNaN)) return null;

      return createSegment(
        row['id'] ?? String(Math.random()),
        row['name'] ?? 'Unnamed',
        { x: x1, y: y1 },
        { x: x2, y: y2 },
      );
    })
    .filter((s): s is SegmentInterface => s !== null);
}
