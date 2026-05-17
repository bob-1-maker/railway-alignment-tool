/* ============================================================
 * src/components/AlignmentView.tsx
 * 根据 Segment[] 渲染完整线形的 SVG 视图
 * ============================================================
 *
 * 职责：
 *   1. 遍历 Segment[]，对每个路段采样点序列
 *   2. 自动计算包围盒，生成 SVG viewBox
 *   3. 翻转 y 轴（工程坐标 y↑北 → SVG y↓）
 *   4. LineSegment 用 polyline 两点连线（蓝色）
 *   5. ArcSegment 采样 50 点后用 polyline 绘制（红色）
 *   6. Hover Tooltip：每个路段 50 点采样，鼠标悬停显示里程/坐标/方位角
 * ============================================================ */

import { useMemo, useState, useCallback, useRef } from 'react';
import type { FC, MouseEvent } from 'react';

import type { Segment } from '../segments/Segment';
import { LineSegment } from '../segments/LineSegment';
import { ArcSegment } from '../segments/ArcSegment';

// ---- 颜色配置 ----
const LINE_COLOR = '#4A90D9';   // 直线段：蓝色
const ARC_COLOR = '#E74C3C';    // 圆弧段：红色
const POINT_RADIUS = 3;          // JD 标记点半径

// ---- Hover Tooltip 配置 ----
const HOVER_SAMPLES = 50;        // 每段 hover 采样点数
const HIT_RADIUS = 18;           // 不可见捕获圆半径（SVG 坐标单位）

// ---- 内部类型 ----

/** 一个采样点（工程坐标系） */
interface SamplePoint {
  x: number;
  y: number;
}

/** 一个路段的采样结果，携带类型信息用于着色 */
interface SampledSegment {
  /** 'line' | 'arc' */
  type: 'line' | 'arc';
  /** 采样点序列（工程坐标，y 向上） */
  points: SamplePoint[];
}

/** Hover 采样点（含里程与方位角，用于 tooltip 显示） */
interface HitPoint {
  /** 工程坐标 x */
  x: number;
  /** 工程坐标 y */
  y: number;
  /** 里程（m） */
  mileage: number;
  /** 方位角（弧度） */
  azimuth: number;
  /** 唯一 key，避免 React key 警告 */
  key: string;
}

/** Tooltip 展示数据 */
interface TooltipData {
  /** 鼠标屏幕 x（相对于 SVG 容器） */
  screenX: number;
  /** 鼠标屏幕 y（相对于 SVG 容器） */
  screenY: number;
  /** 工程坐标 x */
  x: number;
  /** 工程坐标 y */
  y: number;
  /** 方位角（度） */
  azimuthDeg: number;
  /** 里程（m） */
  mileage: number;
}

// ---- 采样函数 ----

/** 对直线路段采样（起终点 2 个点） */
function sampleLine(seg: LineSegment): SampledSegment {
  const p0 = seg.getPointAt(seg.startMileage);
  const p1 = seg.getPointAt(seg.endMileage);
  return { type: 'line', points: [{ x: p0.x, y: p0.y }, { x: p1.x, y: p1.y }] };
}

/** 对圆弧路段采样（默认 50 个点） */
function sampleArc(seg: ArcSegment, samples = 50): SampledSegment {
  const points: SamplePoint[] = [];
  for (let i = 0; i <= samples; i++) {
    // 等间距取里程
    const s = seg.startMileage + (i / samples) * seg.length;
    const p = seg.getPointAt(s);
    points.push({ x: p.x, y: p.y });
  }
  return { type: 'arc', points };
}

/** 对任意 Segment 采样（用于渲染） */
function sampleSegment(seg: Segment): SampledSegment {
  if (seg instanceof ArcSegment) return sampleArc(seg);
  if (seg instanceof LineSegment) return sampleLine(seg);
  // 未知类型按直线处理（理论上不会到这里）
  return { type: 'line', points: [] };
}

/**
 * 对任意 Segment 采样（用于 hover 捕获）
 * 每段均匀采样 HOVER_SAMPLES 个点，返回含里程和方位角的 HitPoint[]
 */
function sampleForHit(seg: Segment, segIndex: number): HitPoint[] {
  const points: HitPoint[] = [];
  for (let i = 0; i <= HOVER_SAMPLES; i++) {
    const s = seg.startMileage + (i / HOVER_SAMPLES) * seg.length;
    const p = seg.getPointAt(s);
    points.push({
      x: p.x,
      y: p.y,
      mileage: s,
      azimuth: p.azimuth,
      key: `hit-${segIndex}-${i}`,
    });
  }
  return points;
}

// ---- 坐标变换 ----

/**
 * 工程坐标 → SVG 坐标
 * 只翻转 y 轴：svgY = maxY - engY
 */
function toSvg(p: SamplePoint, maxY: number): SamplePoint {
  return { x: p.x, y: maxY - p.y };
}

/** 将采样点序列转为 SVG polyline 的 points 字符串 */
function toPointsString(points: SamplePoint[], maxY: number): string {
  return points.map((p) => {
    const sp = toSvg(p, maxY);
    return `${sp.x},${sp.y}`;
  }).join(' ');
}

// ---- 组件 ----

interface AlignmentViewProps {
  /** 路段数组 */
  segments: Segment[];
  /** 画布内边距（px，防止线段贴边） */
  padding?: number;
  /** 是否显示路段连接点 */
  showJoints?: boolean;
  /** 当前查询点（工程坐标，y 向上） */
  currentPoint?: { x: number; y: number };
  /** 当前查询点的切线方向（工程坐标系，y 向上） */
  currentDirection?: { x: number; y: number; tx: number; ty: number };
  /** 当前里程值，用于左上角显示 */
  currentMileage?: number;
}

// ---- 箭头配置 ----
const ARROW_LENGTH = 40;           // 切线箭头长度（SVG 坐标单位）
const ARROW_COLOR = '#2ECC71';     // 箭头颜色（绿色）

const AlignmentView: FC<AlignmentViewProps> = ({
  segments,
  padding = 40,
  showJoints = true,
  currentPoint,
  currentDirection,
  currentMileage,
}) => {
  // ---- Hover Tooltip 状态 ----
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 1. 采样所有路段（用于渲染）
  const sampled = useMemo(() => segments.map(sampleSegment), [segments]);

  // 2. 采样所有路段（用于 hover 捕获）
  const hitPoints = useMemo(
    () => segments.flatMap((seg, idx) => sampleForHit(seg, idx)),
    [segments],
  );

  // 3. 计算路段标签（中点位置 + 文本）
  const labels = useMemo(() => {
    return segments.map((seg, idx) => {
      // 取路段中点里程
      const midMileage = (seg.startMileage + seg.endMileage) / 2;
      const p = seg.getPointAt(midMileage);
      // 标签文本
      const text = seg instanceof ArcSegment
        ? `ARC R=${seg.radius}`
        : 'LINE';
      // 颜色与线段一致
      const color = seg instanceof ArcSegment ? ARC_COLOR : LINE_COLOR;
      return { x: p.x, y: p.y, text, color, key: `label-${idx}` };
    });
  }, [segments]);

  // 3. 收集所有点，计算包围盒
  const bbox = useMemo(() => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const seg of sampled) {
      for (const p of seg.points) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      }
    }
    // 防止空数据
    if (!isFinite(minX)) return { minX: 0, minY: 0, maxX: 100, maxY: 100 };
    return { minX, minY, maxX, maxY };
  }, [sampled]);

  // 4. 计算 viewBox（加入 padding，翻转 y 轴）
  const viewBoxWidth = bbox.maxX - bbox.minX;
  const viewBoxHeight = bbox.maxY - bbox.minY;

  const vbX = bbox.minX - padding;
  const vbY = -padding;
  const vbW = viewBoxWidth + 2 * padding;
  const vbH = viewBoxHeight + 2 * padding;

  const viewBox = `${vbX} ${vbY} ${vbW} ${vbH}`;

  // 5. 收集连接点（用于绘制路段端点标记）
  const joints = useMemo(() => {
    if (!showJoints) return [];
    const pts: SamplePoint[] = [];
    for (const seg of sampled) {
      if (seg.points.length > 0) {
        pts.push(seg.points[0]);
        pts.push(seg.points[seg.points.length - 1]);
      }
    }
    return pts;
  }, [sampled, showJoints]);

  // ---- Hover 事件处理 ----

  /** 鼠标进入采样圆 → 显示 tooltip */
  const handleHoverEnter = useCallback(
    (pt: HitPoint, e: MouseEvent<SVGCircleElement>) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setTooltip({
        screenX: e.clientX - rect.left,
        screenY: e.clientY - rect.top,
        x: pt.x,
        y: pt.y,
        azimuthDeg: (pt.azimuth * 180) / Math.PI,
        mileage: pt.mileage,
      });
    },
    [],
  );

  /** 鼠标在采样圆上移动 → 更新 tooltip 位置 */
  const handleHoverMove = useCallback(
    (e: MouseEvent<SVGCircleElement>) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setTooltip((prev) =>
        prev
          ? { ...prev, screenX: e.clientX - rect.left, screenY: e.clientY - rect.top }
          : prev,
      );
    },
    [],
  );

  /** 鼠标离开采样圆 → 隐藏 tooltip */
  const handleHoverLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <svg
        width="100%"
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
        style={{
          background: '#1a1a2e',
          borderRadius: 8,
          display: 'block',
        }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* 网格（可选装饰） */}
        <defs>
          <pattern
            id="alignment-grid"
            width={50}
            height={50}
            patternUnits="userSpaceOnUse"
            patternTransform={`translate(${vbX}, ${vbY})`}
          >
            <path
              d="M 50 0 L 0 0 0 50"
              fill="none"
              stroke="#ffffff0a"
              strokeWidth="0.5"
            />
          </pattern>
          {/* 切线箭头 marker */}
          <marker
            id="tangent-arrow"
            viewBox="0 0 10 10"
            refX={9}
            refY={5}
            markerWidth={6}
            markerHeight={6}
            orient="auto-start-reverse"
            fill={ARROW_COLOR}
          >
            <path d="M 0 1 L 10 5 L 0 9 Z" />
          </marker>
        </defs>
        <rect x={vbX} y={vbY} width={vbW} height={vbH} fill="url(#alignment-grid)" />

        {/* 左上角里程信息 */}
        {currentMileage != null && (
          <g pointerEvents="none">
            {/* 半透明白色背景 */}
            <rect
              x={vbX + 10}
              y={vbY + 8}
              width={180}
              height={28}
              rx={4}
              ry={4}
              fill="rgba(255, 255, 255, 0.08)"
            />
            <text
              x={vbX + 20}
              y={vbY + 28}
              fontSize={16}
              fontWeight="bold"
              fontFamily="'Segoe UI', system-ui, sans-serif"
              fill="#aaa"
            >
              Mileage: {currentMileage.toFixed(2)} m
            </text>
          </g>
        )}

        {/* 渲染每个路段 */}
        {sampled.map((seg, idx) => {
          const color = seg.type === 'arc' ? ARC_COLOR : LINE_COLOR;
          const sw = seg.type === 'arc' ? 2.5 : 2;
          return (
            <polyline
              key={idx}
              points={toPointsString(seg.points, bbox.maxY)}
              fill="none"
              stroke={color}
              strokeWidth={sw}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          );
        })}

        {/* 路段标签（中点位置） */}
        {labels.map((lbl) => {
          const sp = toSvg({ x: lbl.x, y: lbl.y }, bbox.maxY);
          return (
            <g key={lbl.key} pointerEvents="none">
              {/* 半透明背景矩形 */}
              <rect
                x={sp.x - 40}
                y={sp.y - 20}
                width={80}
                height={16}
                rx={3}
                ry={3}
                fill="rgba(26, 26, 46, 0.75)"
              />
              {/* 标签文字 */}
              <text
                x={sp.x}
                y={sp.y - 8}
                textAnchor="middle"
                fontSize={12}
                fontFamily="'Segoe UI', system-ui, sans-serif"
                fill={lbl.color}
                opacity={0.8}
              >
                {lbl.text}
              </text>
            </g>
          );
        })}

        {/* Hover 捕获层：不可见圆，每个路段 50 个采样点 */}
        {hitPoints.map((pt) => {
          const sp = toSvg({ x: pt.x, y: pt.y }, bbox.maxY);
          return (
            <circle
              key={pt.key}
              cx={sp.x}
              cy={sp.y}
              r={HIT_RADIUS}
              fill="transparent"
              stroke="none"
              style={{ cursor: 'crosshair' }}
              onMouseEnter={(e) => handleHoverEnter(pt, e)}
              onMouseMove={handleHoverMove}
              onMouseLeave={handleHoverLeave}
            />
          );
        })}

        {/* Hover 高亮圆（跟随鼠标最近的采样点） */}
        {tooltip && (() => {
          const sp = toSvg({ x: tooltip.x, y: tooltip.y }, bbox.maxY);
          return (
            <circle
              cx={sp.x}
              cy={sp.y}
              r={5}
              fill="#F1C40F"
              stroke="#fff"
              strokeWidth={1.5}
              pointerEvents="none"
            />
          );
        })()}

        {/* 渲染路段连接点（小圆圈） */}
        {joints.map((p, idx) => {
          const sp = toSvg(p, bbox.maxY);
          return (
            <circle
              key={`j${idx}`}
              cx={sp.x}
              cy={sp.y}
              r={POINT_RADIUS}
              fill="#fff"
              opacity={0.6}
            />
          );
        })}

        {/* 当前查询点（绿色圆点 + 白色边框） + 切线箭头 */}
        {currentPoint && (() => {
          const sp = toSvg(currentPoint, bbox.maxY);
          return (
            <g>
              <circle
                cx={sp.x}
                cy={sp.y}
                r={6}
                fill="#2ECC71"
                stroke="#fff"
                strokeWidth={2}
              />
              {/* 切线箭头：工程坐标切线 (tx, ty) 在 SVG 中 y 需翻转 */}
              {currentDirection && (() => {
                // SVG 坐标系 y 翻转：tx 不变，ty 取反
                const stx = currentDirection.tx;
                const sty = -currentDirection.ty;
                // 箭头终点 = 起点 + ARROW_LENGTH * 切向量
                const endX = sp.x + ARROW_LENGTH * stx;
                const endY = sp.y + ARROW_LENGTH * sty;
                return (
                  <line
                    x1={sp.x}
                    y1={sp.y}
                    x2={endX}
                    y2={endY}
                    stroke={ARROW_COLOR}
                    strokeWidth={2.5}
                    markerEnd="url(#tangent-arrow)"
                    pointerEvents="none"
                  />
                );
              })()}
            </g>
          );
        })()}
      </svg>

      {/* Hover Tooltip（absolute 定位，跟随鼠标） */}
      {tooltip && (
        <div
          style={{
            position: 'absolute',
            left: tooltip.screenX + 14,
            top: tooltip.screenY - 10,
            background: 'rgba(15, 15, 30, 0.92)',
            color: '#e0e0e0',
            fontSize: 12,
            lineHeight: 1.7,
            padding: '8px 12px',
            borderRadius: 6,
            border: '1px solid #3a3a5e',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            zIndex: 10,
            backdropFilter: 'blur(4px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          }}
        >
          <div><span style={{ color: '#888' }}>里程：</span><b>{tooltip.mileage.toFixed(2)} m</b></div>
          <div><span style={{ color: '#888' }}>X：</span><b>{tooltip.x.toFixed(2)}</b></div>
          <div><span style={{ color: '#888' }}>Y：</span><b>{tooltip.y.toFixed(2)}</b></div>
          <div><span style={{ color: '#888' }}>方位角：</span><b>{tooltip.azimuthDeg.toFixed(2)}°</b></div>
        </div>
      )}
    </div>
  );
};

export default AlignmentView;
