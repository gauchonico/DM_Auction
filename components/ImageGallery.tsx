import Image from "next/image";
import { ImageOff } from "lucide-react";
import { resolveMediaUrl } from "@/lib/media-url";

interface GalleryImage {
  id: string;
  url: string;
  caption: string | null;
}

/**
 * Swipeable, CSS scroll-snap gallery. No client JavaScript: thumbnails are
 * anchor links, and only the first image is loaded eagerly.
 */
export default function ImageGallery({ images, title }: { images: GalleryImage[]; title: string }) {
  if (images.length === 0) {
    return (
      <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-xl bg-slate-100 text-slate-500">
        <ImageOff className="h-10 w-10" aria-hidden />
        <p className="text-sm">No photos supplied — refer to the printed notice.</p>
      </div>
    );
  }

  return (
    <div>
      <div
        className="flex snap-x snap-mandatory overflow-x-auto rounded-xl bg-slate-900 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label={`${title} photos`}
        role="region"
        tabIndex={0}
      >
        {images.map((img, i) => (
          <figure key={img.id} id={`photo-${i + 1}`} className="relative aspect-[4/3] w-full shrink-0 snap-center">
            <Image
              src={resolveMediaUrl(img.url)}
              alt={img.caption ?? `${title} — photo ${i + 1}`}
              fill
              sizes="(max-width: 1024px) 100vw, 720px"
              quality={70}
              priority={i === 0}
              className="object-cover"
            />
            <figcaption className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-0.5 text-xs font-semibold text-white">
              {i + 1} / {images.length}
              {img.caption ? ` · ${img.caption}` : ""}
            </figcaption>
          </figure>
        ))}
      </div>

      {images.length > 1 && (
        <ul className="mt-2 flex gap-2 overflow-x-auto pb-1" aria-label="Photo thumbnails">
          {images.map((img, i) => (
            <li key={img.id} className="shrink-0">
              <a
                href={`#photo-${i + 1}`}
                className="relative block h-14 w-20 overflow-hidden rounded-xl ring-1 ring-slate-200 hover:ring-2 hover:ring-brand"
                aria-label={`Show photo ${i + 1}`}
              >
                <Image src={resolveMediaUrl(img.url)} alt="" fill sizes="80px" quality={40} className="object-cover" />
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
