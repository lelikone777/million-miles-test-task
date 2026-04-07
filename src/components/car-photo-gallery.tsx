"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type PhotoItem = {
  id: string;
  url: string;
};

type CarPhotoGalleryProps = {
  photos: PhotoItem[];
  alt: string;
};

export function CarPhotoGallery({ photos, alt }: CarPhotoGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const isOpen = activeIndex !== null;
  const activePhoto = activeIndex !== null ? photos[activeIndex] : null;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveIndex(null);
        return;
      }

      if (photos.length <= 1 || activeIndex === null) {
        return;
      }

      if (event.key === "ArrowRight") {
        setActiveIndex((prev) => {
          if (prev === null) return prev;
          return (prev + 1) % photos.length;
        });
      }

      if (event.key === "ArrowLeft") {
        setActiveIndex((prev) => {
          if (prev === null) return prev;
          return (prev - 1 + photos.length) % photos.length;
        });
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, activeIndex, photos.length]);

  if (photos.length === 0) {
    return <p className="muted">Фотографии отсутствуют.</p>;
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            className="group h-[190px] overflow-hidden rounded-2xl bg-[var(--panel-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
            aria-label={`Открыть фото ${index + 1}`}
          >
            <div className="relative h-full w-full">
              <Image
                src={photo.url}
                alt={alt}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-200 group-hover:scale-[1.03]"
              />
            </div>
          </button>
        ))}
      </div>

      {isOpen && activePhoto ? (
        <div
          className="fixed inset-0 z-50 bg-black/75 p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Просмотр фото автомобиля"
          onClick={() => setActiveIndex(null)}
        >
          <div
            className="mx-auto grid h-full w-full max-w-6xl gap-3"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-white/85">
                Фото {activeIndex + 1} из {photos.length}
              </p>
              <button
                type="button"
                className="btn btn-secondary bg-white/90"
                onClick={() => setActiveIndex(null)}
              >
                Закрыть
              </button>
            </div>

            <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl bg-black">
              <div className="absolute inset-0">
                <Image
                  src={activePhoto.url}
                  alt={alt}
                  fill
                  sizes="100vw"
                  className="object-contain"
                  priority
                />
              </div>

              {photos.length > 1 ? (
                <>
                  <button
                    type="button"
                    className="btn btn-secondary absolute left-2 top-1/2 -translate-y-1/2 bg-white/90"
                    onClick={() =>
                      setActiveIndex((prev) => {
                        if (prev === null) return prev;
                        return (prev - 1 + photos.length) % photos.length;
                      })
                    }
                    aria-label="Предыдущее фото"
                  >
                    Назад
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary absolute right-2 top-1/2 -translate-y-1/2 bg-white/90"
                    onClick={() =>
                      setActiveIndex((prev) => {
                        if (prev === null) return prev;
                        return (prev + 1) % photos.length;
                      })
                    }
                    aria-label="Следующее фото"
                  >
                    Вперед
                  </button>
                </>
              ) : null}
            </div>

            {photos.length > 1 ? (
              <div className="grid grid-cols-4 gap-2 overflow-y-auto rounded-xl bg-white/10 p-2 sm:grid-cols-6 lg:grid-cols-8">
                {photos.map((photo, index) => {
                  const isActive = index === activeIndex;
                  return (
                    <button
                      key={`thumb-${photo.id}`}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      className={`relative h-16 overflow-hidden rounded-lg border ${
                        isActive ? "border-white" : "border-white/30"
                      }`}
                      aria-label={`Открыть фото ${index + 1}`}
                    >
                      <Image
                        src={photo.url}
                        alt={`${alt} ${index + 1}`}
                        fill
                        sizes="120px"
                        className="object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
