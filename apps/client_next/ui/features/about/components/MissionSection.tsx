import { SectionHeader } from "@/ui/components/data-display";
import SectionWrapper from "@/ui/design-system/primitives/SectionWrapper";

/**
 * MissionSection - Displays the organization's mission statement.
 * Addresses the digital divide in Cambodian education.
 */
export default function MissionSection() {
  return (
    <SectionWrapper>
      <SectionHeader
        label="Our Mission"
        title="Addressing the Digital Divide in Cambodian Education."
        subtitle={
          'We built Domrov to solve the "Coding Gap"—where teachers are overwhelmed by manual grading and students lack timely feedback.'
        }
        centered
      />
    </SectionWrapper>
  );
}
