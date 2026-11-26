/** Lane colors / x-positions matched to the cockpit windshield runway. */
export type RunwayLane = {
  id: "linkedin" | "youtube" | "instagram" | "facebook" | "tiktok";
  color: string;
  left: string;
  width: string;
  delay: string;
  duration: string;
};

export const RUNWAY_LANES: RunwayLane[] = [
  { id: "linkedin", color: "#3dff8a", left: "6.5%", width: "2px", delay: "0s", duration: "7.5s" },
  { id: "youtube", color: "#ff4d4f", left: "14.2%", width: "2px", delay: "0.4s", duration: "6.8s" },
  { id: "instagram", color: "#ff4f9a", left: "22%", width: "2px", delay: "0.8s", duration: "6.2s" },
  { id: "facebook", color: "#3fb0ff", left: "50%", width: "3px", delay: "0.2s", duration: "5.6s" },
  { id: "tiktok", color: "#b05cff", left: "86.5%", width: "2px", delay: "1s", duration: "7.1s" },
];
