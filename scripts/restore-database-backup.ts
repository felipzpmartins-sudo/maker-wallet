import "dotenv/config";
import { readFile } from "node:fs/promises";
import { Client } from "pg";

type BackupTable = {
  schema: string;
  name: string;
  columns: { name: string }[];
  rows: Record<string, unknown>[];
};

type Backup = { tables: BackupTable[] };

function quoteIdentifier(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function restoreValue(value: unknown): unknown {
  if (
    value &&
    typeof value === "object" &&
    (value as { type?: unknown }).type === "buffer" &&
    typeof (value as { base64?: unknown }).base64 === "string"
  )
    return Buffer.from((value as { base64: string }).base64, "base64");
  return value;
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const backupPath = process.env.MAKER_WALLET_BACKUP_PATH;
  if (!connectionString || !backupPath) throw new Error("Defina DATABASE_URL e MAKER_WALLET_BACKUP_PATH.");
  const backup = JSON.parse(await readFile(backupPath, "utf8")) as Backup;
  const tables = backup.tables.filter((table) => table.schema === "public" && table.name !== "_prisma_migrations");
  const url = new URL(connectionString);
  url.searchParams.delete("schema");
  const client = new Client({ connectionString: url.toString() });
  await client.connect();
  try {
    await client.query("BEGIN");
    await client.query("SET session_replication_role = replica");
    await client.query(
      `TRUNCATE TABLE ${tables.map((table) => `${quoteIdentifier(table.schema)}.${quoteIdentifier(table.name)}`).join(", ")} RESTART IDENTITY CASCADE`,
    );
    for (const table of tables) {
      for (const row of table.rows) {
        const columns = table.columns.map((column) => column.name).filter((column) => column in row);
        if (!columns.length) continue;
        const values = columns.map((column) => restoreValue(row[column]));
        const placeholders = columns.map((_, index) => `$${index + 1}`).join(", ");
        await client.query(
          `INSERT INTO ${quoteIdentifier(table.schema)}.${quoteIdentifier(table.name)} (${columns.map(quoteIdentifier).join(", ")}) VALUES (${placeholders})`,
          values,
        );
      }
    }
    await client.query("SET session_replication_role = DEFAULT");
    await client.query("COMMIT");
    console.log(`Restauração concluída: ${tables.length} tabelas.`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Não foi possível restaurar o backup.");
  process.exit(1);
});
