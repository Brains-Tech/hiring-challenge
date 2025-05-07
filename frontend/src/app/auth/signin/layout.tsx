import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Teddy - Signin",
  description: "signin page",
};

export default function SigninLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main>{children}</main>;
}
