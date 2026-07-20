import { HeroSection } from "@/components/home/HeroSection";
import { ValueCards } from "@/components/home/ValueCards";
import { HowItWorks } from "@/components/home/HowItWorks";
import { CareerResourcesPreview } from "@/components/home/CareerResourcesPreview";

export default function Home() {
  return (
    <>
      <HeroSection />
      <ValueCards />
      <HowItWorks />
      <CareerResourcesPreview />
    </>
  );
}
