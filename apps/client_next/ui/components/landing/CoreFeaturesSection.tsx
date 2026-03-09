import { SectionHeader } from "@/ui/components/data-display";
import FeatureCard from "@/ui/design-system/primitives/FeatureCard";
import SectionWrapper from "@/ui/design-system/primitives/SectionWrapper";
import { CORE_FEATURES } from "@/config/landing";

/**
 * CoreFeaturesSection - Displays the core platform features in a grid.
 * Uses FeatureCard for each feature item.
 */
export default function CoreFeaturesSection() {
  return (
    <SectionWrapper>
      <SectionHeader
        title="Core Features"
        subtitle="Discover the powerful tools that make Domrov the ultimate LMS for programming education."
        className="mb-12"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {CORE_FEATURES.map((item) => (
          <FeatureCard key={item.id} item={item} />
        ))}
      </div>
    </SectionWrapper>
  );
}
