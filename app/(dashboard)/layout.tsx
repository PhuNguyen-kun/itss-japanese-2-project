import { AppLayout } from "@/components/Layout";
import { WalletProvider } from "@/context/WalletContext";
import { loadWalletStats } from "@/lib/walletStats";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialStats = await loadWalletStats();

  return (
    <WalletProvider initialStats={initialStats}>
      <AppLayout>{children}</AppLayout>
    </WalletProvider>
  );
}
