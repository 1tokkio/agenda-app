import { redirect } from "next/navigation";

// El ingreso es único para todos los usuarios: el acceso anterior queda redirigido.
export default function AdminLoginRedirect() {
  redirect("/login");
}
