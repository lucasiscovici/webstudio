import { type ReactNode, useEffect, useId, useMemo, useState } from "react";
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
import { AuthList } from "@webstudio-is/sdk";
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

const getName = (data: { name: string }) => data.name;
const getHash = (data: { hash: string }) => data.hash;
const getInstanceId = (data: { instanceId: string }) => data.instanceId;

const BasePage = ({ prop, onChange }: BaseControlProps) => {
  const pages = useStore($pages);
  const system = useStore($selectedPageDefaultSystem);
  const { allAuth } = useMemo(() => {
    const allAuth = pages?.auth?.auth ?? [];
    // const allAuth = []
    // // const pageSelectOptions = new Map<
    // //   Folder["id"],
    // //   { name: Folder["name"]; pages: Array<Page> }
    // // >();
    // for (const auth of auths) {
    //   allAuth.push(auth.)
    // //   let group = pageSelectOptions.get(folder.id);
    // //   if (group === undefined) {
    // //     group = { name: folder.name, pages: [] };
    // //     pageSelectOptions.set(folder.id, group);
    // //   }
    // //   group.pages.push(auth);
    // }
    return { allAuth };
  }, [pages]);

  const [url, setUrl] = useState("");

  const selectedAuth =
    prop?.type === "auth"
      ? typeof prop.value === "string"
        ? prop.value
        : prop.value.auth
      : undefined;

  const section = selectedAuth
    ? allAuth?.find(({ name }) => name === selectedAuth)
    : {};

  const sectionSelectOptions = section?.configs?.providers ?? [];

  const sectionProviderId =
    prop?.type === "auth" && typeof prop.value !== "string"
      ? prop.value.provider
      : undefined;

  const sectionSelectValue = sectionProviderId ?? undefined;

  useEffect(() => {
    if (selectedAuth && sectionSelectValue) {
      const AuthComponent = AuthList[selectedAuth];
      const inner_url = AuthComponent.getUrl(
        section?.url,
        sectionSelectValue,
        system.origin
      );
      onChange({
        type: "auth",
        value: {
          auth: selectedAuth as string,
          provider: sectionSelectValue as string,
          url: inner_url,
        },
      });
    }
  }, [selectedAuth, sectionSelectValue, system]);

  return (
    <>
      <Row>
        <Select
          value={selectedAuth}
          options={allAuth.map(getName)}
          onChange={(name) => onChange({ type: "auth", value: name })}
          placeholder="Choose Auth"
          fullWidth
        >
          {allAuth.map(({ name }) => {
            return (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            );
          })}
        </Select>
      </Row>
      <Row>
        <Select
          key={selectedAuth}
          disabled={sectionSelectOptions.length === 0}
          placeholder={
            sectionSelectOptions.length === 0
              ? sectionProviderId
                ? "Selected Auth has no providers"
                : "No providers available"
              : "Choose Provider"
          }
          value={sectionSelectValue}
          options={sectionSelectOptions}
          // getLabel={getHash}
          // getValue={getInstanceId}
          onChange={(provider: string) =>
            onChange({
              type: "auth",
              value: { auth: selectedAuth as string, provider, url },
            })
          }
          fullWidth
        />
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
  const value = String(computedValue ?? "");
  const id = useId();

  const BaseControl = BasePage;

  const label = humanizeAttribute(meta.label || propName);
  const { scope, aliases } = useStore($selectedInstanceScope);
  const expression =
    prop?.type === "expression" ? prop.value : JSON.stringify(computedValue);
  const { overwritable, variant } = useBindingState(
    prop?.type === "expression" ? prop.value : undefined
  );
  console.log(computedValue, prop, meta);

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
            if (value !== undefined && typeof value !== "string") {
              return `${label} expects a string value, page or file`;
            }
          }}
          variant={variant}
          value={expression}
          onChange={(newExpression) =>
            onChange({ type: "expression", value: newExpression })
          }
          onRemove={(evaluatedValue) =>
            onChange({ type: "string", value: String(evaluatedValue) })
          }
        />
      </BindingControl>
    </VerticalLayout>
  );
};
