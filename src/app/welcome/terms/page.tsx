import type { Metadata } from "next";
import { LegalPage } from "@/components/landing/LegalPage";
import { getPolicyOperator, termsSections } from "@/components/landing/policies";

export const metadata: Metadata = {
  title: "Terms of Use — Kivo",
  description: "The terms for using Kivo, managing your account, saving content, and collaborating in shared vaults.",
};

export default function TermsPage() {
  return <LegalPage title="Terms of Use" summary="A few clear ground rules for your corner of the internet. What you can expect from Kivo, and what we ask of you." sections={termsSections(getPolicyOperator())} />;
}
