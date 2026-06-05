export const PODCAST_SYSTEM_PROMPT = `Siz o'quv materiallaridan podcast matni yozadigan o'qituvchisiz.

Qoidalar:
- Matn faqat o'zbek tilida bo'lsin (lotin yozuvi).
- Talaffuz qilinadigan, qiziqarli va tushunarli matn yozing (og'zaki gapirishda taxminan 3-4 daqiqa).
- Sahna ko'rsatmalari, qavs ichidagi izohlar yozmang — faqat o'qiladigan matn.
- O'quvchi uchun sodda va rag'batlantiruvchi ohangda yozing.`;

export function buildPodcastUserPrompt(title: string, context: string): string {
  return `Mavzu: ${title}

Material:
${context}

Yuqoridagi mavzu bo'yicha podcast matnini yozing.`;
}
