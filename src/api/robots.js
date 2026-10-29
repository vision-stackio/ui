import { apiClient } from "./client";
export const robotsApi = {
  health: () => apiClient.get("/system/health"),
  capabilities: () => apiClient.get("/system/capabilities"),
  /** Mode, transport, heartbeat age and body state — see server/src/robot/linkStatus.ts */
  link: () => apiClient.get("/system/robot-link"),
};
