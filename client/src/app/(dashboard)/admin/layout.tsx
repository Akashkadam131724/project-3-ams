import { SuperAdminGate } from "@/components/super-admin-gate";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SuperAdminGate>{children}</SuperAdminGate>;
}
