/* ============================================================
 * src/alignment/buildAlignment.ts
 * 根据 JD[] 自动生成 Segment[]（LineSegment + ArcSegment）
 * ============================================================
 *
 * 算法概述：
 *   1.  JD 之间默认用直线连接
 *   2.  对每个中间 JD[i]（1 ≤ i ≤ n-2），若 r > 0，则在该角
 *       处用圆弧替代尖角，生成：
 *         Line → Arc → Line
 *   3.  起点 JD[0] 和终点 JD[n-1] 不放置圆弧
 *   4.  里程根据实际几何长度（直线长度 / 弧长）累加，保证连续
 *
 * 几何简化：
 *   - 圆心取角平分线方向、距 JD 为 R/sin(Δα/2) 处
 *   - 切点（Tangent Point）在 JD 到前后 JD 的连线上，距 JD 为 T
 *   - T = R × tan(Δα/2)
 * ============================================================ */

import { LineSegment } from '../segments/LineSegment';
import { ArcSegment } from '../segments/ArcSegment';
import type { Segment } from '../segments/Segment';
import type { JD } from '../types';

// ---- 内部几何工具（仅本文件使用） ----

/** 二维向量 */
interface Vec2 {
  x: number;
  y: number;
}

/** 向量减法：a − b */
function sub(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

/** 向量加法 */
function add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

/** 标量乘法 */
function scale(v: Vec2, k: number): Vec2 {
  return { x: v.x * k, y: v.y * k };
}

/** 向量长度 */
function len(v: Vec2): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

/** 归一化（返回单位向量） */
function normalize(v: Vec2): Vec2 {
  const l = len(v);
  return l > 0 ? { x: v.x / l, y: v.y / l } : { x: 0, y: 0 };
}

/** 叉积（二维，返回标量 z 分量） */
function cross(a: Vec2, b: Vec2): number {
  return a.x * b.y - a.y * b.x;
}

/** 两点距离 */
function dist(a: Vec2, b: Vec2): number {
  return len(sub(a, b));
}

// ---- 内部数据结构 ----

/** 在 JD 处计算出的圆弧参数 */
interface ArcInfo {
  center: Vec2;         // 圆心
  startAngle: number;   // 起始角（标准笛卡尔角，弧度）
  endAngle: number;     // 终止角
  clockwise: boolean;   // 行进方向
  st: Vec2;             // 切点（线路进入弧的起始点）
  et: Vec2;             // 切点（线路离开弧的终点）
  arcLen: number;       // 弧长
}

// ---- 核心算法 ----

/**
 * 在 JD 处用给定半径计算圆弧参数
 */
function computeArcWithR(
  prev: Vec2,
  curr: Vec2,
  next: Vec2,
  r: number,
): ArcInfo | null {
  if (r <= 0) return null;

  const d1 = normalize(sub(curr, prev)); // 入方向
  const d2 = normalize(sub(next, curr)); // 出方向

  // 有符号转角
  const crossVal = cross(d1, d2);
  const dotVal = d1.x * d2.x + d1.y * d2.y;
  const deflection = Math.atan2(crossVal, dotVal);

  // 近似直线，跳过
  if (Math.abs(deflection) < 1e-8) return null;

  const halfDeflection = deflection / 2;
  const tanHalf = Math.tan(halfDeflection);

  // 切线长：从 JD 到切点的距离
  const T = r * Math.abs(tanHalf);

  // ---- 圆心 ----
  // 角平分线方向：bisector = d1 + d2，归一化
  const bisector = normalize(add(d1, d2));
  // 圆心到 JD 的距离：R / sin(|Δα|/2)
  const centerDist = r / Math.abs(Math.sin(halfDeflection));
  const center = add(curr, scale(bisector, centerDist));

  // ---- 切点 ----
  const st = sub(curr, scale(d1, T)); // 入切点（在 curr → prev 方向上回退 T）
  const et = add(curr, scale(d2, T)); // 出切点（在 curr → next 方向前进 T）

  // ---- 角度 ----
  const startAngle = Math.atan2(st.y - center.y, st.x - center.x);
  const endAngle = Math.atan2(et.y - center.y, et.x - center.x);

  // 行进方向：deflection > 0 → 左转 → 逆时针；< 0 → 右转 → 顺时针
  const clockwise = deflection < 0;

  // 弧长
  const arcLen = r * Math.abs(deflection);

  return { center, startAngle, endAngle, clockwise, st, et, arcLen };
}

// ---- 主函数 ----

/**
 * 根据 JD 数组生成路段列表
 *
 * @param jds JD 交点数组（按里程递增排列，至少 2 个）
 * @returns Segment[]（里程连续的路段链）
 */
export function buildAlignment(jds: JD[]): Segment[] {
  if (jds.length < 2) {
    return [];
  }

  const points: Vec2[] = jds.map((jd) => ({ x: jd.x, y: jd.y }));
  const segments: Segment[] = [];

  // 第一段里程起点：使用第一个 JD 的里程
  let currentMileage = jds[0].mileage;

  // 当前线路所在位置（上一个路段的终点）
  let lineStart = points[0];

  // 遍历每个中间 JD（1 ~ n-2）
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];

    // 尝试在当前 JD 处计算圆弧
    const arc = computeArcWithR(prev, curr, next, jds[i].r);

    if (arc) {
      // === 有圆弧：Line → Arc → Line ===

      // 1. 入直线：lineStart → arc.st
      const lineLen1 = dist(lineStart, arc.st);
      if (lineLen1 > 1e-8) {
        segments.push(
          new LineSegment({
            startPoint: lineStart,
            endPoint: arc.st,
            startMileage: currentMileage,
            endMileage: currentMileage + lineLen1,
          }),
        );
        currentMileage += lineLen1;
      }

      // 2. 圆弧（radius 直接用 JD 的 r，ArcSegment 内部会用 length/r 作为 sweepAngle）
      segments.push(
        new ArcSegment({
          center: arc.center,
          radius: jds[i].r,
          startAngle: arc.startAngle,
          endAngle: arc.endAngle,
          clockwise: arc.clockwise,
          startMileage: currentMileage,
          endMileage: currentMileage + arc.arcLen,
        }),
      );
      currentMileage += arc.arcLen;

      // 更新 lineStart，下一段直线从出切点开始
      lineStart = arc.et;
    } else {
      // === 无圆弧：直线直连到当前 JD ===
      const lineLen = dist(lineStart, curr);
      if (lineLen > 1e-8) {
        segments.push(
          new LineSegment({
            startPoint: lineStart,
            endPoint: curr,
            startMileage: currentMileage,
            endMileage: currentMileage + lineLen,
          }),
        );
        currentMileage += lineLen;
      }
      lineStart = curr;
    }
  }

  // 最后一段直线：从 lineStart → 终点 JD[n-1]
  const lastPoint = points[points.length - 1];
  const lastLineLen = dist(lineStart, lastPoint);
  if (lastLineLen > 1e-8) {
    segments.push(
      new LineSegment({
        startPoint: lineStart,
        endPoint: lastPoint,
        startMileage: currentMileage,
        endMileage: currentMileage + lastLineLen,
      }),
    );
  }

  return segments;
}
