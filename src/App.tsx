/* ============================================================
 * src/App.tsx
 * 应用根组件 —— 线路可视化 + 里程查询
 * ============================================================ */

import { useMemo, useState } from 'react';
import type { FC, ChangeEvent } from 'react';

import AlignmentView from './components/AlignmentView';
import { buildAlignment } from './alignment/buildAlignment';
import { queryMileage } from './alignment/queryMileage';
import type { JD, PointResult, Segment } from './types';

// ---- 演示用 JD 数据 ----
// 模拟一段 S 形弯道公路：西→右弯→东→左弯→东南方向
const DEMO_JDS: JD[] = [
  { mileage: 0,     x: 0,    y: 500,  ls1: 0, r: 0,    ls2: 0 },  // 起点（直通）
  { mileage: 400,   x: 400,  y: 500,  ls1: 0, r: 300,  ls2: 0 },  // 右弯，R=300
  { mileage: 1000,  x: 1000, y: 200,  ls1: 0, r: 0,    ls2: 0 },  // 中间直通
  { mileage: 1400,  x: 1000, y: 600,  ls1: 0, r: 400,  ls2: 0 },  // 左弯，R=400
  { mileage: 2200,  x: 1600, y: 200,  ls1: 0, r: 0,    ls2: 0 },  // 中间直通
  { mileage: 2600,  x: 1600, y: 600,  ls1: 0, r: 250,  ls2: 0 },  // 右弯，R=250
  { mileage: 3200,  x: 2000, y: 800,  ls1: 0, r: 0,    ls2: 0 },  // 终点（直通）
];

// ---- 图例颜色 ----
const LINE_COLOR = '#4A90D9';
const ARC_COLOR = '#E74C3C';

const App: FC = () => {
  const segments: Segment[] = useMemo(() => buildAlignment(DEMO_JDS), []);

  // ---- 里程查询状态 ----
  const [inputValue, setInputValue] = useState('');
  const [queryResult, setQueryResult] = useState<PointResult | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [queriedMileage, setQueriedMileage] = useState<number | undefined>(undefined);

  const stats = useMemo(() => {
    let lines = 0;
    let arcs = 0;
    let totalLength = 0;
    for (const seg of segments) {
      totalLength += seg.length;
      if (seg.constructor.name === 'LineSegment') lines++;
      else if (seg.constructor.name === 'ArcSegment') arcs++;
    }
    return { lines, arcs, totalLength };
  }, [segments]);

  // 点击查询
  const handleQuery = () => {
    const mileage = parseFloat(inputValue);
    if (isNaN(mileage)) {
      setQueryError('请输入有效数字');
      setQueryResult(null);
      setQueriedMileage(undefined);
      return;
    }
    const result = queryMileage(segments, mileage);
    if (!result) {
      setQueryError(`里程 ${mileage} 不在任何路段范围内`);
      setQueryResult(null);
      setQueriedMileage(undefined);
      return;
    }
    setQueryError(null);
    setQueryResult(result);
    setQueriedMileage(mileage);
  };

  // 回车也可触发查询
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleQuery();
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0f0f1a',
        color: '#e0e0e0',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        padding: '24px',
      }}
    >
      {/* 标题 */}
      <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 600, color: '#fff' }}>
        线路可视化
      </h1>
      <p style={{ margin: '0 0 20px', color: '#666', fontSize: 13 }}>
        根据 JD 交点自动构建路段（buildAlignment） + SVG 渲染（AlignmentView）
      </p>

      {/* 图例 */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 16, fontSize: 13 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ display: 'inline-block', width: 20, height: 3, background: LINE_COLOR, borderRadius: 2 }} />
          直线段（LineSegment）
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ display: 'inline-block', width: 20, height: 3, background: ARC_COLOR, borderRadius: 2 }} />
          圆弧段（ArcSegment）
        </span>
      </div>

      {/* 里程查询面板 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
        padding: '12px 16px',
        background: '#1a1a2e',
        borderRadius: 8,
        border: '1px solid #2a2a3e',
      }}>
        <label style={{ fontSize: 13, color: '#aaa', whiteSpace: 'nowrap' }}>
          里程查询（m）：
        </label>
        <input
          type="number"
          value={inputValue}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`输入 0 ~ ${segments[segments.length - 1]?.endMileage.toFixed(0) ?? '?'}`}
          style={{
            flex: 1,
            maxWidth: 200,
            padding: '6px 10px',
            background: '#0f0f1a',
            border: '1px solid #3a3a5e',
            borderRadius: 6,
            color: '#e0e0e0',
            fontSize: 14,
            outline: 'none',
          }}
        />
        <button
          onClick={handleQuery}
          style={{
            padding: '6px 18px',
            background: '#4A90D9',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          查询
        </button>

        {/* 查询结果 */}
        {queryResult && (
          <div style={{
            marginLeft: 12,
            display: 'flex',
            gap: 16,
            fontSize: 13,
            color: '#2ECC71',
          }}>
            <span>X: <b>{queryResult.x.toFixed(2)}</b></span>
            <span>Y: <b>{queryResult.y.toFixed(2)}</b></span>
            <span>方位角: <b>{(queryResult.azimuth * 180 / Math.PI).toFixed(2)}°</b></span>
          </div>
        )}

        {/* 查询错误 */}
        {queryError && (
          <span style={{ marginLeft: 12, fontSize: 13, color: '#E74C3C' }}>
            {queryError}
          </span>
        )}
      </div>

      {/* SVG 线路视图 */}
      <div style={{
        border: '1px solid #2a2a3e',
        borderRadius: 8,
        overflow: 'hidden',
        maxHeight: '65vh',
      }}>
        <AlignmentView
          segments={segments}
          padding={60}
          showJoints={true}
          currentPoint={queryResult ? { x: queryResult.x, y: queryResult.y } : undefined}
          currentDirection={queryResult ? { x: queryResult.x, y: queryResult.y, tx: queryResult.tangent[0], ty: queryResult.tangent[1] } : undefined}
          currentMileage={queriedMileage}
        />
      </div>

      {/* 统计信息 */}
      <div style={{ marginTop: 16, display: 'flex', gap: 24, fontSize: 13, color: '#888' }}>
        <span>JD 数量：{DEMO_JDS.length}</span>
        <span>路段总数：{segments.length}</span>
        <span style={{ color: LINE_COLOR }}>直线段：{stats.lines}</span>
        <span style={{ color: ARC_COLOR }}>圆弧段：{stats.arcs}</span>
        <span>总里程：{stats.totalLength.toFixed(1)} m</span>
        <span>里程范围：{segments[0]?.startMileage.toFixed(0)} ~ {segments[segments.length - 1]?.endMileage.toFixed(0)}</span>
      </div>
    </div>
  );
};

export default App;
