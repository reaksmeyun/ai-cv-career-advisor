import { HeroSection } from "@/components/home/HeroSection";
import { ValueCards } from "@/components/home/ValueCards";
import { HowItWorks } from "@/components/home/HowItWorks";
import { ResponsibleAiSection } from "@/components/home/ResponsibleAiSection";
import { CareerResourcesPreview } from "@/components/home/CareerResourcesPreview";
import { AboutSection } from "@/components/home/AboutSection";

export default function Home() {
  return (
    <>
      <HeroSection />
      <ValueCards />
      <HowItWorks />
      <ResponsibleAiSection />
      <CareerResourcesPreview />
      <AboutSection />
    </>
  );
}
