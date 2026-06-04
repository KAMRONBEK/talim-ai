'use client';

import Link from 'next/link';

const features = [
  {
    icon: '📝',
    title: 'AI xulosalari',
    description:
      'Har qanday materialdan asosiy nuqtalarni ajratib oling. Butun bobni qayta o\'qish shart emas — asosiy tushunchalarni bir necha daqiqada tushuning.',
    color: 'bg-emerald-50',
  },
  {
    icon: '🎧',
    title: 'Tinglang va o\'rganing',
    description:
      'Kontentingizni AI yaratgan podkastlarga aylantiring. Sayohat, mashq yoki uy ishlari paytida o\'rganing.',
    color: 'bg-blue-50',
  },
  {
    icon: '📊',
    title: 'Bilimingizni sinang',
    description:
      'Shaxsiy imtihonlar va testlar yarating, batafsil javob tahlillarini oling. Taraqqiyotingizni kuzating.',
    color: 'bg-amber-50',
  },
  {
    icon: '💬',
    title: 'AI o\'qituvchi suhbati',
    description:
      'Materialingizning istalgan qismini tanlang va aniq savollar bering. Kontentingizga bevosita havolalar bilan javoblar.',
    color: 'bg-rose-50',
  },
];

const howSteps = [
  {
    n: 1,
    title: 'Kontentingizni yuklang',
    text: 'PDF fayllarni tashlang, YouTube havolalarini joylashtiring, slaydlarni yuklang yoki ma\'ruzalarni ulashing. Qolganini biz hal qilamiz.',
  },
  {
    n: 2,
    title: 'AI hamma narsani qayta ishlaydi',
    text: 'AI materialingizni bo\'laklarga ajratadi, xulosalar yaratadi, podkastlar ishlab chiqadi va testlar tuzadi.',
  },
  {
    n: 3,
    title: 'O\'zingizning yo\'lingiz bilan o\'rganing',
    text: 'Xulosalarni o\'qing, podkastlarni tinglang, testlarni bajaring yoki AI o\'qituvchingiz bilan suhbatlashing.',
  },
];

const stats = [
  { value: '10K+', label: 'Faol o\'quvchilar' },
  { value: '50K+', label: 'Yuklangan materiallar' },
  { value: '92%', label: 'O\'rtacha test balli' },
  { value: '4.9★', label: 'Foydalanuvchi reytingi' },
];

export function LandingPage() {
  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-50 border-b bg-card/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-sm text-primary-foreground">
              T
            </span>
            Talim AI
          </Link>
          <ul className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <li>
              <a href="#features" className="hover:text-foreground">
                Xususiyatlar
              </a>
            </li>
            <li>
              <a href="#how" className="hover:text-foreground">
                Qanday ishlaydi
              </a>
            </li>
            <li>
              <a href="#preview" className="hover:text-foreground">
                Mahsulot
              </a>
            </li>
          </ul>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden rounded-[10px] border px-5 py-2.5 text-sm font-semibold hover:bg-secondary sm:inline-flex"
            >
              Kirish
            </Link>
            <Link
              href="/register"
              className="inline-flex rounded-[10px] bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              Boshlash
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden px-6 pb-20 pt-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,hsl(var(--accent)/0.5),transparent),radial-gradient(ellipse_60%_50%_at_80%_50%,hsl(var(--accent-secondary)/0.12),transparent)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
              <span className="h-2 w-2 rounded-full bg-primary" />
              AI bilan o&apos;rganish
            </span>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
              Har qanday narsani.{' '}
              <em className="text-primary not-italic">O&apos;zingizning yo&apos;lingiz bilan.</em>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              Har qanday materialni yuklang — PDF, video, slayd yoki ma&apos;ruza — va AI yaratgan
              xulosalar, podkastlar, testlar va shaxsiy o&apos;qituvchiga ega bo&apos;ling.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="inline-flex items-center rounded-xl bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
              >
                Demoni ko&apos;rish
              </Link>
              <a
                href="#features"
                className="inline-flex items-center rounded-xl border px-6 py-3.5 text-base font-semibold hover:bg-secondary"
              >
                Xususiyatlarni ko&apos;rish
              </a>
            </div>
            <div className="mt-8 flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex -space-x-2">
                {['JD', 'SK', 'AR'].map((a) => (
                  <span
                    key={a}
                    className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-gradient-to-br from-primary to-accent-secondary text-[10px] font-semibold text-white"
                  >
                    {a}
                  </span>
                ))}
              </div>
              <span>10,000+ o&apos;z-o&apos;zini o&apos;rgatuvchilarga ishonchli</span>
            </div>
          </div>
          <div className="rounded-2xl border bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3 border-b pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent-secondary text-xl text-white">
                🧬
              </div>
              <div>
                <p className="font-semibold">Genetik kod va tarjima</p>
                <p className="text-sm text-muted-foreground">Biologiya 101 · 11-bob</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              {[
                { icon: '📝', text: "Xulosa yaratildi · 3 daqiqa o'qish" },
                { icon: '🎧', text: "Podkast tayyor · 8 daqiqa tinglash", purple: true },
                { icon: '❓', text: 'Test mavjud · 12 ta savol' },
              ].map((row) => (
                <div
                  key={row.text}
                  className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2.5"
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm ${
                      row.purple ? 'bg-blue-50' : 'bg-emerald-50'
                    }`}
                  >
                    {row.icon}
                  </span>
                  {row.text}
                </div>
              ))}
            </div>
            <div className="mt-4">
              <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                <span>Sizning taraqqiyotingiz</span>
                <span>72%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-border">
                <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-primary to-accent-secondary" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="border-t bg-card px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Har qanday mavzuni egallash uchun kerakli barcha narsalar
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Yuklashdan to mukammallikgacha — siz eng yaxshi o&apos;rganish uslubingizga moslashadigan
              bitta platforma.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border bg-background p-8 transition-shadow hover:shadow-md"
              >
                <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-xl ${f.color}`}>
                  {f.icon}
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="border-t px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Talim AI qanday ishlaydi</h2>
            <p className="mt-3 text-muted-foreground">
              Xom materialdan chuqur tushunchagacha uchta oddiy qadam.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {howSteps.map((step) => (
              <div key={step.n} className="relative text-center">
                <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-[14px] border-2 border-primary bg-card text-xl font-bold text-primary">
                  {step.n}
                </div>
                <h3 className="text-xl font-semibold">{step.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="preview" className="border-t bg-card px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Amalda ko&apos;rish</h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Chuqur o&apos;rganish uchun mo&apos;ljallangan toza interfeys — tartibsizlik yo&apos;q.
            </p>
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
                  📘 Genetik kod
                </div>
                {['Transkripsiya', 'Tarjima', 'Mutatsiyalar'].map((s) => (
                  <div key={s} className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground">
                    📄 {s}
                  </div>
                ))}
                <div className="mt-5 border-t pt-4">
                  {['❓ Test', '🎧 Podkast', "💬 AI O'qituvchi"].map((s) => (
                    <div key={s} className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground">
                      {s}
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-8">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">11-bob</p>
                <h3 className="mt-2 text-2xl font-bold">Genetik kod va tarjima</h3>
                <p className="mt-5 text-[15px] leading-relaxed">
                  Genetik kod — bu tirik hujayralar tomonidan genetik materialga kiritilgan
                  ma&apos;lumotlarni oqsillarga tarjima qilish uchun ishlatiladigan qoidalar
                  to&apos;plami. Bu{' '}
                  <span className="od-highlight">ucluchilik kodi</span> bo&apos;lib, har uchta
                  nukleotidning ketma-ketligi kodon deb ataladi.
                </p>
                <p className="mt-4 text-[15px] leading-relaxed">
                  Tarjima paytida ribosom mRNA ketma-ketligini o&apos;qiydi va tRNA yordamida
                  aminokislotalarni polipeptid zanjiriga yig&apos;adi —{' '}
                  <span className="od-highlight">tsitoplazmada</span> sodir bo&apos;ladi.
                </p>
                <div className="mt-6 flex flex-wrap gap-2.5">
                  {['🎧 Tinglang', '❓ Test ishlang', "💬 AI dan so'rang"].map((label) => (
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

      <section className="bg-gradient-to-br from-slate-800 to-slate-900 px-6 py-20 text-white">
        <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <h3 className="bg-gradient-to-br from-white to-slate-300 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent">
                {s.value}
              </h3>
              <p className="mt-2 text-slate-300">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="cta" className="relative overflow-hidden border-t px-6 py-28 text-center">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_100%,hsl(var(--accent)/0.35),transparent)]" />
        <div className="relative mx-auto max-w-3xl">
          <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Aqlliroq o&apos;rganishga tayyormisiz?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-lg text-muted-foreground">
            AI yordamida mavzularni tezroq egallayotgan minglab o&apos;z-o&apos;zini o&apos;rgatuvchilarga
            qo&apos;shiling.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            Bepul o&apos;rganishni boshlang
          </Link>
        </div>
      </section>

      <footer className="border-t bg-card px-6 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center sm:gap-6">
            <Link href="/" className="flex items-center gap-2 font-bold">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-sm text-primary-foreground">
                T
              </span>
              Talim AI
            </Link>
            <p className="text-sm text-muted-foreground">© 2025 Talim AI. Barcha huquqlar himoyalangan.</p>
          </div>
          <ul className="flex gap-6 text-sm text-muted-foreground">
            <li>
              <Link href="/dashboard" className="hover:text-foreground">
                Ilova
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-foreground">
                Kirish
              </Link>
            </li>
            <li>
              <a href="#" className="hover:text-foreground">
                Maxfiylik
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-foreground">
                Shartlar
              </a>
            </li>
          </ul>
        </div>
      </footer>
    </div>
  );
}
