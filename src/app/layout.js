import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata = {
  title: "Nimu - Portfolio",
  description: "Freebie 64 - Portfolio (Tailwind CSS) converted to Next.js",
  icons: {
    icon: [
      { url: "https://cdn.pixelcave.com/favicon.svg", type: "image/svg+xml" },
      { url: "https://cdn.pixelcave.com/favicon.png", type: "image/png" },
    ],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} scroll-smooth`}>
      <body className="antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
