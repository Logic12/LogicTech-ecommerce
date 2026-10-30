import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getSiteSettings } from "@/lib/settings";
import { getPolicy, POLICY_NAV, POLICY_UPDATED } from "@/lib/policies";
import { Reveal } from "@/components/ui/Reveal";
import { WhatsAppLink } from "@/components/ui/WhatsAppLink";
import { BRAND } from "@/lib/brand";

const updated = new Intl.DateTimeFormat("en-GH", { day: "numeric", month: "long", year: "numeric" }).format(
  new Date(POLICY_UPDATED),
);

export async function policyMetadata(slug) {
  const policy = getPolicy(slug, await getSiteSettings());
  return policy ? { title: policy.title, description: policy.lead } : {};
}

export async function PolicyPage({ slug }) {
  const settings = await getSiteSettings();
  const policy = getPolicy(slug, settings);
  if (!policy) notFound();

  return (
    <div className="container page policy">
      <div className="page-head">
        <div>
          <div className="eyebrow">{policy.eyebrow}</div>
          <h1 className="display">
            {policy.title}
            <em>.</em>
          </h1>
          <p className="policy__lead">{policy.lead}</p>
        </div>
      </div>

      <div className="policy__layout">
        <nav className="policy__nav" aria-label="Policies">
          {POLICY_NAV.map((p) => (
            <Link key={p.slug} href={`/${p.slug}`} className={p.slug === slug ? "is-active" : ""} aria-current={p.slug === slug ? "page" : undefined}>
              {p.title}
            </Link>
          ))}
        </nav>

        <article className="policy__body">
          {policy.sections.map((sec, i) => (
            <Reveal as="section" key={sec.heading} className="policy__section" delay={Math.min(i, 3) * 60}>
              <h2>
                <span>{String(i + 1).padStart(2, "0")}</span> {sec.heading}
              </h2>
              {sec.body?.map((t) => (
                <p key={t}>{t}</p>
              ))}
              {sec.list && (
                <ul className="policy__list">
                  {sec.list.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              )}
              {sec.steps && (
                <ol className="policy__steps">
                  {sec.steps.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ol>
              )}
              {sec.table && (
                <div className="policy__table">
                  {sec.table.map(([label, detail, fee]) => (
                    <div key={label}>
                      <strong>{label}</strong>
                      <span>{detail}</span>
                      <em>{fee}</em>
                    </div>
                  ))}
                </div>
              )}
              {(sec.link ? [sec.link] : sec.links || []).length > 0 && (
                <div className="policy__links">
                  {(sec.link ? [sec.link] : sec.links).map((l) => (
                    <Link key={l.href} href={l.href} className="link-arrow">
                      {l.label} <ArrowRight size={15} />
                    </Link>
                  ))}
                </div>
              )}
            </Reveal>
          ))}

          <div className="policy__help">
            <div>
              <strong>Still have a question?</strong>
              <span>We usually reply on WhatsApp.</span>
            </div>
            <WhatsAppLink number={settings.whatsappNumbers[0]} message={`Hi ${BRAND.name}, a question about your ${policy.title.toLowerCase()} policy.`} className="btn btn--dark">
              Chat with us
            </WhatsAppLink>
          </div>
          <p className="policy__updated">Last updated {updated}</p>
        </article>
      </div>
    </div>
  );
}
