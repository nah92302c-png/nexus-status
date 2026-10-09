import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "NEXUS STATUS",
    template: "%s · NEXUS STATUS",
  },
  description:
    "Live status overview for NEXUS services: MW3, BO6, BO7, MW1, WARDOGS, ARC Raiders, Spoofer and MW4.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-[#070b10] text-slate-200 antialiased">
        {children}
      </body>
    </html>
  );
}