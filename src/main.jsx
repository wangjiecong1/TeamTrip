import React from "react";
import { createRoot } from "react-dom/client";
import { ConfigProvider } from "antd";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { queryClient } from "./services/queryClient";
import { teamTripTheme } from "./theme/antdTheme";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <ConfigProvider theme={teamTripTheme}>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </ConfigProvider>,
);
