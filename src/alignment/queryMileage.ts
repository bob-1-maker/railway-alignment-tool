/* ============================================================
 * src/alignment/queryMileage.ts
 * 根据里程查询线路上的点信息
 * ============================================================ */

import type { Segment } from '../segments/Segment';
import type { PointResult } from '../types';

/**
 * 在 Segment[] 中查找指定里程所在的路段，返回查询结果
 *
 * @param segments 路段数组（里程连续）
 * @param mileage  目标里程（m）
 * @returns PointResult 或 null（里程不在任何路段范围内时）
 */
export function queryMileage(
  segments: Segment[],
  mileage: number,
): PointResult | null {
  const seg = segments.find(
    (s) => mileage >= s.startMileage && mileage <= s.endMileage,
  );

  if (!seg) return null;

  return seg.getPointAt(mileage);
}
