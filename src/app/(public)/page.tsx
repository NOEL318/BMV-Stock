import { Disclaimer } from "@/components/landing/Disclaimer";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LandingFooter } from "@/components/landing/LandingFooter";

/**
 * Landing pública — Hero + features + cómo funciona + disclaimer + footer.
 */
export default function LandingPage() {
  return (
    <>
      <Hero />
      <FeatureGrid />
      <HowItWorks />
      <Disclaimer />
      <LandingFooter />
    </>
  );
}
