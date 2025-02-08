import type { AuthInterface, Field } from "./auth_interface";

export class DirectusAuth implements AuthInterface {
  NAME: string;
  NEEDED_FIELDS: Field[];
  public static NAME = "directus";
  public static NEEDED_FIELDS: Field[] = [
    { name: "url", type: "string" },
    { name: "providers", type: "string[]" },
  ];
  constructor() {
    this.NAME = "";
    this.NEEDED_FIELDS = [];
  }
}
