/* ============================================================
 * src/components/AlignmentLayer.tsx
 * 渲染一条或多条线形（Alignment）的 SVG 图层
 * ============================================================ */

import type { FC } from 'react';
import type { Alignment } from '../types';
import { alignmentToPoints, pointsToSvgString } from '../alignment';

interface AlignmentLayerProps {
  /** 需要渲染的线形列表 */
  alignments: Alignment[];
  /** 是否显示端点圆圈 */
  showEndpoints?: boolean;
}

/**
 * AlignmentLayer：将 Alignment[] 转换为 SVG polyline 元素
 * - 每条线形使用各自的 color 属性
 * - showEndpoints 为 true 时在起终点绘制小圆圈
 */
const AlignmentLayer: FC<AlignmentLayerProps> = ({
  alignments,
  showEndpoints = false,
}) => {
  return (
    <g>
      {alignments.map((alignment) => {
        const points = alignmentToPoints(alignment);
        const svgPoints = pointsToSvgString(points);

        return (
          <g key={alignment.id}>
            {/* 线形折线 */}
            <polyline
              points={svgPoints}
              fill="none"
              stroke={alignment.color ?? '#4A90D9'}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* 可选：渲染端点圆圈 */}
            {showEndpoints &&
              points.map((p, idx) => (
                <circle
                  key={idx}
                  cx={p.x}
                  cy={p.y}
                  r={4}
                  fill={alignment.color ?? '#4A90D9'}
                  opacity={0.8}
                />
              ))}
          </g>
        );
      })}
    </g>
  );
};

export default AlignmentLayer;
