import { Plus, Trash2, X } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ConfirmButton, SubmitButton } from "@/components/admin/buttons";
import { Card, Notice, PageHeader, buttonPrimary, buttonSmall, inputClass } from "@/components/admin/ui";
import {
  createCategory,
  createSubType,
  createTag,
  deleteCategory,
  deleteSubType,
  deleteTag,
  renameCategory,
} from "./actions";

export const metadata = { title: "Categories & tags" };

export default async function TaxonomyPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const staff = await requireStaff();
  const params = await searchParams;
  const isAdmin = staff.role === "ADMIN";

  const [categories, tags] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { listings: true } },
        subTypes: { orderBy: { name: "asc" }, include: { _count: { select: { listings: true } } } },
      },
    }),
    prisma.tag.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { listings: true } } } }),
  ]);

  return (
    <>
      <PageHeader
        title="Categories & tags"
        description={isAdmin ? "Organise how buyers browse and filter auctions." : "View only — ask an admin to make changes."}
      />
      <Notice code={params.error ?? params.notice} />

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          {categories.map((cat) => (
            <Card key={cat.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                {isAdmin ? (
                  <form action={renameCategory} className="flex flex-1 flex-wrap gap-2">
                    <input type="hidden" name="id" value={cat.id} />
                    <label htmlFor={`cat-${cat.id}`} className="sr-only">Category name</label>
                    <input id={`cat-${cat.id}`} name="name" defaultValue={cat.name} required maxLength={80} className={`${inputClass} max-w-xs font-bold`} />
                    <SubmitButton className={buttonSmall}>Rename</SubmitButton>
                  </form>
                ) : (
                  <h2 className="text-base font-bold text-slate-900">{cat.name}</h2>
                )}
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>/{cat.slug} · {cat._count.listings} listing{cat._count.listings === 1 ? "" : "s"}</span>
                  {isAdmin && cat._count.listings === 0 && (
                    <form action={deleteCategory}>
                      <input type="hidden" name="id" value={cat.id} />
                      <ConfirmButton className={`${buttonSmall} text-red-700`} message={`Delete the ${cat.name} category and its sub-types?`}>
                        <Trash2 className="h-3.5 w-3.5" aria-hidden /> Delete
                      </ConfirmButton>
                    </form>
                  )}
                </div>
              </div>

              <ul className="mt-3 flex flex-wrap gap-2" aria-label={`${cat.name} sub-types`}>
                {cat.subTypes.map((s) => (
                  <li key={s.id} className="inline-flex min-h-9 items-center gap-1 rounded-full bg-slate-100 pl-3 pr-1 text-sm text-slate-800">
                    {s.name} <span className="text-xs text-slate-500">({s._count.listings})</span>
                    {isAdmin && (
                      <form action={deleteSubType}>
                        <input type="hidden" name="id" value={s.id} />
                        <ConfirmButton
                          className="grid h-7 w-7 place-items-center rounded-full text-slate-500 hover:bg-slate-200 hover:text-red-700"
                          message={`Delete sub-type "${s.name}"?${s._count.listings ? ` ${s._count.listings} listing(s) will keep their category but lose this sub-type.` : ""}`}
                        >
                          <X className="h-3.5 w-3.5" aria-label={`Delete ${s.name}`} />
                        </ConfirmButton>
                      </form>
                    )}
                  </li>
                ))}
                {cat.subTypes.length === 0 && <li className="text-sm text-slate-500">No sub-types.</li>}
              </ul>

              {isAdmin && (
                <form action={createSubType} className="mt-3 flex gap-2">
                  <input type="hidden" name="categoryId" value={cat.id} />
                  <label htmlFor={`sub-${cat.id}`} className="sr-only">New sub-type for {cat.name}</label>
                  <input id={`sub-${cat.id}`} name="name" required maxLength={80} placeholder="Add sub-type…" className={`${inputClass} max-w-xs`} />
                  <SubmitButton className={buttonSmall}><Plus className="h-3.5 w-3.5" aria-hidden /> Add</SubmitButton>
                </form>
              )}
            </Card>
          ))}

          {isAdmin && (
            <Card title="New category">
              <form action={createCategory} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                <label htmlFor="new-cat-name" className="sr-only">Name</label>
                <input id="new-cat-name" name="name" required maxLength={80} placeholder="Name, e.g. Land" className={inputClass} />
                <label htmlFor="new-cat-slug" className="sr-only">URL slug</label>
                <input id="new-cat-slug" name="slug" maxLength={60} placeholder="URL slug (optional)" className={inputClass} />
                <SubmitButton className={buttonPrimary}><Plus className="h-4 w-4" aria-hidden /> Create</SubmitButton>
              </form>
            </Card>
          )}
        </div>

        <Card title="Tags">
          <ul className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <li key={t.id} className="inline-flex min-h-9 items-center gap-1 rounded-full bg-slate-100 pl-3 pr-1 text-sm text-slate-800">
                {t.name} <span className="text-xs text-slate-500">({t._count.listings})</span>
                {isAdmin && (
                  <form action={deleteTag}>
                    <input type="hidden" name="id" value={t.id} />
                    <ConfirmButton
                      className="grid h-7 w-7 place-items-center rounded-full text-slate-500 hover:bg-slate-200 hover:text-red-700"
                      message={`Delete tag "${t.name}"? It will be removed from ${t._count.listings} listing(s).`}
                    >
                      <X className="h-3.5 w-3.5" aria-label={`Delete ${t.name}`} />
                    </ConfirmButton>
                  </form>
                )}
              </li>
            ))}
            {tags.length === 0 && <li className="text-sm text-slate-500">No tags yet.</li>}
          </ul>
          {isAdmin && (
            <form action={createTag} className="mt-4 flex gap-2">
              <label htmlFor="new-tag" className="sr-only">New tag</label>
              <input id="new-tag" name="name" required maxLength={60} placeholder="Add tag…" className={inputClass} />
              <SubmitButton className={buttonSmall}><Plus className="h-3.5 w-3.5" aria-hidden /> Add</SubmitButton>
            </form>
          )}
        </Card>
      </div>
    </>
  );
}
