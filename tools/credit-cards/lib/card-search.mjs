const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[.’']/g, '').toLowerCase().trim();

export function matchesCard(card, query) {
 const aliases = card.issuer === 'American Express' ? 'amex' : '';
 const text = normalize(`${card.name} ${card.issuer} ${card.aliases??''} ${aliases}`);
 return normalize(query).split(/\s+/).every(word => text.includes(word));
}
