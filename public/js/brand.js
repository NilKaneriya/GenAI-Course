// Brand mark SVG (shared by the app shell and the login page).
export function brandMark(size = 34) {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 40 40'); svg.setAttribute('width', size); svg.setAttribute('height', size); svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = '<rect x="2" y="2" width="36" height="36" rx="11" fill="var(--primary)"/><path d="M12 26c3-9 5-13 8-13s5 4 8 13" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><circle cx="12" cy="26" r="2.6" fill="var(--accent)"/><circle cx="20" cy="13" r="2.6" fill="#fff"/><circle cx="28" cy="26" r="2.6" fill="var(--gold)"/>';
  return svg;
}
