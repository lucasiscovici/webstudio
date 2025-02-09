import {
  type ReactNode,
  useEffect,
  useId,
  useMemo,
  useState,
  useCallback,
} from "react";
import { useStore } from "@nanostores/react";
import { computed } from "nanostores";
import {
  theme,
  InputField,
  Flex,
  ToggleGroup,
  ToggleGroupButton,
  Select,
  Tooltip,
  SelectGroup,
  SelectLabel,
  SelectItem,
} from "@webstudio-is/design-system";
import {
  AttachmentIcon,
  EmailIcon,
  LinkIcon,
  PageIcon,
  PhoneIcon,
} from "@webstudio-is/icons";
import type { Folder, Instance, Page } from "@webstudio-is/sdk";
import {
  AuthList,
  decodeDataSourceVariable,
  generateObjectExpression,
  parseObjectExpression,
} from "@webstudio-is/sdk";
import {
  findParentFolderByChildId,
  findTreeInstanceIds,
} from "@webstudio-is/sdk";
import { $pages, $selectedPageDefaultSystem } from "~/shared/nano-states";
import {
  BindingControl,
  BindingPopover,
} from "~/builder/shared/binding-popover";
import {
  type ControlProps,
  useLocalValue,
  VerticalLayout,
  Label,
  updateExpressionValue,
  $selectedInstanceScope,
  useBindingState,
  humanizeAttribute,
} from "../shared";
import { SelectAsset } from "./select-asset";
import { createRootFolder } from "@webstudio-is/project-build";

type UrlControlProps = ControlProps<"url">;

type BaseControlProps = {
  id: string;
  instanceId: string;
  readOnly: boolean;
  prop: UrlControlProps["prop"];
  value: string;
  onChange: UrlControlProps["onChange"];
  onDelete: UrlControlProps["onDelete"];
};

const Row = ({ children }: { children: ReactNode }) => (
  <Flex css={{ height: theme.spacing[13] }} align="center" justify="between">
    {children}
  </Flex>
);

const Col = ({ children }: { children: ReactNode }) => (
  <Flex css={{ height: theme.spacing[13] }} direction={"column"}>
    {children}
  </Flex>
);

const getName = (data: { name: string }) => data.name;
const getHash = (data: { hash: string }) => data.hash;
const getInstanceId = (data: { instanceId: string }) => data.instanceId;

const BasePage: React.FC<BaseControlProps> = ({ prop, value, onChange }) => {
  // 1. Récupération des données du store
  const pages = useStore($pages);
  const system = useStore($selectedPageDefaultSystem);
  const allAuth = useMemo(() => pages?.auth?.auth ?? [], [pages]);

  // 2. Conversion de la chaîne JSON en objet AuthValue
  const initialAuthValue = useMemo(() => {
    if (prop?.type === "auth") {
      // En mode "auth", on suppose que prop.value est déjà un objet AuthValue.
      return prop.value;
    } else if (prop?.type === "expression") {
      // En mode "expression", la valeur calculée est passée dans "value" (JSON string).
      try {
        return value ? JSON.parse(value) : { auth: null, provider: null }; //url: null
      } catch (error) {
        console.error("Erreur lors du parsing de value :", error);
        return { auth: null, provider: null }; // url: null
      }
    }
    return { auth: null, provider: null }; // url: null
  }, [prop, value]);

  const handleLocalValueChange = useCallback(
    (newValue) => {
      if (prop?.type === "expression") {
        const pv = parseObjectExpression(prop.value);
        for (const [key, value] of pv.entries()) {
          const element = value;
          if (decodeDataSourceVariable(element)) {
            updateExpressionValue(element, newValue[key]);
          } else {
            pv.set(key, JSON.stringify(newValue[key]));
          }
        }
        Object.entries(newValue).forEach(([key, value]) => {
          if (!pv.has(key)) {
            pv.set(key, JSON.stringify(value));
          }
        });

        const gen = generateObjectExpression(pv);
        if (gen !== prop.value) {
          onChange({ type: "expression", value: gen });
        }
      } else {
        onChange({ type: "auth", value: newValue });
      }
    },
    [prop, onChange]
  );
  // 3. Gestion locale de la valeur et synchronisation via onChange
  const localValue = useLocalValue(initialAuthValue, handleLocalValueChange);

  // 4. Extraction des valeurs locales
  const { auth: selectedAuth, provider: selectedProvider } = localValue.value;

  // 5. Recherche de la configuration associée à l'authentification sélectionnée
  const currentAuthConfig = useMemo(() => {
    return allAuth.find((config) => config.name === selectedAuth);
  }, [selectedAuth, allAuth]);

  // Options disponibles pour le provider
  const providerOptions = currentAuthConfig?.configs?.providers ?? [];

  // 6. Mise à jour automatique de l'URL dès qu'une auth et un provider sont définis
  useEffect(() => {
    if (selectedAuth && selectedProvider && currentAuthConfig) {
      localValue.set({
        auth: selectedAuth,
        provider: selectedProvider,
        url: currentAuthConfig.url,
        redirect_url: currentAuthConfig?.redirect_url ?? system.origin,
      }); //, url: newUrl
      localValue.save();
    }
  }, [selectedAuth, selectedProvider, currentAuthConfig, system.origin]); // currentUrl

  // 7. Gestionnaires d'événements
  const handleAuthChange = useCallback(
    (newAuth: string) => {
      // Lors d'un changement d'auth, on réinitialise le provider et l'URL
      localValue.set({ auth: newAuth, provider: selectedProvider }); // url: currentUrl
    },
    [localValue]
  );

  const handleProviderChange = useCallback(
    (newProvider: string) => {
      localValue.set({ auth: selectedAuth, provider: newProvider }); // url: currentUrl
      localValue.save();
    },
    [selectedAuth, localValue]
  );

  // 8. Rendu du composant
  return (
    <>
      {/* Sélection de l'authentification */}
      <Row>
        <Select
          value={selectedAuth || ""}
          onChange={handleAuthChange}
          placeholder="Choisir une authentification"
          fullWidth
          options={allAuth.map(getName)}
        >
          {allAuth.map((config) => (
            <SelectItem key={config.name} value={config.name}>
              {config.name}
            </SelectItem>
          ))}
        </Select>
      </Row>

      {/* Sélection du provider */}
      <Row>
        <Select
          value={selectedProvider || ""}
          onChange={handleProviderChange}
          disabled={providerOptions.length === 0}
          placeholder={
            providerOptions.length === 0
              ? "Aucun provider disponible"
              : "Choisir un provider"
          }
          fullWidth
          options={providerOptions}
        >
          {providerOptions.map((provider: string) => (
            <SelectItem key={provider} value={provider}>
              {provider}
            </SelectItem>
          ))}
        </Select>
      </Row>
    </>
  );
};

export const AuthControl = ({
  instanceId,
  meta,
  prop,
  propName,
  computedValue,
  deletable,
  onChange,
  onDelete,
}: UrlControlProps) => {
  const value = JSON.stringify(computedValue ?? "");
  const id = useId();

  const BaseControl = BasePage;

  const label = humanizeAttribute(meta.label || propName);
  const { scope, aliases } = useStore($selectedInstanceScope);
  const expression =
    prop?.type === "expression" ? prop.value : JSON.stringify(computedValue);
  const { overwritable, variant } = useBindingState(
    prop?.type === "expression" ? prop.value : undefined
  );

  return (
    <VerticalLayout
      label={
        <Label htmlFor={id} description={meta.description}>
          {label}
        </Label>
      }
      deletable={deletable}
      onDelete={onDelete}
    >
      <BindingControl>
        <BaseControl
          id={id}
          instanceId={instanceId}
          readOnly={overwritable === false}
          prop={prop}
          value={value}
          onChange={onChange}
          onDelete={onDelete}
        />
        <BindingPopover
          scope={scope}
          aliases={aliases}
          validate={(value) => {
            if (value !== undefined && typeof value !== "object") {
              return `${label} expects a string value, page or file`;
            }
          }}
          variant={variant}
          value={expression ?? JSON.stringify({ auth: null, provider: null })}
          onChange={(newExpression) =>
            onChange({ type: "expression", value: newExpression })
          }
          onRemove={(evaluatedValue) =>
            onChange({ type: "auth", value: { auth: null, provider: null } })
          }
        />
      </BindingControl>
    </VerticalLayout>
  );
};
