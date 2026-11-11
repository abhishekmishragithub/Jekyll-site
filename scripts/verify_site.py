"""Verify generated pages, local links, metadata, and publishing boundaries."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import json
import sys
import xml.etree.ElementTree as ET

root = Path(sys.argv[1] if len(sys.argv) > 1 else '_site').resolve()
base = sys.argv[2].rstrip('/') if len(sys.argv) > 2 else ''
errors = []

class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.path, self.links, self.ids, self.headings, self.canonicals = path, [], set(), 0, []
        self.title, self.lang, self.description = False, False, False
        self.feed(path.read_text())
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get('id'):
            if a['id'] in self.ids: errors.append(f'{self.path}: duplicate id {a["id"]}')
            self.ids.add(a['id'])
        if tag == 'html': self.lang = bool(a.get('lang'))
        if tag == 'title': self.title = True
        if tag == 'h1': self.headings += 1
        if tag == 'meta' and a.get('name') == 'description': self.description = bool(a.get('content'))
        if tag == 'link' and a.get('rel') == 'canonical': self.canonicals.append(a.get('href', ''))
        if tag in ('a', 'link') and a.get('href'): self.links.append(a['href'])
        if tag in ('img', 'script') and a.get('src'): self.links.append(a['src'])
        if tag == 'img' and 'alt' not in a: errors.append(f'{self.path}: image has no alt text')

pages = {p.resolve(): Page(p) for p in root.rglob('*.html')}
for path, page in pages.items():
    if not (page.lang and page.title and page.description): errors.append(f'{path}: missing metadata')
    if page.headings != 1: errors.append(f'{path}: expected one h1, got {page.headings}')
    if len(page.canonicals) != 1 or not page.canonicals[0].startswith('https://abhishekmishra.dev/'):
        errors.append(f'{path}: invalid canonical URL')
    for link in page.links:
        u = urlsplit(link)
        if u.scheme or u.netloc: continue
        raw = unquote(u.path)
        if base and raw.startswith(base + '/'): raw = raw[len(base):]
        target = (root / raw.lstrip('/')) if raw.startswith('/') else (path.parent / raw if raw else path)
        if target.is_dir(): target /= 'index.html'
        target = target.resolve()
        if not target.exists(): errors.append(f'{path.relative_to(root)}: missing {link}')
        elif u.fragment and target in pages and unquote(u.fragment) not in pages[target].ids:
            errors.append(f'{path.relative_to(root)}: missing fragment {link}')

expected = ['index.html', 'about/index.html', 'archive/index.html', 'resume/index.html', '404.html',
            'how-to-buy-health-insurance/index.html',
            'deploying-fastapi-python-application-with-yugabyteDB-to-heroku/index.html',
            'moving-a-python-application-to-a-distributed-database-in-three-easy-steps/index.html',
            'Abhishek_Mishra_resume_v2.pdf', 'keybase.txt']
for name in expected:
    if not (root / name).is_file(): errors.append(f'Missing preserved route: {name}')
for name in ['docs', 'scripts', 'tests', 'vendor', '.git', '.bundle', '.openai', 'Gemfile.lock', 'Gemfile', 'netlify.toml']:
    if (root / name).exists(): errors.append(f'Build leaks development file: {name}')
for name in ['feed.xml', 'sitemap.xml']:
    tree = ET.parse(root / name)
    for element in tree.iter():
        if element.text and 'https:/dev.to/' in element.text and 'https://dev.to/' not in element.text:
            errors.append(f'{name}: malformed external URL')
if not (root / 'Abhishek_Mishra_resume_v2.pdf').read_bytes().startswith(b'%PDF'):
    errors.append('Legacy résumé URL is not a PDF')
if 'BEGIN PGP MESSAGE' not in (root / 'keybase.txt').read_text(): errors.append('Keybase proof missing')
work = json.loads(Path('_data/work.json').read_text())
archive = (root / 'archive/index.html').read_text()
for item in work:
    if item['url'] not in archive: errors.append(f'Index lost {item["id"]}')
if errors:
    print('\n'.join(errors))
    sys.exit(1)
print(f'PASS: {len(pages)} HTML pages, {len(work)} index entries, local links/anchors, metadata, feed, sitemap, legacy routes, and publishing exclusions')
