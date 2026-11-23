import Image from "next/image";
import { ArrowDown, ArrowUp, FileText, Trash2 } from "lucide-react";
import type { MediaType } from "@prisma/client";
import { resolveMediaUrl } from "@/lib/media-url";
import { ConfirmButton } from "@/components/admin/buttons";
import { Card, buttonSmall } from "@/components/admin/ui";
import { deleteMedia, moveMedia } from "./actions";
import UploadForm from "./UploadForm";

interface MediaItem {
  id: string;
  url: string;
  type: MediaType;
  caption: string | null;
}

function MoveButtons({ id, first, last }: { id: string; first: boolean; last: boolean }) {
  return (
    <div className="flex gap-1">
      <form action={moveMedia}>
        <input type="hidden" name="mediaId" value={id} />
        <input type="hidden" name="direction" value="up" />
        <button type="submit" disabled={first} className={buttonSmall} aria-label="Move earlier">
          <ArrowUp className="h-3.5 w-3.5" aria-hidden />
        </button>
      </form>
      <form action={moveMedia}>
        <input type="hidden" name="mediaId" value={id} />
        <input type="hidden" name="direction" value="down" />
        <button type="submit" disabled={last} className={buttonSmall} aria-label="Move later">
          <ArrowDown className="h-3.5 w-3.5" aria-hidden />
        </button>
      </form>
    </div>
  );
}

function DeleteButton({ id }: { id: string }) {
  return (
    <form action={deleteMedia}>
      <input type="hidden" name="mediaId" value={id} />
      <ConfirmButton className={`${buttonSmall} text-red-700`} message="Delete this file permanently?">
        <Trash2 className="h-3.5 w-3.5" aria-hidden /> Delete
      </ConfirmButton>
    </form>
  );
}

export default function MediaManager({ listingId, media }: { listingId: string; media: MediaItem[] }) {
  const images = media.filter((m) => m.type === "IMAGE");
  const documents = media.filter((m) => m.type === "DOCUMENT");

  return (
    <Card title="Photos & documents">
      <UploadForm listingId={listingId} />

      <h3 className="mb-2 mt-6 text-sm font-bold text-slate-700">Photos ({images.length}) — the first photo is the cover</h3>
      {images.length === 0 ? (
        <p className="text-sm text-slate-500">No photos yet.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {images.map((m, i) => (
            <li key={m.id} className="overflow-hidden rounded-lg border border-slate-200">
              <div className="relative aspect-[4/3] bg-slate-100">
                <Image src={resolveMediaUrl(m.url)} alt={m.caption ?? `Photo ${i + 1}`} fill sizes="320px" quality={50} className="object-cover" />
                {i === 0 && <span className="absolute left-2 top-2 rounded bg-brand px-2 py-0.5 text-xs font-bold text-white">Cover</span>}
              </div>
              <div className="flex items-center justify-between gap-2 p-2">
                <span className="truncate text-xs text-slate-600">{m.caption ?? "No caption"}</span>
                <div className="flex shrink-0 gap-1">
                  <MoveButtons id={m.id} first={i === 0} last={i === images.length - 1} />
                  <DeleteButton id={m.id} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <h3 className="mb-2 mt-6 text-sm font-bold text-slate-700">Documents ({documents.length})</h3>
      {documents.length === 0 ? (
        <p className="text-sm text-slate-500">No documents yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
          {documents.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-2 p-2">
              <a href={resolveMediaUrl(m.url)} target="_blank" rel="noopener noreferrer" className="flex min-w-0 items-center gap-2 text-sm font-semibold text-brand hover:underline">
                <FileText className="h-4 w-4 shrink-0" aria-hidden />
                <span className="truncate">{m.caption ?? "Notice document (PDF)"}</span>
              </a>
              <DeleteButton id={m.id} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
