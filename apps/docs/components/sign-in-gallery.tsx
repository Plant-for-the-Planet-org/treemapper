'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SignInGalleryProps {
  readonly images: ReadonlyArray<{
    readonly src: string;
    readonly alt: string;
    readonly title: string;
  }>;
}

export function SignInGallery({ images }: SignInGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="my-6">
      {/* Desktop: Horizontal Layout */}
      <div className="hidden md:flex flex-row gap-4 items-start justify-center">
        {images.map((image) => (
          <div
            key={image.src}
            className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted p-4 sm:p-8 text-center flex-1 max-w-[391px]"
          >
            <div className="relative w-full max-w-[391px]">
              <Image
                src={image.src}
                alt={image.alt}
                width={391}
                height={786}
                className="rounded-lg w-full h-auto"
                sizes="(max-width: 768px) 100vw, 391px"
              />
            </div>
            <h3 className="font-semibold text-lg mb-2 mt-4">{image.title}</h3>
          </div>
        ))}
      </div>

      {/* Mobile: Slider Layout */}
      <div className="md:hidden">
        <div className="relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted p-4 sm:p-8 text-center">
          <div className="relative w-full max-w-[391px] overflow-hidden">
            <div
              className="flex transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {images.map((image) => (
                <div key={image.src} className="min-w-full flex-shrink-0">
                  <div className="relative w-full max-w-[391px] mx-auto">
                    <Image
                      src={image.src}
                      alt={image.alt}
                      width={391}
                      height={786}
                      className="rounded-lg w-full h-auto"
                      sizes="(max-width: 768px) 100vw, 391px"
                    />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 mt-4">{image.title}</h3>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background border border-border rounded-full p-2 shadow-lg transition-colors"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background border border-border rounded-full p-2 shadow-lg transition-colors"
                aria-label="Next image"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Dots Indicator */}
          {images.length > 1 && (
            <div className="flex gap-2 mt-4">
              {images.map((image, index) => (
                <button
                  key={image.src}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentIndex
                      ? 'bg-primary'
                      : 'bg-muted-foreground/30'
                  }`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
