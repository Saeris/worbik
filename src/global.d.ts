import "react";

declare module "react" {
  // Invoker Commands aren't yet a part of React's types
  // See: https://developer.mozilla.org/en-US/docs/Web/API/Invoker_Commands_API
  interface ButtonHTMLAttributes<T> extends HTMLAttributes<T> {
    /** The action to perform on the element this button controls */
    command?:
      | `--${string}`
      | `close`
      | `hide-popover`
      | `request-close`
      | `show-modal`
      | `show-popover`
      | `toggle-popover`;
    /** The ID of the element this button controls */
    commandfor?: string;
  }
}
