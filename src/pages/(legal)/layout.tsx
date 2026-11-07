import { Link } from "@void/react";
import { PiCaretLeftThin } from "react-icons/pi";
import styles from "./legal.module.css";

/** The terms and the privacy policy: documents to be read, with a way back to the game */
const Layout = ({
  children
}: {
  readonly children: React.ReactNode;
}): React.ReactNode => (
  <div className={styles.page}>
    <nav>
      <Link href="/">
        <PiCaretLeftThin aria-hidden />
        Back to the puzzle
      </Link>
    </nav>
    <main>{children}</main>
  </div>
);

export default Layout;
