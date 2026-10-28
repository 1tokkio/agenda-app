import "@/styles/untitled-theme.css";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { hasAdminSession } from "@/lib/admin-auth";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await hasAdminSession()) redirect("/admin");
  return (
    <div className="untitled finland">
      <LoginForm eventName={config.name} subtitle={config.subtitle} logoText={config.logoText} />
    </div>
  );
}
