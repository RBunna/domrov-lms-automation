import { Icon } from "@/ui/components/data-display";
import GuideCard from "@/ui/design-system/primitives/GuideCard";
import SectionWrapper from "@/ui/design-system/primitives/SectionWrapper";
import Timeline from "@/ui/design-system/primitives/Timeline";
import { GRADING_STEPS } from "@/config/documentation";

/**
 * TeacherGuide - Documentation section for teacher users.
 * Displays grading workflow with timeline visualization.
 */
export default function TeacherGuide() {
  return (
    <SectionWrapper>
      <h2 className="text-3xl font-black text-primary mb-4 flex items-center gap-2">
        <Icon name="assignment_ind" size="3xl" />
        Teacher Guide
      </h2>
      <p className="text-slate-700 mb-6 leading-relaxed">
        Tools for faster, more accurate, and transparent grading.
      </p>

      <GuideCard>
        <h3 className="font-bold text-primary mb-4">Grading Workflow</h3>
        <Timeline steps={GRADING_STEPS} />
      </GuideCard>
    </SectionWrapper>
  );
}
