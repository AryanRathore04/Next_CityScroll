import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import ClientInit from "@/components/ClientInit";

export const metadata: Metadata = {
  title: {
    default: "BeautyBook",
    template: "%s | BeautyBook",
  },
  description: "Discover and book premium wellness, beauty, and spa services",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ErrorBoundary>
          <ClientInit />
          <Providers>{children}</Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
