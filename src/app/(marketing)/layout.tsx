import type { ReactNode } from "react";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/shared/Footer";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
