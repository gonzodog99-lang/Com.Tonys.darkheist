// Procedural character art: shaded SVG portraits for humans and their animal partners.

let uid = 0;

function rgb(hex) {
  const h = String(hex).replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function shade(hex, amount) {
  const [r, g, b] = rgb(hex);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v + amount)));
  return `rgb(${f(r)}, ${f(g)}, ${f(b)})`;
}

function frame(id, bg, accent, inner, label) {
  return `<svg class="portrait" viewBox="0 0 96 96" role="img" aria-label="${label}">
    <defs>
      <linearGradient id="${id}bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${shade(bg, 14)}"/>
        <stop offset="1" stop-color="${shade(bg, -16)}"/>
      </linearGradient>
      <radialGradient id="${id}glow" cx="0.7" cy="0.18" r="0.85">
        <stop offset="0" stop-color="${accent}" stop-opacity="0.34"/>
        <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="${id}rim" cx="0.78" cy="0.26" r="0.7">
        <stop offset="0" stop-color="#fff6e2" stop-opacity="0.4"/>
        <stop offset="1" stop-color="#fff6e2" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="96" height="96" fill="url(#${id}bg)"/>
    <rect width="96" height="96" fill="url(#${id}glow)"/>
    ${inner}
    <rect width="96" height="96" fill="url(#${id}rim)"/>
  </svg>`;
}

function hair(style, color) {
  const dark = shade(color, -22);
  const light = shade(color, 20);
  switch (style) {
    case 'buzz':
      return `<path d="M29 43c0-13 8-21 19-21s19 8 19 21c-2-8-8-12-19-12s-17 4-19 12z" fill="${dark}"/>`;
    case 'bun':
      return `<path d="M28 44c0-14 9-22 20-22s20 8 20 22c-3-9-9-13-20-13s-17 4-20 13z" fill="${color}"/>
        <circle cx="48" cy="17" r="7.5" fill="${dark}"/><circle cx="45.5" cy="14.5" r="2.4" fill="${light}" opacity="0.55"/>`;
    case 'long':
      return `<path d="M26 46c0-16 9-25 22-25s22 9 22 25v28c-3-6-5-16-5-25 0-9-7-13-17-13s-17 4-17 13c0 9-2 19-5 25z" fill="${color}"/>
        <path d="M31 47c1-9 7-14 17-14s16 5 17 14c-4-5-9-7-17-7s-13 2-17 7z" fill="${light}" opacity="0.32"/>`;
    case 'wavy':
      return `<path d="M27 45c0-15 9-23 21-23s21 8 21 23c0 6 2 10 4 13-5-2-8-7-9-13-4 4-9 6-16 6s-12-2-16-6c-1 6-4 11-9 13 2-3 4-7 4-13z" fill="${color}"/>
        <path d="M33 40c3-6 8-9 15-9s12 3 15 9c-4-3-9-4-15-4s-11 1-15 4z" fill="${light}" opacity="0.3"/>`;
    default:
      return `<path d="M28 44c0-14 9-22 20-22s20 8 20 22c-3-9-9-13-20-13s-17 4-20 13z" fill="${color}"/>
        <path d="M33 39c3-6 8-9 15-9s12 3 15 9c-4-3-9-4-15-4s-11 1-15 4z" fill="${light}" opacity="0.34"/>`;
  }
}

export function humanPortrait(spec) {
  const id = `h${++uid}`;
  const skin = spec.skin || '#c98a63';
  const eye = spec.eye || '#4a6b58';
  const shirt = spec.shirt || '#2a3644';
  const bg = spec.bg || '#18222c';
  const accent = spec.accent || '#f0b132';
  const hairColor = spec.hair || '#2a1c17';

  const glasses = spec.glasses
    ? `<g fill="none" stroke="${shade(skin, -70)}" stroke-width="1.6" opacity="0.9">
         <rect x="34.5" y="43" width="11" height="8" rx="3.4"/>
         <rect x="50.5" y="43" width="11" height="8" rx="3.4"/>
         <path d="M45.5 46.5h5"/>
       </g>`
    : '';

  const beard = spec.beard
    ? `<path d="M31 48c0 14 7 21 17 21s17-7 17-21c0 9-6 13-17 13s-17-4-17-13z" fill="${shade(hairColor, 6)}" opacity="0.72"/>`
    : '';

  const hat = spec.hat === 'beanie'
    ? `<path d="M28 36c0-11 9-18 20-18s20 7 20 18z" fill="${shade(accent, -55)}"/><rect x="26" y="34" width="44" height="6" rx="3" fill="${shade(accent, -40)}"/>`
    : spec.hat === 'cap'
      ? `<path d="M28 37c0-11 9-18 20-18s20 7 20 18z" fill="${shade(shirt, 8)}"/><path d="M26 37h46v5H26z" fill="${shade(shirt, -18)}"/>`
      : '';

  const earring = spec.earring
    ? `<circle cx="29" cy="52" r="2.2" fill="${accent}"/><circle cx="29" cy="52" r="0.9" fill="#fff6e2" opacity="0.8"/>`
    : '';

  const inner = `
    <ellipse cx="48" cy="44" rx="20" ry="21" fill="${shade(skin, -34)}" opacity="0.55"/>
    <path d="M16 96c2-13 10-20 20-23l12 8 12-8c10 3 18 10 20 23z" fill="${shirt}"/>
    <path d="M36 66h24l-3 12H39z" fill="${shade(skin, -14)}"/>
    <path d="M32 74c5 4 10 6 16 6s11-2 16-6l-4-8-12 6-12-6z" fill="${shade(shirt, -18)}"/>
    <rect x="41" y="58" width="14" height="14" rx="5" fill="${shade(skin, -8)}"/>
    <ellipse cx="48" cy="45" rx="19" ry="21" fill="url(#${id}skin)"/>
    <ellipse cx="30" cy="47" rx="3.2" ry="4.6" fill="${shade(skin, -6)}"/>
    <ellipse cx="66" cy="47" rx="3.2" ry="4.6" fill="${shade(skin, -6)}"/>
    ${hair(spec.style || 'short', hairColor)}
    ${hat}
    ${beard}
    <g>
      <ellipse cx="39.5" cy="46" rx="4.4" ry="3.2" fill="#f7f2ea"/>
      <ellipse cx="56.5" cy="46" rx="4.4" ry="3.2" fill="#f7f2ea"/>
      <circle cx="39.8" cy="46" r="2.9" fill="${eye}"/>
      <circle cx="56.2" cy="46" r="2.9" fill="${eye}"/>
      <circle cx="39.8" cy="46" r="1.35" fill="#0b0f13"/>
      <circle cx="56.2" cy="46" r="1.35" fill="#0b0f13"/>
      <circle cx="40.7" cy="44.9" r="0.9" fill="#fff" opacity="0.9"/>
      <circle cx="57.1" cy="44.9" r="0.9" fill="#fff" opacity="0.9"/>
      <path d="M34.5 40.2c2.6-2 8.4-2 10.4 0.4" fill="none" stroke="${shade(hairColor, 6)}" stroke-width="1.7" stroke-linecap="round"/>
      <path d="M50.8 40.6c2-2.4 7.8-2.4 10.4-0.4" fill="none" stroke="${shade(hairColor, 6)}" stroke-width="1.7" stroke-linecap="round"/>
    </g>
    <path d="M48 47.5c0.8 3 0.6 5.4-1.2 6.2" fill="none" stroke="${shade(skin, -46)}" stroke-width="1.4" stroke-linecap="round" opacity="0.8"/>
    <path d="M43.5 60.4c2.8 1.9 6.2 1.9 9 0" fill="none" stroke="${shade(skin, -62)}" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M60 66c3 3 5 7 5 12" fill="none" stroke="${shade(skin, -40)}" stroke-width="3.4" stroke-linecap="round" opacity="0.22"/>
    ${glasses}
    ${earring}
    <defs>
      <linearGradient id="${id}skin" x1="0.15" y1="0" x2="0.9" y2="1">
        <stop offset="0" stop-color="${shade(skin, 22)}"/>
        <stop offset="0.55" stop-color="${skin}"/>
        <stop offset="1" stop-color="${shade(skin, -26)}"/>
      </linearGradient>
    </defs>`;

  return frame(id, bg, accent, inner, spec.name || 'Character portrait');
}

export function animalPortrait(spec) {
  const id = `a${++uid}`;
  const kind = spec.animal || 'dog';
  const fur = spec.fur || '#9a7b56';
  const bg = spec.bg || '#18222c';
  const accent = spec.accent || '#f0b132';
  const eye = spec.eye || '#3c2a16';
  const dark = shade(fur, -34);
  const light = shade(fur, 22);

  const bodies = {
    dog: `
      <path d="M20 96c2-14 12-22 28-22s26 8 28 22z" fill="${dark}"/>
      <ellipse cx="48" cy="50" rx="21" ry="19" fill="${fur}"/>
      <path d="M27 40c-8 2-11 9-9 18 2 8 7 13 12 12 4-1 5-7 3-14-2-6-3-12-6-16z" fill="${shade(fur, -22)}"/>
      <path d="M69 40c8 2 11 9 9 18-2 8-7 13-12 12-4-1-5-7-3-14 2-6 3-12 6-16z" fill="${shade(fur, -22)}"/>
      <ellipse cx="48" cy="62" rx="13" ry="10" fill="${light}"/>
      <ellipse cx="48" cy="56" rx="3.6" ry="2.6" fill="#221912"/>
      <path d="M48 58v5" stroke="${dark}" stroke-width="1.4"/>
      <path d="M43 64c2 2.4 3.4 2.4 5 0 1.6 2.4 3 2.4 5 0" fill="none" stroke="${dark}" stroke-width="1.4" stroke-linecap="round"/>
      <ellipse cx="39" cy="46" rx="4.4" ry="3.6" fill="#f6efe4"/>
      <ellipse cx="57" cy="46" rx="4.4" ry="3.6" fill="#f6efe4"/>
      <circle cx="39.4" cy="46" r="2.5" fill="${eye}"/>
      <circle cx="56.6" cy="46" r="2.5" fill="${eye}"/>
      <circle cx="40" cy="45" r="0.85" fill="#fff"/>
      <circle cx="57.2" cy="45" r="0.85" fill="#fff"/>
      <path d="M31 38c4-3 7-3 10-1" fill="none" stroke="${dark}" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M55 37c3-2 6-2 10 1" fill="none" stroke="${dark}" stroke-width="1.4" stroke-linecap="round"/>`,
    cat: `
      <path d="M20 96c2-14 12-22 28-22s26 8 28 22z" fill="${dark}"/>
      <path d="M30 30l4 16-12-6z" fill="${fur}"/>
      <path d="M66 30l-4 16 12-6z" fill="${fur}"/>
      <path d="M33 33l2.4 9-6.4-3.4z" fill="${shade(fur, 34)}" opacity="0.7"/>
      <path d="M63 33l-2.4 9 6.4-3.4z" fill="${shade(fur, 34)}" opacity="0.7"/>
      <ellipse cx="48" cy="50" rx="20" ry="18" fill="${fur}"/>
      <ellipse cx="48" cy="58" rx="11" ry="8" fill="${light}" opacity="0.7"/>
      <path d="M45 59h6l-3 3z" fill="${shade(fur, -46)}"/>
      <path d="M48 62v3" stroke="${dark}" stroke-width="1.2"/>
      <path d="M43 65c1.8 1.6 3.2 1.6 5 0 1.8 1.6 3.2 1.6 5 0" fill="none" stroke="${dark}" stroke-width="1.2" stroke-linecap="round"/>
      <ellipse cx="38" cy="47" rx="5" ry="4" fill="#f7f2e6"/>
      <ellipse cx="58" cy="47" rx="5" ry="4" fill="#f7f2e6"/>
      <ellipse cx="38" cy="47" rx="2.2" ry="4" fill="#79d38a"/>
      <ellipse cx="58" cy="47" rx="2.2" ry="4" fill="#79d38a"/>
      <ellipse cx="38" cy="47" rx="0.9" ry="3.4" fill="#0d1510"/>
      <ellipse cx="58" cy="47" rx="0.9" ry="3.4" fill="#0d1510"/>
      <g stroke="${shade(fur, 46)}" stroke-width="0.9" opacity="0.85">
        <path d="M30 56l-9-2"/><path d="M30 60l-9 2"/>
        <path d="M66 56l9-2"/><path d="M66 60l9 2"/>
      </g>`,
    rat: `
      <path d="M56 96c-2-10-6-18-8-24 8-4 14-10 16-18-2 22 6 32 8 42z" fill="${shade(fur, -26)}" opacity="0.9"/>
      <circle cx="31" cy="35" r="10" fill="${shade(fur, -12)}"/>
      <circle cx="31" cy="35" r="6" fill="${shade(fur, 34)}" opacity="0.65"/>
      <circle cx="65" cy="35" r="10" fill="${shade(fur, -12)}"/>
      <circle cx="65" cy="35" r="6" fill="${shade(fur, 34)}" opacity="0.65"/>
      <ellipse cx="48" cy="54" rx="18" ry="16" fill="${fur}"/>
      <ellipse cx="48" cy="64" rx="7" ry="5.5" fill="#e6a3ad"/>
      <circle cx="48" cy="62" r="2.4" fill="#3a2028"/>
      <ellipse cx="39" cy="49" rx="4" ry="3.2" fill="#f6eee6"/>
      <ellipse cx="57" cy="49" rx="4" ry="3.2" fill="#f6eee6"/>
      <circle cx="39.4" cy="49" r="2.2" fill="#20130f"/>
      <circle cx="56.6" cy="49" r="2.2" fill="#20130f"/>
      <circle cx="40" cy="48.2" r="0.8" fill="#fff"/>
      <circle cx="57.2" cy="48.2" r="0.8" fill="#fff"/>
      <g stroke="${shade(fur, 50)}" stroke-width="0.9" opacity="0.8">
        <path d="M30 62l-13-3"/><path d="M30 66l-13 3"/>
        <path d="M66 62l13-3"/><path d="M66 66l13 3"/>
      </g>`,
    falcon: `
      <path d="M18 96c4-16 14-24 30-24s26 8 30 24z" fill="${shade(fur, -30)}"/>
      <ellipse cx="48" cy="50" rx="20" ry="19" fill="${fur}"/>
      <path d="M48 27c-9 0-15 4-18 10 5-3 11-4 18-4s13 1 18 4c-3-6-9-10-18-10z" fill="${light}" opacity="0.6"/>
      <path d="M48 54c-4 0-7 1.6-8 5 2.5 4 5.4 6 8 6s5.5-2 8-6c-1-3.4-4-5-8-5z" fill="${shade(fur, 36)}"/>
      <path d="M52 60l10 2.4-9 4.6z" fill="#e8b04a"/>
      <path d="M52 61.6l7 1.6-6.4 2.8z" fill="#8a5f1c"/>
      <circle cx="58" cy="45" r="5.4" fill="#f8f2e4"/>
      <circle cx="58.6" cy="45" r="2.8" fill="#f2c14a"/>
      <circle cx="58.6" cy="45" r="1.5" fill="#181008"/>
      <circle cx="59.4" cy="44.2" r="0.8" fill="#fff"/>
      <path d="M50 40.5c4-2 8-1.4 11 1" fill="none" stroke="${shade(fur, -46)}" stroke-width="1.5" stroke-linecap="round"/>
      <g stroke="${shade(fur, -18)}" stroke-width="1" opacity="0.7">
        <path d="M34 55c4 1 7 3 9 6"/><path d="M34 62c4 0 7 1 9 3"/>
      </g>`,
  };

  return frame(id, bg, accent, bodies[kind] || bodies.dog, spec.name || `${kind} portrait`);
}

export function portraitMarkup(character, size = 'md') {
  const spec = { ...character.portrait, name: character.name };
  const svg = character.kind === 'animal' ? animalPortrait(spec) : humanPortrait(spec);
  return `<figure class="portrait-card portrait-${size}" style="--accent:${spec.accent || '#f0b132'}">
    ${svg}
    <figcaption><b>${character.name}</b><span>${character.role}</span></figcaption>
  </figure>`;
}
