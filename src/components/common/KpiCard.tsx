import { cn } from "@/lib/cn";

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  tone?: "brand" | "success" | "warning";
}

const tones = {
  brand: "text-brand-500",
  success: "text-success-600",
  warning: "text-warning-600",
};

/** Tarjeta de métrica, con el estilo de EcommerceMetrics del template. */
const KpiCard: React.FC<KpiCardProps> = ({ icon, label, value, hint, tone = "brand" }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 dark:border-gray-800 dark:bg-white/3">
    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
      <span className={cn("flex", tones[tone])}>{icon}</span>
    </div>
    <div className="mt-5">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <h4 className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">{value}</h4>
      {hint && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
    </div>
  </div>
);

export default KpiCard;
