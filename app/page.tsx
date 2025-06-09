import { HeroGeometric } from "@/components/ui/shape-landing-hero";
import DatabaseWithRestApi from "@/components/ui/database-with-rest-api";
import SectionWithMockup from "@/components/blocks/section-with-mockup";
import { Features } from "@/components/blocks/features-8";
import { TestimonialsSection } from "@/components/blocks/testimonials-with-marquee";
import { testimonials } from "@/lib/constants";

export default function Home() {
  return (
    <div className="bg-[#030303]">
      <HeroGeometric
        badge="AI Powered"
        title1="Transform Your "
        title2="DB Experience"
      />
      <div className="p-4  w-full flex flex-row justify-center  ">
        <DatabaseWithRestApi />
      </div>
      <SectionWithMockup
        title="Transform Your Database Experience with AI"
        description="Interact with your databases using natural language. Get instant insights, generate SQL queries, and manage your data with AI-powered assistance. No more complex SQL syntax to remember."
        primaryImageSrc="/images/database-interface.png"
        secondaryImageSrc="/images/ai-chat.png"
      />
     <Features />
     <TestimonialsSection
      title="Trusted by developers worldwide"
      description="Join thousands of developers who are already building the future with our AI platform"
      testimonials={testimonials}
    />
    </div>
  );
}
