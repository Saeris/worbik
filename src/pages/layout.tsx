import "@fontsource-variable/montserrat";
import "#theme/theme.css";
import "#theme/global.css";

const Layout = ({
  children
}: {
  readonly children: React.ReactNode;
}): React.ReactNode => children;

export default Layout;
