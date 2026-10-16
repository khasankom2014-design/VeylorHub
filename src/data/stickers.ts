// Veylor Labs - Official 32 Sticker Pack
// Cyberpunk hooded developer stickers with neon cyan highlights and Russian text

export interface Sticker {
  id: string;
  name: string;
  text: string;
  category: 'Разработка' | 'Эмоции' | 'Релиз & Прод' | 'Мемы';
  svg: string; // Clean SVG data URL or SVG markup
}

// Generate stylized sticker SVG based on sticker theme and character pose
function makeStickerSvg(text: string, emojiIcon: string, secondaryGlow: string, customGraphic: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
    <defs>
      <linearGradient id="hoodGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e293b"/>
        <stop offset="60%" stop-color="#0f172a"/>
        <stop offset="100%" stop-color="#020617"/>
      </linearGradient>
      <linearGradient id="cyanGlow" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#38bdf8"/>
        <stop offset="100%" stop-color="#06b6d4"/>
      </linearGradient>
      <filter id="neonBlur" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      <filter id="stickerBorder">
        <feMorphology operator="dilate" radius="4" in="SourceAlpha" result="dilated"/>
        <feFlood flood-color="#ffffff" result="white"/>
        <feComposite in="white" in2="dilated" operator="in" result="outline"/>
        <feMerge>
          <feMergeNode in="outline"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>

    <!-- White sticker background contour -->
    <path d="M 60,35 C 80,18 120,18 140,35 C 160,52 165,85 160,115 C 172,130 165,155 145,160 C 130,165 70,165 55,160 C 35,155 28,130 40,115 C 35,85 40,52 60,35 Z" fill="#ffffff" opacity="0.95"/>

    <!-- Hooded Character Body -->
    <g transform="translate(0, -5)">
      <!-- Shoulders & Hoodie -->
      <path d="M 52,145 C 52,118 72,108 100,108 C 128,108 148,118 148,145 C 148,155 142,160 135,160 L 65,160 C 58,160 52,155 52,145 Z" fill="url(#hoodGrad)" stroke="#334155" stroke-width="2"/>
      
      <!-- VEYLOR Chest text -->
      <text x="100" y="142" font-family="'JetBrains Mono', monospace, sans-serif" font-weight="900" font-size="9" fill="#38bdf8" text-anchor="middle" letter-spacing="1.5" filter="url(#neonBlur)">VEYLOR</text>

      <!-- Hood Outer Silhouette -->
      <path d="M 64,68 C 64,30 80,22 100,22 C 120,22 136,30 136,68 C 136,102 122,112 100,112 C 78,112 64,102 64,68 Z" fill="url(#hoodGrad)" stroke="#38bdf8" stroke-width="2.5"/>

      <!-- Inner Shadow Mask Face -->
      <ellipse cx="100" cy="72" rx="27" ry="32" fill="#020617"/>

      <!-- Glowing Cyan Eyes -->
      <g filter="url(#neonBlur)">
        <ellipse cx="88" cy="70" rx="7.5" ry="5.5" fill="#38bdf8"/>
        <ellipse cx="112" cy="70" rx="7.5" ry="5.5" fill="#38bdf8"/>
        <ellipse cx="89" cy="69" rx="3" ry="2" fill="#ffffff"/>
        <ellipse cx="113" cy="69" rx="3" ry="2" fill="#ffffff"/>
      </g>

      <!-- Custom Prop / Action Graphic -->
      ${customGraphic}
    </g>

    <!-- Bottom Text Banner with White Border and Black Fill -->
    <g transform="translate(100, 180)">
      <!-- Banner Box -->
      <rect x="-85" y="-19" width="170" height="26" rx="6" fill="#090d16" stroke="#ffffff" stroke-width="3"/>
      <!-- Text with thick stroke -->
      <text x="0" y="0" font-family="'Impact', 'Arial Black', sans-serif" font-weight="900" font-size="16" fill="#ffffff" text-anchor="middle" dominant-baseline="middle" letter-spacing="0.5">${text}</text>
    </g>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const STICKERS: Sticker[] = [
  {
    id: '01_privet',
    name: 'Привет',
    text: 'ПРИВЕТ',
    category: 'Эмоции',
    svg: makeStickerSvg(
      'ПРИВЕТ',
      '👋',
      '#38bdf8',
      `<g transform="translate(142, 60)">
        <path d="M 0,25 C 8,15 15,2 10,-8 C 6,-14 -2,-10 -5,-4 L -4,15 Z" fill="#0f172a" stroke="#38bdf8" stroke-width="2"/>
        <circle cx="8" cy="-5" r="4" fill="#38bdf8" opacity="0.6"/>
        <circle cx="16" cy="4" r="3.5" fill="#38bdf8" opacity="0.6"/>
       </g>`
    ),
  },
  {
    id: '02_kodim',
    name: 'Кодим...',
    text: 'КОДИМ...',
    category: 'Разработка',
    svg: makeStickerSvg(
      'КОДИМ...',
      '💻',
      '#06b6d4',
      `<g transform="translate(68, 115)">
        <polygon points="0,25 64,25 56,8 8,8" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
        <polygon points="12,10 52,10 56,23 8,23" fill="#0284c7" opacity="0.8"/>
        <line x1="16" y1="14" x2="36" y2="14" stroke="#ffffff" stroke-width="1.5"/>
        <line x1="16" y1="18" x2="48" y2="18" stroke="#38bdf8" stroke-width="1.5"/>
       </g>`
    ),
  },
  {
    id: '03_kofe',
    name: 'Кофеёк',
    text: 'КОФЕЁК',
    category: 'Эмоции',
    svg: makeStickerSvg(
      'КОФЕЁК',
      '☕',
      '#f59e0b',
      `<g transform="translate(122, 110)">
        <rect x="0" y="5" width="24" height="26" rx="4" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
        <path d="M 24,10 C 31,10 31,24 24,24" fill="none" stroke="#ffffff" stroke-width="3"/>
        <path d="M 5,2 C 6,-6 10,-4 11,-12" fill="none" stroke="#f59e0b" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M 14,2 C 15,-5 19,-3 20,-10" fill="none" stroke="#f59e0b" stroke-width="1.5" stroke-linecap="round"/>
       </g>`
    ),
  },
  {
    id: '04_ok',
    name: 'OK',
    text: 'OK',
    category: 'Эмоции',
    svg: makeStickerSvg(
      'OK',
      '👍',
      '#10b981',
      `<g transform="translate(42, 95)">
        <path d="M 12,30 C 12,20 6,15 6,5 C 6,-3 16,-3 16,5 L 16,16 L 24,16 C 30,16 30,30 22,32 Z" fill="#0f172a" stroke="#10b981" stroke-width="2.5"/>
        <circle cx="11" cy="2" r="3" fill="#10b981"/>
       </g>`
    ),
  },
  {
    id: '05_bag',
    name: 'Баг?!',
    text: 'БАГ?!',
    category: 'Разработка',
    svg: makeStickerSvg(
      'БАГ?!',
      '🐛',
      '#ef4444',
      `<g transform="translate(120, 60)">
        <rect x="0" y="0" width="45" height="32" rx="4" fill="#991b1b" stroke="#f87171" stroke-width="2"/>
        <rect x="0" y="0" width="45" height="10" fill="#dc2626"/>
        <text x="22" y="24" font-family="sans-serif" font-weight="900" font-size="9" fill="#ffffff" text-anchor="middle">ERROR</text>
       </g>`
    ),
  },
  {
    id: '06_prod_upal',
    name: 'Прод упал',
    text: 'ПРОД УПАЛ',
    category: 'Релиз & Прод',
    svg: makeStickerSvg(
      'ПРОД УПАЛ',
      '🔥',
      '#f97316',
      `<g transform="translate(90, 95)">
        <path d="M 10,35 C -5,20 5,0 15,10 C 25,-10 45,5 35,25 C 45,15 50,30 40,35 Z" fill="#ea580c" opacity="0.9"/>
        <path d="M 16,35 C 8,25 15,10 20,18 C 28,5 40,15 32,30 Z" fill="#facc15"/>
       </g>`
    ),
  },
  {
    id: '07_hrrr',
    name: 'Хррр...',
    text: 'ХРРР...',
    category: 'Эмоции',
    svg: makeStickerSvg(
      'ХРРР...',
      '💤',
      '#818cf8',
      `<g transform="translate(125, 40)">
        <text x="0" y="0" font-family="'Impact', sans-serif" font-weight="900" font-size="14" fill="#a5b4fc">Z</text>
        <text x="12" y="-10" font-family="'Impact', sans-serif" font-weight="900" font-size="18" fill="#818cf8">Z</text>
        <text x="26" y="-22" font-family="'Impact', sans-serif" font-weight="900" font-size="22" fill="#6366f1">Z</text>
       </g>`
    ),
  },
  {
    id: '08_rabotaet',
    name: 'Работает!',
    text: 'РАБОТАЕТ!',
    category: 'Разработка',
    svg: makeStickerSvg(
      'РАБОТАЕТ!',
      '🎉',
      '#10b981',
      `<g transform="translate(0, 0)">
        <circle cx="45" cy="45" r="4" fill="#f43f5e"/>
        <circle cx="155" cy="40" r="5" fill="#38bdf8"/>
        <rect x="50" y="65" width="6" height="6" fill="#eab308" transform="rotate(25 50 65)"/>
        <rect x="145" y="75" width="7" height="7" fill="#10b981" transform="rotate(-30 145 75)"/>
       </g>`
    ),
  },
  {
    id: '09_hmm',
    name: 'Хмм...',
    text: 'ХММ...',
    category: 'Эмоции',
    svg: makeStickerSvg(
      'ХММ...',
      '🤔',
      '#38bdf8',
      `<g transform="translate(135, 35)">
        <text x="0" y="20" font-family="'Impact', sans-serif" font-weight="900" font-size="34" fill="#38bdf8" filter="url(#neonBlur)">?</text>
       </g>`
    ),
  },
  {
    id: '10_za_chto',
    name: 'За что?!',
    text: 'ЗА ЧТО?!',
    category: 'Эмоции',
    svg: makeStickerSvg(
      'ЗА ЧТО?!',
      '😭',
      '#06b6d4',
      `<g transform="translate(85, 78)">
        <path d="M 3,0 L 3,25 L -1,15 Z" fill="#38bdf8" filter="url(#neonBlur)"/>
        <path d="M 27,0 L 27,25 L 31,15 Z" fill="#38bdf8" filter="url(#neonBlur)"/>
       </g>`
    ),
  },
  {
    id: '11_u_menya_rabotaet',
    name: 'У меня работает',
    text: 'У МЕНЯ РАБОТАЕТ',
    category: 'Мемы',
    svg: makeStickerSvg(
      'У МЕНЯ РАБОТАЕТ',
      '🤷‍♂️',
      '#38bdf8',
      `<g transform="translate(40, 100)">
        <path d="M 0,20 C 0,5 20,0 20,-10" fill="none" stroke="#38bdf8" stroke-width="3" stroke-linecap="round"/>
        <circle cx="20" cy="-12" r="4" fill="#38bdf8"/>
        <path d="M 120,20 C 120,5 100,0 100,-10" fill="none" stroke="#38bdf8" stroke-width="3" stroke-linecap="round"/>
        <circle cx="100" cy="-12" r="4" fill="#38bdf8"/>
       </g>`
    ),
  },
  {
    id: '12_pushu_v_prod',
    name: 'Пушу в прод',
    text: 'ПУШУ В ПРОД',
    category: 'Релиз & Прод',
    svg: makeStickerSvg(
      'ПУШУ В ПРОД',
      '🚀',
      '#f43f5e',
      `<g transform="translate(35, 70)">
        <polygon points="5,0 45,0 45,45 25,45 25,25 5,25" fill="#334155" stroke="#f43f5e" stroke-width="2.5"/>
        <text x="25" y="16" font-family="sans-serif" font-weight="900" font-size="10" fill="#ffffff" text-anchor="middle">ENTER</text>
       </g>`
    ),
  },
  {
    id: '13_lyublyu',
    name: 'Люблю',
    text: 'ЛЮБЛЮ',
    category: 'Эмоции',
    svg: makeStickerSvg(
      'ЛЮБЛЮ',
      '💙',
      '#38bdf8',
      `<g transform="translate(85, 115)">
        <path d="M 15,8 C 15,0 0,0 0,12 C 0,22 15,30 15,30 C 15,30 30,22 30,12 C 30,0 15,0 15,8 Z" fill="#0284c7" stroke="#38bdf8" stroke-width="2" filter="url(#neonBlur)"/>
       </g>`
    ),
  },
  {
    id: '14_net',
    name: 'Нет',
    text: 'НЕТ',
    category: 'Эмоции',
    svg: makeStickerSvg(
      'НЕТ',
      '🙅‍♂️',
      '#ef4444',
      `<g transform="translate(70, 115)">
        <line x1="5" y1="5" x2="55" y2="35" stroke="#ef4444" stroke-width="4" stroke-linecap="round"/>
        <line x1="55" y1="5" x2="5" y2="35" stroke="#ef4444" stroke-width="4" stroke-linecap="round"/>
       </g>`
    ),
  },
  {
    id: '15_zadeploil',
    name: 'Задеплоил',
    text: 'ЗАДЕПЛОИЛ',
    category: 'Релиз & Прод',
    svg: makeStickerSvg(
      'ЗАДЕПЛОИЛ',
      '😎',
      '#38bdf8',
      `<g transform="translate(72, 65)">
        <rect x="0" y="0" width="56" height="12" fill="#020617" stroke="#ffffff" stroke-width="1.5"/>
        <rect x="2" y="2" width="10" height="8" fill="#ffffff"/>
        <rect x="14" y="2" width="10" height="8" fill="#ffffff"/>
        <rect x="32" y="2" width="10" height="8" fill="#ffffff"/>
        <rect x="44" y="2" width="10" height="8" fill="#ffffff"/>
       </g>`
    ),
  },
  {
    id: '16_ahahah',
    name: 'Ахахах',
    text: 'АХАХАХ',
    category: 'Мемы',
    svg: makeStickerSvg(
      'АХАХАХ',
      '🤣',
      '#f59e0b',
      `<g transform="translate(85, 75)">
        <path d="M 0,0 Q 15,18 30,0 Z" fill="#ffffff"/>
       </g>`
    ),
  },
  {
    id: '17_debazhu',
    name: 'Дебажу',
    text: 'ДЕБАЖУ',
    category: 'Разработка',
    svg: makeStickerSvg(
      'ДЕБАЖУ',
      '🕵️‍♂️',
      '#d97706',
      `<g transform="translate(125, 80)">
        <circle cx="15" cy="15" r="14" fill="none" stroke="#e2e8f0" stroke-width="3"/>
        <circle cx="15" cy="15" r="11" fill="#38bdf8" opacity="0.3"/>
        <line x1="25" y1="25" x2="40" y2="40" stroke="#94a3b8" stroke-width="4" stroke-linecap="round"/>
        <circle cx="15" cy="15" r="4" fill="#0f172a"/>
       </g>`
    ),
  },
  {
    id: '18_krya',
    name: 'Кря',
    text: 'КРЯ',
    category: 'Разработка',
    svg: makeStickerSvg(
      'КРЯ',
      '🦆',
      '#facc15',
      `<g transform="translate(72, 110)">
        <!-- Yellow rubber duck -->
        <ellipse cx="28" cy="22" rx="16" ry="12" fill="#facc15"/>
        <circle cx="38" cy="12" r="10" fill="#facc15"/>
        <path d="M 44,14 Q 56,16 46,20 Z" fill="#ea580c"/>
        <circle cx="41" cy="9" r="2" fill="#0f172a"/>
       </g>`
    ),
  },
  {
    id: '19_nochnoy_kod',
    name: 'Ночной код',
    text: 'НОЧНОЙ КОД',
    category: 'Разработка',
    svg: makeStickerSvg(
      'НОЧНОЙ КОД',
      '🌙',
      '#818cf8',
      `<g transform="translate(130, 25)">
        <circle cx="18" cy="18" r="14" fill="#f8fafc" opacity="0.9"/>
        <circle cx="12" cy="15" r="13" fill="#0f172a"/>
       </g>`
    ),
  },
  {
    id: '20_yarost',
    name: 'Ярость',
    text: 'ЯРОСТЬ',
    category: 'Эмоции',
    svg: makeStickerSvg(
      'ЯРОСТЬ',
      '🤬',
      '#ef4444',
      `<g transform="translate(80, 68)">
        <polygon points="5,5 20,10 18,12 8,7" fill="#ef4444"/>
        <polygon points="35,5 20,10 22,12 32,7" fill="#ef4444"/>
       </g>`
    ),
  },
  {
    id: '21_vau',
    name: 'Вау',
    text: 'ВАУ',
    category: 'Эмоции',
    svg: makeStickerSvg(
      'ВАУ',
      '🤯',
      '#38bdf8',
      `<g transform="translate(60, 15)">
        <path d="M 15,25 C 0,15 10,-5 25,5 C 35,-15 55,-10 55,8 C 70,-5 85,15 70,25 Z" fill="#38bdf8" opacity="0.85" filter="url(#neonBlur)"/>
       </g>`
    ),
  },
  {
    id: '22_afk',
    name: 'Не на месте',
    text: 'НЕ НА МЕСТЕ',
    category: 'Эмоции',
    svg: makeStickerSvg(
      'НЕ НА МЕСТЕ',
      '🛌',
      '#64748b',
      `<g transform="translate(70, 95)">
        <path d="M 5,10 C 15,-5 45,-5 55,10 C 60,30 0,30 5,10 Z" fill="#334155" stroke="#94a3b8" stroke-width="2"/>
       </g>`
    ),
  },
  {
    id: '23_vzlomano',
    name: 'Взломано',
    text: 'ВЗЛОМАНО',
    category: 'Мемы',
    svg: makeStickerSvg(
      'ВЗЛОМАНО',
      '⚡',
      '#22c55e',
      `<g transform="translate(45, 60)">
        <text x="0" y="10" font-family="monospace" font-size="10" fill="#22c55e">010110</text>
        <text x="75" y="10" font-family="monospace" font-size="10" fill="#22c55e">110010</text>
        <text x="0" y="35" font-family="monospace" font-size="10" fill="#22c55e">101001</text>
        <text x="75" y="35" font-family="monospace" font-size="10" fill="#22c55e">011101</text>
       </g>`
    ),
  },
  {
    id: '24_drama',
    name: 'Драма',
    text: 'ДРАМА',
    category: 'Мемы',
    svg: makeStickerSvg(
      'ДРАМА',
      '🍿',
      '#f59e0b',
      `<g transform="translate(85, 115)">
        <polygon points="5,10 25,10 22,35 8,35" fill="#ef4444" stroke="#ffffff" stroke-width="1.5"/>
        <line x1="12" y1="10" x2="13" y2="35" stroke="#ffffff" stroke-width="2"/>
        <line x1="18" y1="10" x2="17" y2="35" stroke="#ffffff" stroke-width="2"/>
        <circle cx="10" cy="8" r="4" fill="#fef08a"/>
        <circle cx="16" cy="6" r="4" fill="#fef08a"/>
        <circle cx="21" cy="7" r="4" fill="#fef08a"/>
       </g>`
    ),
  },
  {
    id: '25_nashel',
    name: 'Нашёл!',
    text: 'НАШЁЛ!',
    category: 'Разработка',
    svg: makeStickerSvg(
      'НАШЁЛ!',
      '💡',
      '#38bdf8',
      `<g transform="translate(60, 35)">
        <text x="15" y="30" font-family="'JetBrains Mono', monospace" font-weight="900" font-size="36" fill="#38bdf8" filter="url(#neonBlur)">;</text>
        <text x="55" y="30" font-family="'JetBrains Mono', monospace" font-weight="900" font-size="36" fill="#38bdf8" filter="url(#neonBlur)">}</text>
       </g>`
    ),
  },
  {
    id: '26_konflikt',
    name: 'Конфликт',
    text: 'КОНФЛИКТ',
    category: 'Разработка',
    svg: makeStickerSvg(
      'КОНФЛИКТ',
      '⚔️',
      '#ef4444',
      `<g transform="translate(45, 60)">
        <line x1="10" y1="10" x2="100" y2="70" stroke="#0284c7" stroke-width="4"/>
        <line x1="10" y1="70" x2="100" y2="10" stroke="#ef4444" stroke-width="4"/>
        <circle cx="55" cy="40" r="8" fill="#f87171"/>
       </g>`
    ),
  },
  {
    id: '27_relizim',
    name: 'Релизим!',
    text: 'РЕЛИЗИМ!',
    category: 'Релиз & Прод',
    svg: makeStickerSvg(
      'РЕЛИЗИМ!',
      '🚀',
      '#6366f1',
      `<g transform="translate(115, 65)">
        <path d="M 15,0 C 25,10 30,25 25,40 L 5,40 C 0,25 5,10 15,0 Z" fill="#f8fafc" stroke="#dc2626" stroke-width="2"/>
        <circle cx="15" cy="20" r="5" fill="#0284c7"/>
        <path d="M 8,40 L 15,55 L 22,40 Z" fill="#f97316"/>
       </g>`
    ),
  },
  {
    id: '28_zagruzka',
    name: 'Загрузка...',
    text: 'ЗАГРУЗКА...',
    category: 'Разработка',
    svg: makeStickerSvg(
      'ЗАГРУЗКА...',
      '⏳',
      '#06b6d4',
      `<g transform="translate(50, 130)">
        <rect x="0" y="0" width="100" height="14" rx="7" fill="#0f172a" stroke="#38bdf8" stroke-width="2"/>
        <rect x="2" y="2" width="90" height="10" rx="5" fill="#0284c7"/>
        <text x="50" y="9" font-family="sans-serif" font-weight="900" font-size="7" fill="#ffffff" text-anchor="middle">99%</text>
       </g>`
    ),
  },
  {
    id: '29_404',
    name: 'Где я? 404',
    text: 'ГДЕ Я? 404',
    category: 'Мемы',
    svg: makeStickerSvg(
      'ГДЕ Я? 404',
      '🗺️',
      '#94a3b8',
      `<g transform="translate(75, 115)">
        <polygon points="5,5 45,0 40,25 0,30" fill="#fef3c7" stroke="#b45309" stroke-width="1.5"/>
        <text x="22" y="20" font-family="monospace" font-weight="bold" font-size="10" fill="#b45309">404</text>
       </g>`
    ),
  },
  {
    id: '30_spasibo',
    name: 'Спасибо',
    text: 'СПАСИБО',
    category: 'Эмоции',
    svg: makeStickerSvg(
      'СПАСИБО',
      '🙏',
      '#10b981',
      `<g transform="translate(85, 115)">
        <circle cx="15" cy="15" r="12" fill="#10b981" opacity="0.3"/>
        <path d="M 8,15 L 13,20 L 22,10" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round"/>
       </g>`
    ),
  },
  {
    id: '31_scha_vernus',
    name: 'Ща вернусь',
    text: 'ЩА ВЕРНУСЬ',
    category: 'Эмоции',
    svg: makeStickerSvg(
      'ЩА ВЕРНУСЬ',
      '🏃‍♂️',
      '#38bdf8',
      `<g transform="translate(35, 120)">
        <path d="M 0,10 C 15,0 25,20 40,10" fill="none" stroke="#94a3b8" stroke-width="2" stroke-dasharray="4,4"/>
        <circle cx="10" cy="10" r="5" fill="#cbd5e1" opacity="0.6"/>
        <circle cx="20" cy="6" r="4" fill="#cbd5e1" opacity="0.4"/>
       </g>`
    ),
  },
  {
    id: '32_izi',
    name: 'Изи',
    text: 'ИЗИ',
    category: 'Мемы',
    svg: makeStickerSvg(
      'ИЗИ',
      '🏆',
      '#eab308',
      `<g transform="translate(70, 95)">
        <path d="M 15,5 L 45,5 L 40,28 C 36,35 24,35 20,28 Z" fill="#eab308" stroke="#ca8a04" stroke-width="1.5"/>
        <rect x="26" y="32" width="8" height="12" fill="#ca8a04"/>
        <rect x="18" y="44" width="24" height="6" rx="2" fill="#713f12"/>
        <path d="M 15,10 C 8,10 8,20 16,20" fill="none" stroke="#ca8a04" stroke-width="2"/>
        <path d="M 45,10 C 52,10 52,20 44,20" fill="none" stroke="#ca8a04" stroke-width="2"/>
       </g>`
    ),
  },
];
