import "@/styles.css";
import "./master-desk.css";

export default function MasterLayout({ children }: { children: React.ReactNode }) {
  return <div className="axiom-master-shell">{children}</div>;
}
