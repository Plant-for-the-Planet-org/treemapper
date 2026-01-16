import Link from 'next/link';
import Image from 'next/image';
import { setRequestLocale } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Video Background */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source
          src="https://pub-261389c3bd084eb3a62686b2f08ce42b.r2.dev/docs/treemapper_home.mp4"
          type="video/mp4"
        />
      </video>

      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Left side gradient - black to transparent */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Main Content */}
        <main className="flex-1 flex items-center justify-start px-8 md:px-16 lg:px-24 pt-16 md:pt-24">
          <div className="text-left text-white space-y-6 max-w-2xl">
            {/* Logos */}
            <div className="flex items-center justify-start gap-4 drop-shadow-lg">
              <Image
                src="https://www-cdn.plant-for-the-planet.org/wp-content/uploads/2024/08/Plant-for-the-Planet-Official-Logo.svg"
                alt="Plant-for-the-Planet"
                width={60}
                height={60}
                className="h-14 w-auto drop-shadow-lg"
                unoptimized
              />
              <div className="w-px h-10 bg-white/40" />
              <Image
                src="https://mailer-cdn.plant-for-the-planet.org/uploads/1768558111.png"
                alt="TreeMapper"
                width={180}
                height={48}
                className="h-12 w-auto drop-shadow-lg"
                unoptimized
              />
            </div>

            {/* Title */}
            <div className="space-y-3 pt-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight drop-shadow-lg [text-shadow:_2px_2px_8px_rgb(0_0_0_/_60%)]">
                TreeMapper
              </h1>
              {/* <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight drop-shadow-lg [text-shadow:_2px_2px_8px_rgb(0_0_0_/_60%)] text-white/90">
                Documentation
              </h2> */}
            </div>

            {/* Description */}
            <p className="text-lg md:text-xl text-white/85 max-w-lg leading-relaxed drop-shadow-md [text-shadow:_1px_1px_4px_rgb(0_0_0_/_50%)]">
              Learn how to map, monitor, and manage tree planting interventions
              with our comprehensive guides and tutorials.
            </p>

            {/* Features List */}
            <div className="flex flex-wrap gap-3 pt-2">
              <span className="px-4 py-2 bg-white/15 backdrop-blur-sm rounded-full text-sm font-medium border border-white/20">
                Mobile App
              </span>
              <span className="px-4 py-2 bg-white/15 backdrop-blur-sm rounded-full text-sm font-medium border border-white/20">
                Web Platform
              </span>
              <span className="px-4 py-2 bg-white/15 backdrop-blur-sm rounded-full text-sm font-medium border border-white/20">
                Offline Support
              </span>
              <span className="px-4 py-2 bg-white/15 backdrop-blur-sm rounded-full text-sm font-medium border border-white/20">
                Data Export
              </span>
            </div>

            {/* Button */}
            <div className="pt-4">
              <Link href={`/${locale}/docs/introduction`}>
                <Button
                  size="lg"
                  className="group gap-3 bg-gradient-to-r from-[#007A49] to-[#00a65a] hover:from-[#006640] hover:to-[#008c4a] text-white px-10 py-7 text-lg font-semibold rounded-full shadow-[0_8px_30px_rgba(0,122,73,0.4)] hover:shadow-[0_12px_40px_rgba(0,122,73,0.6)] transition-all duration-300 hover:scale-105 border border-white/20"
                >
                  View Documentation
                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>

            {/* App Store Buttons */}
            <div className="flex items-center gap-4 pt-2">
              <a
                href="https://apps.apple.com/us/app/treemapper/id1524353784"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-transform duration-300 hover:scale-105"
              >
                <Image
                  src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg"
                  alt="Download on the App Store"
                  width={200}
                  height={60}
                  className="h-14 w-auto drop-shadow-lg"
                  unoptimized
                />
              </a>
              <a
                href="https://play.google.com/store/apps/details?id=org.pftp.treemapper"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-transform duration-300 hover:scale-105"
              >
                <Image
                  src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                  alt="Get it on Google Play"
                  width={200}
                  height={60}
                  className="h-14 w-auto drop-shadow-lg"
                  unoptimized
                />
              </a>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 py-6 px-8 md:px-16 lg:px-24">
          <div className="flex items-center gap-2 drop-shadow-md">
            <span className="text-white/80 text-sm [text-shadow:_1px_1px_4px_rgb(0_0_0_/_50%)]">
              Created by
            </span>
            <a
              href="https://www.plant-for-the-planet.org"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <Image
                src="https://www-cdn.plant-for-the-planet.org/wp-content/uploads/2024/08/Plant-for-the-Planet-Official-Logo.svg"
                alt="Plant-for-the-Planet"
                width={24}
                height={24}
                className="h-5 w-auto drop-shadow-md"
                unoptimized
              />
              <span className="font-medium text-white text-sm [text-shadow:_1px_1px_4px_rgb(0_0_0_/_50%)]">
                Plant-for-the-Planet
              </span>
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
