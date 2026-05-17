/* ============================================================
 * src/components/CsvUploader.tsx
 * CSV 文件上传组件，使用 PapaParse 解析文件内容
 * ============================================================ */

import type { ChangeEvent, FC } from 'react';
import Papa from 'papaparse';
import type { ParsedDataset, CsvRow } from '../types';

interface CsvUploaderProps {
  /** 解析完成回调，返回 headers 和 rows */
  onParsed: (dataset: ParsedDataset) => void;
  /** 解析出错回调 */
  onError?: (error: string) => void;
}

/**
 * CsvUploader：选择本地 CSV 文件后自动解析
 * - 使用 PapaParse 解析，支持 header 行自动识别
 * - 解析完成后通过 onParsed 回调传出数据
 */
const CsvUploader: FC<CsvUploaderProps> = ({ onParsed, onError }) => {
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse<CsvRow>(file, {
      header: true,         // 第一行作为列名
      skipEmptyLines: true, // 跳过空行
      complete: (result) => {
        const headers = result.meta.fields ?? [];
        onParsed({ headers, rows: result.data });
      },
      error: (err) => {
        onError?.(err.message);
      },
    });
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <label
        style={{
          display: 'inline-block',
          padding: '6px 14px',
          background: '#4A90D9',
          color: '#fff',
          borderRadius: 6,
          cursor: 'pointer',
          fontSize: 14,
        }}
      >
        上传 CSV 文件
        <input
          type="file"
          accept=".csv"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </label>
    </div>
  );
};

export default CsvUploader;
