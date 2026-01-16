import { DocPage } from '@/components/doc-page';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default async function IntroductionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  return (
    <DocPage
      title="Introduction to TreeMapper"
      description="TreeMapper is a digital monitoring and management platform developed by Plant-for-the-Planet to support high-quality, transparent, and science-based forest restoration."
      pageId="introduction"
    >
      <p>
        TreeMapper is designed to help restoration projects move beyond simple tree-count reporting and towards data-driven ecosystem monitoring. It enables organizations to document planting activities, monitor tree survival and growth, manage species and interventions, and analyze restoration progress over time, all in a standardized and verifiable way.
      </p>

      <Image
        src="https://pub-261389c3bd084eb3a62686b2f08ce42b.r2.dev/docs/introduction_one.png"
        alt="TreeMapper mobile app and web dashboard overview"
        width={1200}
        height={675}
        className="rounded-lg my-4 w-full h-auto"
        priority
      />

      <p>
        The platform consists of two tightly integrated components:
      </p>

      <ul>
        <li>
          <strong>TreeMapper Mobile App</strong> – built for on-ground data collection, even in remote and offline environments
        </li>
        <li>
          <strong>TreeMapper Web Dashboard</strong> – built for project management, data analysis, and collaboration
        </li>
      </ul>

      <p>
        Together, they provide an end-to-end solution for restoration teams, NGOs, researchers, and funders to plan, monitor, verify, and improve restoration outcomes.
      </p>

      <h2>Purpose and Vision</h2>
      <p>
        TreeMapper was created to address common challenges in restoration projects, such as:
      </p>
      <ul>
        <li>Inconsistent data collection across teams and regions</li>
        <li>Limited visibility into long-term survival and impact</li>
        <li>Difficulty managing species, plots, and interventions at scale</li>
        <li>Lack of transparent and auditable monitoring data</li>
      </ul>
      <p>
        By combining field-level data capture with centralized analytics and management, TreeMapper supports credible restoration aligned with ecological best practices rather than just planting numbers.
      </p>

      <h2>Who TreeMapper Is For</h2>
      <p>TreeMapper is used by:</p>
      <ul>
        <li>Forest and landscape restoration organizations</li>
        <li>Tree planting and monitoring teams</li>
        <li>Conservation projects and research initiatives</li>
        <li>Donors and partners seeking transparent impact reporting</li>
      </ul>
      <p>
        It is especially suited for projects that require long-term monitoring, species-level insights, and clear accountability.
      </p>

      <h2>What's New</h2>
      <p>
        TreeMapper has recently evolved into a more powerful and scalable platform with:
      </p>
      <ul>
        <li>
          A web dashboard offering advanced functionality such as role management, species and intervention management, and analytics
        </li>
        <li>
          Enhanced mobile app features, including structured monitoring plots and improved long-term monitoring workflows
        </li>
      </ul>
      <p>
        These updates make TreeMapper not just a data collection tool, but a comprehensive restoration management system.
      </p>

      <div className="mt-8 pt-8 border-t">
        <Link href={`/${locale}/docs/mobile-setup`}>
          <Button size="lg" className="gap-2">
            Next: Mobile App Setup
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </DocPage>
  );
}
