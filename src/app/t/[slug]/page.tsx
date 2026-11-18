import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { featuredDemo, featuredShowcase } from "@/lib/axiom-landing/featured-demos";
import { showcaseSrc } from "@/lib/axiom-landing/showcase";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const demo = featuredDemo(slug);
  if (!demo) return {};
  return { title: `${demo.name} · Axiom`, description: demo.blurb };
}

export default async function FeaturedTenantPage({ params }: PageProps) {
  const { slug } = await params;
  const demo = featuredDemo(slug);
  if (!demo) notFound();

  if (demo.href) {
    redirect(`${demo.href}?showcase=1&template=${demo.slug}`);
  }

  const build = featuredShowcase(demo);
  if (!build) notFound();

  return (
    <iframe
      title={demo.name}
      src={showcaseSrc(build, build.entry)}
      className="block h-dvh w-full border-0 bg-black"
    />
  );
}
