'use client';

import { useTranslations } from 'next-intl';

export function Preview() {
  const t = useTranslations('landing');

  const sections = [t('preview.section1'), t('preview.section2'), t('preview.section3')];
  const sidebarActions = [
    `❓ ${t('preview.actionQuiz')}`,
    `🎧 ${t('preview.actionPodcast')}`,
    `💬 ${t('preview.actionTutor')}`,
  ];
  const chips = [
    `🎧 ${t('preview.chipListen')}`,
    `❓ ${t('preview.chipQuiz')}`,
    `💬 ${t('preview.chipAsk')}`,
  ];

  return (
    <section id="preview" className="border-t border-border/70 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            {t('nav.preview')}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            {t('preview.title')}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">{t('preview.subtitle')}</p>
        </div>
        <div className="relative">
          <div className="absolute -inset-x-8 -top-8 bottom-0 -z-10 rounded-[2.5rem] bg-gradient-brand-soft blur-3xl" />
          <div className="overflow-hidden rounded-[1.75rem] border border-border/70 bg-background shadow-elevated">
            <div className="flex items-center gap-2 border-b border-border/70 bg-card px-5 py-4">
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]" />
              <span className="ml-3 hidden rounded-md bg-muted px-3 py-1 text-xs text-muted-foreground sm:block">
                talim.ai/content
              </span>
            </div>
            <div className="grid min-h-[400px] md:grid-cols-[240px_1fr]">
              <div className="hidden border-r border-border/70 bg-card p-4 md:block">
                <div className="mb-1 flex items-center gap-2 rounded-xl bg-accent px-3 py-2.5 text-sm font-medium text-accent-foreground">
                  📘 {t('preview.navContent')}
                </div>
                {sections.map((s) => (
                  <div
                    key={s}
                    className="rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary"
                  >
                    📄 {s}
                  </div>
                ))}
                <div className="mt-4 border-t border-border/70 pt-3">
                  {sidebarActions.map((s) => (
                    <div
                      key={s}
                      className="rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary"
                    >
                      {s}
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  {t('preview.chapterLabel')}
                </p>
                <h3 className="mt-2 text-2xl font-bold">{t('preview.contentTitle')}</h3>
                <p className="mt-5 text-[15px] leading-relaxed">
                  {t('preview.paragraph1Lead')}
                  <span className="marker-highlight font-medium">
                    {t('preview.paragraph1Highlight')}
                  </span>
                  {t('preview.paragraph1Tail')}
                </p>
                <p className="mt-4 text-[15px] leading-relaxed">
                  {t('preview.paragraph2Lead')}
                  <span className="marker-highlight font-medium">
                    {t('preview.paragraph2Highlight')}
                  </span>
                  {t('preview.paragraph2Tail')}
                </p>
                <div className="mt-6 flex flex-wrap gap-2.5">
                  {chips.map((label) => (
                    <span
                      key={label}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium shadow-soft transition-colors hover:border-primary/40 hover:bg-secondary"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
