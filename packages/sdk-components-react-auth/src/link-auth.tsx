import { forwardRef, type ComponentProps } from "react";

import * as SocialButtons from "react-social-login-buttons";

export const defaultTag = "a";

declare global {
  interface String {
    capitalize(): string;
  }
}

String.prototype.capitalize = function () {
  return this.charAt(0).toUpperCase() + this.slice(1);
};

type Props = Omit<ComponentProps<"a">, "target" | "download"> & {
  // override (string & {}) in target to generate keywords
  // target?: "_self" | "_blank" | "_parent" | "_top";
  // download?: boolean;
  // prefetch?: "none" | "intent" | "render" | "viewport";
  preventScrollReset?: boolean;
  reloadDocument?: boolean;
  replace?: boolean;
};

export const LinkAuth = forwardRef<
  HTMLAnchorElement,
  Props & { $webstudio$canvasOnly$assetId?: string | undefined }
>((props, ref) => {
  const {
    children,
    // @todo: it's a hack made for Image component for the builder and should't be in the runtime at all.
    $webstudio$canvasOnly$assetId,
    ...rest
  } = props;
  if (rest?.auth?.auth === undefined || rest?.auth?.provider === undefined) {
    return <div>Please select an auth and provider</div>;
  }
  const buttonName = `${rest.auth.provider.capitalize()}LoginButton`;
  let ButtonComponent = SocialButtons[buttonName];

  // If not found, check if it's under Y.default
  if (!ButtonComponent && SocialButtons.default) {
    ButtonComponent = SocialButtons.default[buttonName];
  }

  if (!ButtonComponent) {
    console.error(`The attribute "${buttonName}" was not found in the module.`);
  }
  // const ButtonComponent = SocialButtons;

  if (!ButtonComponent) {
    return <div>Le composant {rest?.auth?.provider ?? ""} n'existe pas.</div>;
  }
  // rest.href = url;

  console.log(rest);

  return (
    <div>
      <a {...props} href={rest?.auth?.url}>
        <ButtonComponent onClick={() => {}} />
      </a>
    </div>
  );
});

LinkAuth.displayName = "Link Auth";
