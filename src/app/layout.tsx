import type { Metadata, Viewport } from "next";
import { AppHeader } from "@/components/app-header";
import { AppNav } from "@/components/app-nav";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import "./globals.css";

export const metadata: Metadata = {
  title: "Segundo Cérebro",
  description: "Tarefas, inbox, campanhas e criativos num só sítio.",
  appleWebApp: { capable: true, title: "Segundo Cérebro", statusBarStyle: "default" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#18181b" },
  ],
};

// Applies the saved theme (or the system one) before first paint, so there is no flash.
const themeScript = `(function(){try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";if(t==="dark")document.documentElement.classList.add("dark")}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-PT" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh">
        <AppHeader />
        {/* lg:pl-56 leaves room for the sidebar (w-56 in app-nav.tsx). */}
        <div className="lg:pl-56">
          <main className="mx-auto w-full max-w-xl px-4 pt-2 pb-[calc(6rem+env(safe-area-inset-bottom))] lg:max-w-6xl lg:px-8 lg:pt-8 lg:pb-12">
            {children}
          </main>
        </div>
        <AppNav />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
