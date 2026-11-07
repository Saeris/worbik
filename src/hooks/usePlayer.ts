import { useSyncExternalStore } from "react";
import { getPlayer, subscribeToPlayer, type Player } from "#auth/player";

/** Nobody is signed in as far as the server can tell, as that is only known to the browser */
const getServerPlayer = (): null => null;

/** The player who is signed in on this device, if anyone */
export const usePlayer = (): Player | null =>
  useSyncExternalStore(subscribeToPlayer, getPlayer, getServerPlayer);
