/*
 * Crea un usuario del panel (inicia sesión con usuario y contraseña).
 * Uso: npm run db:user -- <usuario> <contraseña> "<nombre>" <correo> <empresa-id> [admin|member]
 * Ejemplo: npm run db:user -- ana.perez "una-clave-segura" "Ana Pérez" ana@empresa.cl empresa-a
 * Sin el último argumento crea un administrador: sirve para el primer acceso, que luego crea a los demás.
 * Usa la base de DATABASE_URL (o la local si no existe).
 */
import { closeDb, getDb } from "../src/db/client";
import { BookingError, createStaffUser, type BookingContext } from "../src/lib/bookings";
import { supabaseAccounts } from "../src/lib/account-provider";
import { config } from "../src/lib/config";

const [username, password, name, email, companyId, roleArg = "admin"] = process.argv.slice(2);

async function main() {
  if (!username || !password || !name || !email || !companyId || (roleArg !== "admin" && roleArg !== "member")) {
    console.error('Uso: npm run db:user -- <usuario> <contraseña> "<nombre>" <correo> <empresa-id> [admin|member]');
    process.exit(1);
  }

  const ctx: BookingContext = { db: await getDb(), cfg: config, mail: { name: "silencioso", async send() {} }, accounts: supabaseAccounts() };
  try {
    const user = await createStaffUser(ctx, { username, password, name, email, companyId, role: roleArg });
    console.log(`Usuario creado: ${user.username} (${user.name}), rol: ${user.role}`);
  } catch (err) {
    if (err instanceof BookingError) {
      console.error(err.message, err.fields ?? "");
      process.exitCode = 1;
    } else {
      throw err;
    }
  } finally {
    await closeDb();
  }
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
