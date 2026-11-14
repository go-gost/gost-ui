export type Page = "config" | "overview";

/** Left navigation order. Config stays first so the landing page is unchanged. */
export const NAV_ORDER: readonly Page[] = ["config", "overview"];
