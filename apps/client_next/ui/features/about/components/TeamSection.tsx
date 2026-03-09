import { SectionHeader } from "@/ui/components/data-display";
import TeamCard from "@/ui/features/about/components/TeamCard";
import SectionWrapper from "@/ui/design-system/primitives/SectionWrapper";
import { TEAM_MEMBERS } from "@/config/about";

/**
 * TeamSection - Displays the team members grid.
 * Uses TeamCard for individual member cards.
 */
export default function TeamSection() {
  return (
    <SectionWrapper>
      <SectionHeader title="The Team" centered className="mb-12" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
        {TEAM_MEMBERS.map((member) => (
          <TeamCard key={member.id} member={member} />
        ))}
      </div>
    </SectionWrapper>
  );
}
