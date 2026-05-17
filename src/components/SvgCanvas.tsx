/* ============================================================
 * src/components/SvgCanvas.tsx
 * 通用 SVG 画布容器，负责坐标变换与背景渲染
 * ============================================================ */

import type { FC, ReactNode } from 'react';

interface SvgCanvasProps {
  /** 画布宽度（px） */
  width?: number;
  /** 画布高度（px） */
  height?: number;
  /** 内部子元素（SVG 元素） */
  children?: ReactNode;
  /** 背景色 */
  background?: string;
}

/**
 * SvgCanvas：包裹所有 SVG 绘图内容的基础容器
 * - 默认宽 800 高 500
 * - 预留 className 以便外部样式覆盖
 */
const SvgCanvas: FC<SvgCanvasProps> = ({
  width = 800,
  height = 500,
  children,
  background = '#1e1e2e',
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{
        background,
        borderRadius: 8,
        display: 'block',
        margin: '0 auto',
      }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  );
};

export default SvgCanvas;
