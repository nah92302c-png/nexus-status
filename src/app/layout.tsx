import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "STATUS",
    template: "%s · STATUS",
  },
  description:
    "Live status overview for MW3, BO6, BO7, MW1, WARDOGS, ARC Raiders, Spoofer and MW4.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-app-bg text-app-text antialiased">
        {children}
      </body>
    </html>
  );
}
