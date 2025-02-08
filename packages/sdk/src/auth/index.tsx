import { DirectusAuth } from "./directus";

export const AuthList: Record<string, typeof DirectusAuth> = {
  [DirectusAuth.NAME]: DirectusAuth,
};
