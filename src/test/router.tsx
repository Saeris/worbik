import { useMemo } from "react";
import { RouterContext } from "@void/react";

/** Stands in for Void's router, which is what keeps a click on a link from leaving the page that the test is on */
export const Router: React.FC<{
  readonly children: React.ReactNode;
  readonly visit?: (href: string) => void;
}> = ({ children, visit }) => {
  // Links only ask it to go somewhere, so that's all there is of it
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the rest of the router is never reached
  const router = useMemo(() => ({ visit }) as never, [visit]);

  return (
    <RouterContext.Provider value={router}>{children}</RouterContext.Provider>
  );
};
