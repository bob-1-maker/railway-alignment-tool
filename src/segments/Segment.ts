/* ============================================================
 * src/segments/Segment.ts
 * 抽象路段基类
 * 所有具体路段类型（直线、缓和曲线、圆曲线等）均继承此类
 * ============================================================ */

import type { PointResult } from '../types';

/**
 * 抽象路段基类
 *
 * 每个路段负责管理一段里程区间 [startMileage, endMileage]，
 * 并能根据任意里程 s 返回该处的坐标、方位角及切/法向量。
 */
export abstract class Segment {
  /** 路段起点里程（m） */
  readonly startMileage: number;

  /** 路段终点里程（m） */
  readonly endMileage: number;

  constructor(startMileage: number, endMileage: number) {
    if (endMileage < startMileage) {
      throw new Error(
        `endMileage (${endMileage}) 不能小于 startMileage (${startMileage})`,
      );
    }
    this.startMileage = startMileage;
    this.endMileage = endMileage;
  }

  /** 路段长度（m） */
  get length(): number {
    return this.endMileage - this.startMileage;
  }

  /**
   * 判断里程 s 是否在本路段范围内（含端点）
   */
  contains(s: number): boolean {
    return s >= this.startMileage && s <= this.endMileage;
  }

  /**
   * 在里程 s 处查询路段上的点信息
   * @param s 目标里程（m），应在 [startMileage, endMileage] 范围内
   * @returns 坐标、方位角、切向量、法向量
   */
  abstract getPointAt(s: number): PointResult;
}
