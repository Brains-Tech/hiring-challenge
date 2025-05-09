import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SignUp - COODEX",
  description: "signup page",
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main>{children}</main>;
}
