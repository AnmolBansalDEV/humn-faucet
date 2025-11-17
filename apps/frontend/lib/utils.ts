import initMishtiwasm from "@holonym-foundation/mishtiwasm";
import { clsx, type ClassValue } from "clsx";
import { env } from "next-runtime-env";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
let humanNetworkInitialized = false;
export const initializeHumanNetwork = async () => {
  if (humanNetworkInitialized) return;

  await initMishtiwasm();

  humanNetworkInitialized = true;
};

// Converts an ArrayBuffer (from crypto.subtle) into a hex string
export async function hashToHex(buffer: ArrayBuffer): Promise<string> {
  const hashArray = Array.from(new Uint8Array(buffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return '0x' + hashHex;
}

export const API_BASE_URL = env("NEXT_PUBLIC_API_BASE_URL");
export const SIGNER_URL = env("NEXT_PUBLIC_SIGNER_URL");
