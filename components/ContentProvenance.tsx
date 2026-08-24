import {
  Bot,
  CheckCircle2,
  ExternalLink,
  FileCheck2,
  History,
  MessageSquare,
  User,
} from "lucide-react";
import Link from "@/components/InternalLink";
import type { ContentProvenance as ContentProvenanceData } from "@/lib/content-provenance";

interface ContentProvenanceProps {
  provenance: ContentProvenanceData;
}

const evidenceLinkClass =
  "group block rounded-2xl border border-gray-100 bg-white p-4 transition-colors hover:border-purple-200";

export default function ContentProvenance({ provenance }: ContentProvenanceProps) {
  return (
    <section className="mb-8 rounded-[2rem] border border-gray-100 bg-gray-50/70 p-6 md:p-8" aria-labelledby="content-provenance-heading">
      <div className="mb-6 flex items-center gap-2">
        <FileCheck2 className="text-accent-purple" size={22} />
        <h2 id="content-provenance-heading" className="text-xl font-bold text-primary">
          制作・検証情報
        </h2>
      </div>

      <dl className="grid gap-3 text-sm md:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <dt className="mb-2 flex items-center gap-2 font-bold text-primary">
            <User size={16} className="text-accent-blue" />
            執筆・構成
          </dt>
          <dd className="leading-relaxed text-muted">{provenance.writtenBy}</dd>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <dt className="mb-2 flex items-center gap-2 font-bold text-primary">
            <CheckCircle2 size={16} className="text-accent-green" />
            検算・内容確認
          </dt>
          <dd className="leading-relaxed text-muted">{provenance.checkedBy}</dd>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <dt className="mb-2 flex items-center gap-2 font-bold text-primary">
            <FileCheck2 size={16} className="text-accent-pink" />
            最終公開確認
          </dt>
          <dd className="leading-relaxed text-muted">{provenance.finalReviewedBy}</dd>
        </div>
      </dl>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-purple-100 bg-purple-50/50 p-5">
          <h3 className="mb-2 flex items-center gap-2 font-bold text-primary">
            <Bot size={18} className="text-accent-purple" />
            AIを使用した工程
          </h3>
          <p className="text-sm leading-relaxed text-muted">{provenance.aiUsage}</p>
        </div>
        <div className="rounded-2xl border border-green-100 bg-green-50/50 p-5">
          <h3 className="mb-2 flex items-center gap-2 font-bold text-primary">
            <CheckCircle2 size={18} className="text-accent-green" />
            人が確認した工程
          </h3>
          <p className="text-sm leading-relaxed text-muted">{provenance.humanReview}</p>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="mb-3 font-bold text-primary">コード・データ・検証記録</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {provenance.evidenceLinks.map((evidence) =>
            evidence.url.startsWith("/") ? (
              <Link key={evidence.url} href={evidence.url} className={evidenceLinkClass}>
                <span className="inline-flex items-center gap-1 font-bold text-accent-purple group-hover:underline">
                  {evidence.title}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-muted">
                  {evidence.description}
                </span>
              </Link>
            ) : (
              <a
                key={evidence.url}
                href={evidence.url}
                target="_blank"
                rel="noopener noreferrer"
                className={evidenceLinkClass}
              >
                <span className="inline-flex items-center gap-1 font-bold text-accent-purple group-hover:underline">
                  {evidence.title}
                  <ExternalLink size={13} />
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-muted">
                  {evidence.description}
                </span>
              </a>
            ),
          )}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="mb-3 flex items-center gap-2 font-bold text-primary">
          <History size={18} className="text-accent-yellow" />
          更新・訂正履歴
        </h3>
        <ul className="space-y-2">
          {provenance.revisions.map((revision) => (
            <li
              key={`${revision.date}-${revision.kind}-${revision.summary}`}
              className="flex flex-col gap-1 rounded-2xl border border-gray-100 bg-white p-4 text-sm sm:flex-row sm:items-start sm:gap-3"
            >
              <time dateTime={revision.date} className="shrink-0 font-mono text-xs text-muted">
                {revision.date}
              </time>
              <span className="w-fit shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-primary">
                {revision.kind}
              </span>
              <span className="leading-relaxed text-muted">{revision.summary}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 flex flex-col gap-3 border-t border-gray-200 pt-5 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>内容の誤りや再検証のご連絡は、お問い合わせページから受け付けています。</p>
        <Link
          href="/contact"
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-primary transition-colors hover:bg-gray-50"
        >
          <MessageSquare size={14} />
          誤りを報告する
        </Link>
      </div>
    </section>
  );
}
