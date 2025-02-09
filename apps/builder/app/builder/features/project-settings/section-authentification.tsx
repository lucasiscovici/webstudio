// SectionAuth.tsx
import { useState } from "react";
import {
  Grid,
  Flex,
  InputField,
  Button,
  Text,
  Select,
  SmallIconButton,
  theme,
} from "@webstudio-is/design-system";
import { TrashIcon } from "@webstudio-is/icons";
import { serverSyncStore } from "~/shared/sync";
import { $pages } from "~/shared/nano-states";

// Importez vos classes d'auth.
// Par exemple, si vous avez exporté DirectusAuth dans ~/builder/features/auth/index.ts
// et que l’export par défaut est un objet indexé par le nom de l’auth :
import { Auth, AuthList } from "@webstudio-is/sdk";
import { redirect } from "react-router-dom";

// Exemple de type pour la config d'auth
type AuthConfig = {
  type: string;
  fields: Record<string, string | string[]>;
};

// Si vous disposez d'un store pour ces configurations, vous pouvez l'importer, par exemple :
// import { $authConfigs } from "~/shared/nano-states";
// Pour cet exemple, on simulera la mise à jour de ce store via serverSyncStore

export const SectionAuthentication = () => {
  // Liste des auth disponibles
  const authOptions = Object.keys(AuthList);

  // États locaux pour le type d'auth sélectionné, les valeurs des champs et la liste des configurations ajoutées
  const [selectedAuth, setSelectedAuth] = useState<string>("");
  const [fieldValues, setFieldValues] = useState<
    Record<string, string | string[]>
  >({});

  const [error, setError] = useState<string>("");

  const [authConfigs, setAuthConfigs] = useState<AuthConfig[]>(() => {
    const authData = $pages.get()?.auth;
    if (!authData) return [];
    return (
      Object.values(authData?.auth ?? []).map((auth) => ({
        type: auth.name,
        fields: {
          url: auth.url,
          redirect_url: auth.redirect_url,
          ...auth.configs,
        },
      })) ?? []
    );
  });
  // Lors du changement de type d'auth, on réinitialise les champs
  const handleSelectChange = (value: string) => {
    setSelectedAuth(value);
    setFieldValues({});
    setError("");
  };

  // Mise à jour d'un champ de type string
  const handleFieldChange = (fieldName: string, value: string) => {
    setFieldValues((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
    setError("");
  };

  // Pour un champ de type string[], on utilise ici une saisie séparée par des virgules
  const handleFieldArrayChange = (fieldName: string, value: string) => {
    const arr = value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    setFieldValues((prev) => ({
      ...prev,
      [fieldName]: arr,
    }));
    setError("");
  };
  // Fonction pour mettre à jour le store côté serveur
  const updateServerStore = (configs: AuthConfig[]) => {
    serverSyncStore.createTransaction([$pages], (pages) => {
      if (!pages) return;
      if (pages.auth === undefined) {
        pages.auth = { auth: {}, currAuth: Auth.parse({}) };
      }
      const newAuth = {};
      configs.forEach((config) => {
        newAuth[config.type] = {
          name: config.type,
          url: config.fields["url"] as string,
          redirect_url: (config.fields?.["redirect_url"] ?? "") as string,
          // Conversion des champs en objet plat en excluant 'url'
          configs: {
            providers: (config.fields?.["providers"] ?? []) as string[],
          },
          token: undefined,
          logged: false,
        };
      });

      pages.auth!.auth = newAuth;
      pages.auth!.currAuth = Auth.parse({});

      // const auths= {
      //   ...configs.map((config) => ({
      //     name: config.type,
      //     url: config.fields["url"] as string,
      //     redirect_url: (config.fields?.["redirect_url"] ?? "") as string,
      //     // Conversion des champs en objet plat en excluant 'url'
      //     configs: {
      //       providers: (config.fields?.["providers"] ?? []) as string[],
      //     }
      //   })),
      // }
      // pages.auth = {
      //   auth:
      //     ...configs.map((config) => ({
      //       name: config.type,
      //       url: config.fields["url"] as string,
      //       redirect_url: (config.fields?.["redirect_url"] ?? "") as string,
      //       // Conversion des champs en objet plat en excluant 'url'
      //       configs: {
      //         providers: (config.fields?.["providers"] ?? []) as string[],
      //       }
      //     })),
      //   ],
      //   logged: pages.auth?.logged ?? false,
      // };
    });
  };

  // Vérifie si la configuration à ajouter existe déjà
  const isDuplicateConfig = (newConfig: AuthConfig): boolean => {
    // Pour une comparaison simple, on compare le JSON.stringify des configurations.
    return authConfigs.some(
      (config) => JSON.stringify(config) === JSON.stringify(newConfig)
    );
  };

  // Ajout d'une nouvelle configuration d'auth
  const addAuthConfig = () => {
    if (!selectedAuth) return;

    const newConfig: AuthConfig = {
      type: selectedAuth,
      fields: fieldValues,
    };
    if (isDuplicateConfig(newConfig)) {
      setError("Cette configuration existe déjà");
      return;
    }
    const newConfigs = [...authConfigs, newConfig];

    setAuthConfigs(newConfigs);
    updateServerStore(newConfigs);

    // Réinitialisation du formulaire
    setSelectedAuth("");
    setFieldValues({});
    setError("");
  };

  // Suppression d'une configuration à l'aide de l'icône trash
  const deleteAuthConfig = (index: number) => {
    const newConfigs = authConfigs.filter((_, idx) => idx !== index);
    setAuthConfigs(newConfigs);
    updateServerStore(newConfigs);
    setError("");
  };

  // Récupère la classe d'auth correspondant au type sélectionné
  const currentAuthClass = selectedAuth ? AuthList[selectedAuth] : null;

  return (
    <Grid gap={2} css={{ margin: theme.spacing[4] }}>
      <Text variant="titles">Ajouter une configuration d'auth</Text>

      <Flex gap="2" align="center">
        <Select
          id="auth-type"
          placeholder="Sélectionnez une auth"
          options={authOptions}
          value={selectedAuth}
          css={{ width: theme.spacing[18] }}
          onChange={(value) => handleSelectChange(value as string)}
        />

        {currentAuthClass && (
          <>
            {/* Pour chaque champ défini dans NEEDED_FIELDS, on affiche un input adapté */}
            {currentAuthClass.NEEDED_FIELDS.map((field, index) => {
              if (field.type === "string") {
                return (
                  <InputField
                    key={index}
                    placeholder={field.name}
                    value={(fieldValues[field.name] as string) || ""}
                    onChange={(e) =>
                      handleFieldChange(field.name, e.target.value)
                    }
                  />
                );
              } else if (field.type === "string[]") {
                return (
                  <InputField
                    key={index}
                    placeholder={`${field.name} (séparés par des virgules)`}
                    value={
                      Array.isArray(fieldValues[field.name])
                        ? (fieldValues[field.name] as string[]).join(", ")
                        : ""
                    }
                    onChange={(e) =>
                      handleFieldArrayChange(field.name, e.target.value)
                    }
                  />
                );
              }
              return null;
            })}
            <Button onClick={addAuthConfig}>Ajouter Auth</Button>
          </>
        )}
      </Flex>
      {error && (
        <Text color="destructive" css={{ marginTop: theme.spacing[2] }}>
          {error}
        </Text>
      )}

      {authConfigs.length > 0 && (
        <Grid gap={2}>
          <Text variant="body">Configurations d'auth ajoutées :</Text>
          {authConfigs.map((config, index) => (
            <Flex
              key={index}
              justify="between"
              align="center"
              css={{
                padding: theme.spacing[2],
                border: "1px solid #ddd",
                borderRadius: "4px",
              }}
            >
              <Flex direction="column">
                <Text>
                  <strong>Type :</strong> {config.type}
                </Text>
                <Text>
                  <strong>Champs :</strong> {JSON.stringify(config.fields)}
                </Text>
              </Flex>
              <SmallIconButton
                variant="destructive"
                icon={<TrashIcon />}
                aria-label={`Supprimer la configuration d'auth ${config.type}`}
                onClick={() => deleteAuthConfig(index)}
              />
            </Flex>
          ))}
        </Grid>
      )}
    </Grid>
  );
};

export default SectionAuthentication;
