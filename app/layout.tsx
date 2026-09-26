import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/store/StoreProvider";

export const metadata: Metadata = {
  title: "ShopMaster - Quản lý Sản phẩm E-Commerce",
  description: "Hệ thống quản lý sản phẩm, tồn kho và danh mục bán hàng đa sàn thương mại điện tử",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
