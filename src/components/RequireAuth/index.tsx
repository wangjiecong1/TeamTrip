import React from "react";
import { Navigate } from "react-router-dom";
import { authTokenStorage } from "../../services";

type RequireAuthProps = {
  children: React.ReactNode;
};

export function RequireAuth({ children }: RequireAuthProps) {
  const hasValidAccessToken = authTokenStorage.isAccessTokenValid();
  const hasRefreshToken = Boolean(authTokenStorage.getRefresh());

  if (!hasValidAccessToken && !hasRefreshToken) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
