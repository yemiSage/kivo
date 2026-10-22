import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "Kivo — A home for your good finds",
  description: "Save the links, images and ideas you want to come back to. Keep them together in Kivo, on your phone or in your browser.",
};

export default function WelcomePage() {
  return <LandingPage />;
}
