import { readMenu } from "../src/lib/menu";

try {
  const items = await readMenu();
  console.log(`config.json: validated ${items.length} menu items.`);
} catch (error) {
  console.error(
    `config.json validation failed: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
}
