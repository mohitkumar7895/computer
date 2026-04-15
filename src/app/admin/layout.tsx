import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Panel | Yukti Computer Institute",
  description: "ATC Application Management Admin Panel",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Standalone layout — no site Navbar or Footer
  return <>{children}</>;
}
