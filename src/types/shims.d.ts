declare module "virtual:grok-og-identity" {
  export const grokOgIdentity: Record<string, unknown>;
}

declare module "*?raw" {
  const content: string;
  export default content;
}

declare module "vite/client" {}
