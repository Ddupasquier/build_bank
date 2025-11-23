import { useQuery } from "@tanstack/react-query";
import { ipcClient } from "../api/ipcClient";

export default function DashboardPage() {
  const materialsQuery = useQuery({
    queryKey: ["materials"],
    queryFn: ipcClient.listMaterials
  });
  const vendorsQuery = useQuery({
    queryKey: ["vendors"],
    queryFn: ipcClient.listVendors
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Materials" value={materialsQuery.data?.length ?? 0} />
        <StatCard title="Vendors" value={vendorsQuery.data?.length ?? 0} />
        <StatCard title="Last Update" value="—" />
        <StatCard title="Alerts" value="Coming soon" />
      </div>
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6">
        <div className="text-lg font-semibold mb-2">Trends</div>
        <p className="text-sm text-slate-300">
          Hook charts here to show price history once scraping is wired. Uses local SQLite data.
        </p>
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-4">
      <div className="text-sm text-slate-400">{title}</div>
      <div className="text-2xl font-semibold text-slate-100">{value}</div>
    </div>
  );
}
