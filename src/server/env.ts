import "server-only";

/** No importar este módulo desde componentes cliente. No serializar sus resultados. */
export function getServerEnvironment() {
  return { databaseUrl: process.env.DATABASE_URL, openaiApiKey: process.env.OPENAI_API_KEY };
}
