import type { Metadata } from "next";
import { GlassCard } from "@/components/ui/GlassCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { TrackForm } from "@/components/forms/TrackForm";
import { content } from "@/content/site";

export const metadata: Metadata = {
  title: content.track.title,
  description: content.track.text,
};

interface TrackPageProps {
  searchParams: Promise<{ order?: string }>;
}

export default async function TrackPage({ searchParams }: TrackPageProps) {
  const { order } = await searchParams;
  const initialOrderNumber =
    order && /^WEB-[0-9]{12}-[0-9A-F]{6}$/i.test(order) ? order.toUpperCase() : "";

  return (
    <main className="px-4 pb-20 pt-4">
      <div className="mx-auto w-full max-w-lg">
        <SectionHeading
          eyebrow="Order status"
          title={content.track.title}
          subtext={content.track.text}
        />
        <GlassCard padding="lg" className="mt-10">
          <TrackForm initialOrderNumber={initialOrderNumber} />
        </GlassCard>
      </div>
    </main>
  );
}
