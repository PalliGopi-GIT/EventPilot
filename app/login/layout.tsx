import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log In — EventPilot",
  description: "Sign in to EventPilot to continue monitoring your signals and deployed forms.",
};

export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
