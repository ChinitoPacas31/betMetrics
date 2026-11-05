"use client";

import SportsSidebar from "@/components/SportsSidebar";
import OddsBoard from "@/components/OddsBoard";
import BetSlipSidebar from "@/components/BetSlipSidebar";

export default function HomePage() {
  return (
    <div className="flex items-start gap-4 pb-16 xl:pb-6">
      <SportsSidebar />
      <OddsBoard />
      <BetSlipSidebar />
    </div>
  );
}
