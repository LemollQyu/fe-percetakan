 "use client";

import { usePathname } from "next/navigation";
import { SearchBar } from "./SearchBar";

/** Hanya tampilkan SearchBar di homepage (/) */
export function SearchBarOnHome() {
  const pathname = usePathname();
  if (pathname !== "/") return null;
  return <SearchBar />;
}

