type FieldType = "string" | "string[]";

export interface Field {
  name: string;
  type: FieldType;
}

// Interface décrivant la forme statique de DirectusAuth
export interface AuthInterface {
  // La propriété NAME est toujours égale à "directus"
  NAME: string;
  // La liste des champs nécessaires
  NEEDED_FIELDS: Field[];
}
