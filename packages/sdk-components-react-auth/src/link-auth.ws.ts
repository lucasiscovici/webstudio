import { LinkIcon } from "@webstudio-is/icons/svg";
import {
  defaultStates,
  type PresetStyle,
  type WsComponentMeta,
  type WsComponentPropsMeta,
} from "@webstudio-is/sdk";
import { a } from "@webstudio-is/sdk/normalize.css";
import type { defaultTag } from "./link-auth";
import { props } from "./__generated__/linkAuth.props";

const presetStyle = {
  a: [
    ...a,
    {
      property: "display",
      value: { type: "keyword", value: "inline-block" },
    },
  ],
} satisfies PresetStyle<typeof defaultTag>;

export const meta: WsComponentMeta = {
  type: "container",
  icon: LinkIcon,
  constraints: {
    relation: "ancestor",
    component: { $nin: ["Button", "Link"] },
  },
  presetStyle,
  states: [
    ...defaultStates,
    {
      selector: ":visited",
      label: "Visited",
    },
    {
      category: "component-states",
      selector: "[aria-current=page]",
      label: "Current page",
    },
  ],
};

export const propsMeta: WsComponentPropsMeta = {
  props: {
    ...props,
    auth: {
      type: "string",
      control: "auth",
      required: true,
    },
  },
  initialProps: ["id", "className", "auth", "href"],
};
