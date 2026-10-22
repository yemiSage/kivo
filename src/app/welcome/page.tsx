import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";
import { JsonLd } from "@/components/JsonLd";
import { applicationSchema, publicMetadata, websiteSchema } from "@/lib/discoverability";

export const metadata: Metadata = publicMetadata({ title: "A home for your good finds", description: "Save the links, images and ideas you want to come back to. Keep them together in Kivo, on your phone or in your browser.", path: "/welcome" });

export default function WelcomePage() {
  return <><JsonLd data={[websiteSchema(), applicationSchema()]} /><LandingPage /></>;
}
