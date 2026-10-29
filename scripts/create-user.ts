/*
 * Crea un usuario del panel (inicia sesión con usuario y contraseña).
 * Uso: npm run db:user -- <usuario> <contraseña> "<nombre>" <correo> <empresa-id>
 * Ejemplo: npm run db:user -- ana.perez "una-clave-segura" "Ana Pérez" ana@empresa.cl empresa-a
 * Usa la base de DATABASE_URL (o la local si no existe). Sirve para crear el primer acceso.
 */
import { closeDb, getDb } from "../src/db/client";
import { BookingError, createStaffUser, type BookingContext } from "../src/lib/bookings";
import { config } from "../src/lib/config";

const [username, password, name, email, companyId] = process.argv.slice(2);

async function main() {
  if (!username || !password || !name || !email || !companyId) {
    console.error('Uso: npm run db:user -- <usuario> <contraseña> "<nombre>" <correo> <empresa-id>');
    process.exit(1);
  }

  const ctx: BookingContext = { db: await getDb(), cfg: config, mail: { name: "silencioso", async send() {} } };
  try {
    const user = await createStaffUser(ctx, { username, password, name, email, companyId });
    console.log(`Usuario creado: ${user.username} (${user.name})`);
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
