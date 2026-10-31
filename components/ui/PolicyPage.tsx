import { GlassCard } from "@/components/ui/GlassCard";
import { SectionHeading } from "@/components/ui/SectionHeading";

export interface PolicySection {
  heading: string;
  body: string[];
}

interface PolicyPageProps {
  eyebrow: string;
  title: string;
  intro: string;
  sections: PolicySection[];
  /** Shown as a small note at the end; used to flag owner approval. */
  note?: string;
}

/** Shared layout for the plain-text policy pages (delivery, privacy, returns, terms). */
export function PolicyPage({ eyebrow, title, intro, sections, note }: PolicyPageProps) {
  return (
    <section className="px-4 pb-20">
      <div className="mx-auto w-full max-w-3xl">
        <SectionHeading eyebrow={eyebrow} title={title} subtext={intro} align="left" />

        <div className="mt-10 space-y-5">
          {sections.map((section) => (
            <GlassCard key={section.heading} padding="lg">
              <h2 className="text-lg font-semibold text-ink">{section.heading}</h2>
              <div className="mt-3 space-y-3">
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="text-sm leading-relaxed text-muted">
                    {paragraph}
                  </p>
                ))}
              </div>
            </GlassCard>
          ))}
        </div>

        {note ? <p className="mt-8 text-xs leading-relaxed text-muted">{note}</p> : null}
      </div>
    </section>
  );
}
