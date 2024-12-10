import React from "react";
import ReactDOM from "react-dom/client"; // 使用 React 18 的入口
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root")); // 创建挂载点
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
