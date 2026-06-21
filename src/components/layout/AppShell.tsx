import type {ReactNode} from "react";
import {SiteHeader} from "./SiteHeader";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({children}: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[#06110f] text-white">
      <SiteHeader />

      <main className="flex-1">{children}</main>

      <footer className="border-t border-white/5 px-4 py-6 text-center text-sm text-gray-500">
        Card Arena • Tysiąc online • gra ze znajomymi i turnieje pucharowe
      </footer>
    </div>
  );
}
