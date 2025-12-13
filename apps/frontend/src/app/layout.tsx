import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { ThemeProvider } from "@/context/ThemeContext";
import { MonitoringProvider } from "@/components/MonitoringProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Notes App",
  description: "A full-stack notes application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <MonitoringProvider>
          <ThemeProvider>
            <Providers>{children}</Providers>
          </ThemeProvider>
        </MonitoringProvider>
      </body>
    </html>
  );
}
