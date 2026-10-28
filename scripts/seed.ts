import { closeDb, getDb } from "../src/db/client";
import { seedReference } from "../src/db/seed";
import { config } from "../src/lib/config";

async function main() {
  const db = await getDb();
  await seedReference(db, config);
  await closeDb();
  console.log(`Datos de referencia cargados: ${config.companies.length} empresas, ${config.rooms.length} sala.`);
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
