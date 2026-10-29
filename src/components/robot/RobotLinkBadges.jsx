import { useRobotLink } from "../../hooks/useRobotLink";
import Badge from "../common/Badge";
import { modeBadge, transportBadge } from "./robotLinkView";

/** Two badges for the top bar: which mode (SIMULATION / HARDWARE) and how the robot is connected right now. */
export default function RobotLinkBadges() {
  const { link, error } = useRobotLink();
  if (error && !link) return <Badge tone="danger" title="Can't reach the Vision server">SERVER OFFLINE</Badge>;
  const mode = modeBadge(link);
  const transport = transportBadge(link);
  return (
    <>
      <span title={link?.mode === "simulation" ? "ROBOT_MODE=simulation: a virtual robot inside the server" : "ROBOT_MODE=hardware: the real ESP32"}>
        <Badge tone={mode.tone}>{mode.label}</Badge>
      </span>
      <span title={link?.summary ?? ""}>
        <Badge tone={transport.tone}>{transport.label}</Badge>
      </span>
    </>
  );
}
