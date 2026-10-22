import type { Metadata } from "next";
import { LegalPage } from "@/components/landing/LegalPage";
import { getPolicyOperator, termsSections } from "@/components/landing/policies";
import { publicMetadata } from "@/lib/discoverability";

export const metadata: Metadata = publicMetadata({ title: "Terms of Use", description: "The terms for using Kivo, managing your account, saving content, and collaborating in shared vaults.", path: "/welcome/terms" });

export default function TermsPage() {
  return <LegalPage title="Terms of Use" summary="A few clear ground rules for your corner of the internet. What you can expect from Kivo, and what we ask of you." sections={termsSections(getPolicyOperator())} />;
}
