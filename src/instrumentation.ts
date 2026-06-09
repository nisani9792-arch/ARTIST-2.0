export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { runMigrations } = await import("@/lib/db/migrate");
    try {
      await runMigrations();
    } catch (error) {
      console.error("db:migrate failed:", error);
    }
  }
}
