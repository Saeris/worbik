import { Profile } from "#components/Profile";

/**
 * A player's own record. Who they are is only known to their browser, so
 * the server has nothing to load for this page, and it's filled in once
 * it's open.
 */
const Page: React.FC = () => <Profile />;

export default Page;
