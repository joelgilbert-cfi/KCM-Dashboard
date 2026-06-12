import { Navbar } from "@/components/navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="flex-1 mx-auto w-full max-w-[1440px] px-4 sm:px-6 py-6">
        {children}
      </main>
    </>
  );
}
