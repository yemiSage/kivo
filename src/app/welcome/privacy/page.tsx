import type { Metadata } from "next";
import { LegalPage } from "@/components/landing/LegalPage";
import { getPolicyOperator, privacySections } from "@/components/landing/policies";

export const metadata: Metadata = {
  title: "Privacy Policy — Kivo",
  description: "How Kivo handles your account, saved content, sharing choices, and privacy rights.",
};

export default function PrivacyPage() {
  return <LegalPage title="Privacy Policy" summary="Your finds are personal. Here’s what we collect, why we need it, and the choices you have over your information." sections={privacySections(getPolicyOperator())} />;
}
