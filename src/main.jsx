import React from "react";
import { createRoot } from "react-dom/client";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { queryClient } from "./services/queryClient";
import { teamTripTheme } from "./theme/antdTheme";
import "./styles.css";

dayjs.locale("zh-cn");

createRoot(document.getElementById("root")).render(
  <ConfigProvider locale={zhCN} theme={teamTripTheme}>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </ConfigProvider>,
);
