import { readdirSync, readFileSync, writeFileSync } from 'fs';

const esc = s => String(s).replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const fill = (tpl, vars) =>
  tpl.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in vars ? vars[k] : m));

let template = readFileSync('template.html', 'utf8');

const grab = id => {
  const re = new RegExp(`<template id="${id}">([\\s\\S]*?)</template>`);
  const match = template.match(re);
  if (!match) throw new Error(`template.html is missing <template id="${id}">`);
  template = template.replace(re, '');
  return match[1];
};

const cardTpl = grab('card');
const emptyTpl = grab('empty');

const games = readdirSync('site', { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => {
    let title = d.name;
    try {
      const pkg = JSON.parse(readFileSync(`src/${d.name}/package.json`, 'utf8'));
      title = pkg.description || pkg.name || d.name;
    } catch {}
    return { slug: d.name, title };
  });

const cards = games.length
  ? games.map((g, i) => fill(cardTpl, {
      SLUG: esc(g.slug),
      TITLE: esc(g.title),
      NUM: String(i + 1).padStart(3, '0'),
    })).join('')
  : emptyTpl;

writeFileSync('site/index.html', fill(template, {
  CARDS: cards,
  COUNT: games.length,
  PLURAL: games.length === 1 ? '' : 'S',
  DATE: new Date().toISOString().slice(0, 10),
}));

console.log(`Slopit: ${games.length} units contained`);
