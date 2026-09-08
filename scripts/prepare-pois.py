"""Extract genuine POIs (including raw tags) from the bundled OSM snapshots."""
import json
import xml.etree.ElementTree as ET
from pathlib import Path
root = Path(__file__).resolve().parents[1] / 'public' / 'data'
result = {}
for source in [root / 'nagoya.osm', root / 'nagoya-university.osm']:
    tree = ET.parse(source).getroot()
    nodes = {n.attrib['id']: [float(n.attrib['lon']), float(n.attrib['lat'])] for n in tree.findall('node')}
    ways = {w.attrib['id']: [nodes[n.attrib['ref']] for n in w.findall('nd') if n.attrib['ref'] in nodes] for w in tree.findall('way')}
    for e in tree:
        if e.tag not in ['node', 'way', 'relation']:
            continue
        tags = {t.attrib['k']: t.attrib['v'] for t in e.findall('tag')}
        if not any(k in tags for k in ['amenity', 'shop', 'tourism', 'leisure', 'office']) and tags.get('railway') != 'station':
            continue
        coords = [nodes[e.attrib['id']]] if e.tag == 'node' else ways.get(e.attrib['id'], []) if e.tag == 'way' else [p for m in e.findall('member') if m.attrib.get('type') == 'way' for p in ways.get(m.attrib['ref'], [])]
        if not coords:
            continue
        center = {'lon': (min(p[0] for p in coords)+max(p[0] for p in coords))/2, 'lat': (min(p[1] for p in coords)+max(p[1] for p in coords))/2}
        value = {'type': e.tag, 'id': int(e.attrib['id']), 'tags': tags}
        value.update(center if e.tag == 'node' else {'center': center})
        result[f'{e.tag}/{e.attrib["id"]}'] = value
(root / 'pois.osm.json').write_text(json.dumps({'retrievedAt': '2026-09-07T00:00:00.000Z', 'attribution': '© OpenStreetMap contributors, ODbL-1.0', 'elements': list(result.values())}, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
print(f'{len(result)} OSM POIs extracted')
