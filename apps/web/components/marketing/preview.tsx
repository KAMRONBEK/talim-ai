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
    <section id="preview" className="border-t px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('preview.title')}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">{t('preview.subtitle')}</p>
        </div>
        <div className="overflow-hidden rounded-[20px] border bg-background shadow-[0_40px_80px_rgba(0,0,0,0.08)]">
          <div className="flex items-center gap-2 border-b bg-card px-5 py-4">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="grid min-h-[400px] md:grid-cols-[240px_1fr]">
            <div className="hidden border-r bg-card p-5 md:block">
              <div className="mb-1 rounded-lg bg-accent px-3 py-2.5 text-sm font-medium">
                📘 {t('preview.navContent')}
              </div>
              {sections.map((s) => (
                <div key={s} className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground">
                  📄 {s}
                </div>
              ))}
              <div className="mt-5 border-t pt-4">
                {sidebarActions.map((s) => (
                  <div key={s} className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground">
                    {s}
                  </div>
                ))}
              </div>
            </div>
            <div className="p-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                {t('preview.chapterLabel')}
              </p>
              <h3 className="mt-2 text-2xl font-bold">{t('preview.contentTitle')}</h3>
              <p className="mt-5 text-[15px] leading-relaxed">
                {t('preview.paragraph1Lead')}
                <span className="od-highlight">{t('preview.paragraph1Highlight')}</span>
                {t('preview.paragraph1Tail')}
              </p>
              <p className="mt-4 text-[15px] leading-relaxed">
                {t('preview.paragraph2Lead')}
                <span className="od-highlight">{t('preview.paragraph2Highlight')}</span>
                {t('preview.paragraph2Tail')}
              </p>
              <div className="mt-6 flex flex-wrap gap-2.5">
                {chips.map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm font-medium"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
