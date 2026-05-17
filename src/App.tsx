import { useState } from "react";
import AlignmentView from "./components/AlignmentView";

// 👇 这几个先注释，不影响构建
// import { buildAlignment } from './core/alignmentBuilder';
// import { DEMO_JDS } from './data/demo';
// import { queryMileage } from './core/query';

function App() {
  const [mileage, setMileage] = useState("");

  // 临时空数据，让项目能正常构建
  const segments: any[] = [];

  const totalLength = 0;

  return (
    <div style={{ padding: "2rem" }}>
      <h1>线路里程坐标查询工具</h1>
      <p>总长度：{totalLength.toFixed(2)} m</p>

      <div style={{ margin: "1rem 0" }}>
        <input
          type="number"
          value={mileage}
          onChange={(e) => setMileage(e.target.value)}
          placeholder={`输入里程`}
          style={{ padding: "0.5rem", width: "300px" }}
        />
      </div>

      <AlignmentView segments={segments} />
    </div>
  );
}

export default App;
