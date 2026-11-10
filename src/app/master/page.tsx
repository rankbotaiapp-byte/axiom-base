"use client";

import { MasterAdminPage } from "@/components/master-desk";
import { MasterCyberFrame } from "@/components/master/master-cyber-frame";

export default function MasterDashboardPage() {
  return (
    <MasterCyberFrame className="[&_input]:bg-slate-950 [&_select]:bg-slate-950 [&_option]:bg-slate-950 [&_textarea]:bg-slate-950">
      <MasterAdminPage />
    </MasterCyberFrame>
  );
}
