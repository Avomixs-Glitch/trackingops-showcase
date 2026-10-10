import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const docsDir = join(root, 'docs', 'architecture');
const assetsDir = join(root, 'assets');
mkdirSync(docsDir, { recursive: true });

let seed = 100;
const base = (id, type, x, y, width, height, extra = {}) => ({
  id, type, x, y, width, height, angle: 0,
  strokeColor: '#8b7cff', backgroundColor: '#171929', fillStyle: 'solid',
  strokeWidth: 2, strokeStyle: 'solid', roughness: 0, opacity: 100,
  groupIds: [], frameId: null, roundness: type === 'ellipse' ? { type: 2 } : { type: 3 },
  seed: seed++, version: 1, versionNonce: seed++, isDeleted: false,
  boundElements: null, updated: 1, link: null, locked: false, ...extra,
});

function shape(def) {
  const height = def.h ?? 96;
  const width = def.w ?? 220;
  const textHeight = def.subtitle ? 46 : 24;
  const shapeElement = base(def.id, def.type ?? 'rectangle', def.x, def.y, width, height, {
    strokeColor: def.stroke ?? '#8b7cff', backgroundColor: def.fill ?? '#171929',
    strokeWidth: def.strokeWidth ?? 2,
    boundElements: [{ type: 'text', id: `${def.id}-text` }],
  });
  const label = def.subtitle ? `${def.title}\n${def.subtitle}` : def.title;
  const textElement = base(`${def.id}-text`, 'text', def.x + 8, def.y + (height - textHeight) / 2, width - 16, textHeight, {
    strokeColor: def.text ?? '#f7f7fb', backgroundColor: 'transparent', strokeWidth: 1,
    roundness: null, boundElements: null, text: label, fontSize: def.fontSize ?? 17,
    fontFamily: 1, textAlign: 'center', verticalAlign: 'middle', baseline: 18,
    containerId: def.id, originalText: label, lineHeight: 1.25,
  });
  return [shapeElement, textElement];
}

function arrow(id, source, target, color = '#62667a', label = null) {
  const sx = source.x + source.w;
  const sy = source.y + source.h / 2;
  const tx = target.x;
  const ty = target.y + target.h / 2;
  const dx = tx - sx;
  const dy = ty - sy;
  const points = Math.abs(dy) < 4 ? [[0, 0], [dx, 0]] : [[0, 0], [dx / 2, 0], [dx / 2, dy], [dx, dy]];
  const element = base(id, 'arrow', sx, sy, Math.max(...points.map(([x]) => Math.abs(x))), Math.max(...points.map(([, y]) => Math.abs(y))), {
    strokeColor: color, backgroundColor: 'transparent', roundness: null,
    boundElements: null, points, lastCommittedPoint: null,
    startBinding: { elementId: source.id, focus: 0, gap: 1, fixedPoint: [1, 0.5] },
    endBinding: { elementId: target.id, focus: 0, gap: 1, fixedPoint: [0, 0.5] },
    startArrowhead: null, endArrowhead: 'arrow', elbowed: true,
  });
  const labelElement = label ? base(`${id}-label`, 'text', sx + dx / 2 - 45, sy + dy / 2 - 24, 90, 20, {
    strokeColor: '#9ca0b3', backgroundColor: '#0b0d14', roundness: null,
    boundElements: null, text: label, fontSize: 12, fontFamily: 1,
    textAlign: 'center', verticalAlign: 'middle', baseline: 12,
    containerId: null, originalText: label, lineHeight: 1.25,
  }) : null;
  return labelElement ? [element, labelElement] : [element];
}

function verticalArrow(id, source, target, color = '#62667a', label = null) {
  const sx = source.x + source.w / 2;
  const sy = source.y + source.h;
  const tx = target.x + target.w / 2;
  const ty = target.y;
  const dx = tx - sx;
  const dy = ty - sy;
  const points = Math.abs(dx) < 4 ? [[0, 0], [0, dy]] : [[0, 0], [0, dy / 2], [dx, dy / 2], [dx, dy]];
  const element = base(id, 'arrow', sx, sy, Math.max(...points.map(([x]) => Math.abs(x))), Math.max(...points.map(([, y]) => Math.abs(y))), {
    strokeColor: color, backgroundColor: 'transparent', roundness: null,
    boundElements: null, points, lastCommittedPoint: null,
    startBinding: { elementId: source.id, focus: 0, gap: 1, fixedPoint: [0.5, 1] },
    endBinding: { elementId: target.id, focus: 0, gap: 1, fixedPoint: [0.5, 0] },
    startArrowhead: null, endArrowhead: 'arrow', elbowed: true,
  });
  const labelElement = label ? base(`${id}-label`, 'text', sx + dx / 2 + 12, sy + dy / 2 - 10, 120, 20, {
    strokeColor: '#9ca0b3', backgroundColor: '#0b0d14', roundness: null,
    boundElements: null, text: label, fontSize: 12, fontFamily: 1,
    textAlign: 'left', verticalAlign: 'middle', baseline: 12,
    containerId: null, originalText: label, lineHeight: 1.25,
  }) : null;
  return labelElement ? [element, labelElement] : [element];
}

function title(id, text, subtitle) {
  return [
    base(id, 'text', 60, 42, 1100, 42, {
      strokeColor: '#f7f7fb', backgroundColor: 'transparent', roundness: null,
      boundElements: null, text, fontSize: 32, fontFamily: 1, textAlign: 'left',
      verticalAlign: 'top', baseline: 31, containerId: null, originalText: text, lineHeight: 1.2,
    }),
    base(`${id}-subtitle`, 'text', 60, 92, 1100, 24, {
      strokeColor: '#8e93a7', backgroundColor: 'transparent', roundness: null,
      boundElements: null, text: subtitle, fontSize: 15, fontFamily: 1, textAlign: 'left',
      verticalAlign: 'top', baseline: 15, containerId: null, originalText: subtitle, lineHeight: 1.25,
    }),
  ];
}

function diagram(elements) {
  const byId = new Map(elements.map((element) => [element.id, element]));
  for (const element of elements.filter((item) => item.type === 'arrow')) {
    for (const binding of [element.startBinding, element.endBinding]) {
      const attached = byId.get(binding?.elementId);
      if (attached) attached.boundElements.push({ type: 'arrow', id: element.id });
    }
  }
  return {
    type: 'excalidraw', version: 2, source: 'trackingops-showcase', elements,
    appState: { gridSize: 20, viewBackgroundColor: '#0b0d14' }, files: {},
  };
}

const architectureNodes = {
  operator: { id: 'operator', type: 'ellipse', x: 60, y: 315, w: 180, h: 90, title: 'Operator', subtitle: 'Human in control', fill: '#111827', stroke: '#38bdf8' },
  workspace: { id: 'workspace', x: 330, y: 300, w: 240, h: 120, title: 'TrackingOps Desktop', subtitle: 'React + TypeScript workspace', fill: '#17152c', stroke: '#8b7cff', strokeWidth: 3 },
  bridge: { id: 'bridge', x: 660, y: 300, w: 240, h: 120, title: 'Isolated Desktop Bridge', subtitle: 'Typed Electron capabilities', fill: '#21162c', stroke: '#c084fc' },
  host: { id: 'host', x: 1020, y: 145, w: 250, h: 96, title: 'Windows Host', subtitle: 'Live machine telemetry', fill: '#10232a', stroke: '#22d3ee' },
  docker: { id: 'docker', x: 1020, y: 310, w: 250, h: 96, title: 'Docker & Local Services', subtitle: 'Workloads, logs and lifecycle', fill: '#10232a', stroke: '#22d3ee' },
  security: { id: 'security', x: 1020, y: 475, w: 250, h: 96, title: 'Security Surfaces', subtitle: 'Posture, scans and network', fill: '#2b171d', stroke: '#fb7185' },
  control: { id: 'control', x: 330, y: 600, w: 240, h: 110, title: 'Authenticated Control Plane', subtitle: 'Organization-scoped APIs', fill: '#17152c', stroke: '#8b7cff' },
  data: { id: 'data', x: 700, y: 570, w: 220, h: 96, title: 'Operational Data', subtitle: 'Metrics, alerts and history', fill: '#10251b', stroke: '#4ade80' },
  ai: { id: 'ai', x: 700, y: 700, w: 220, h: 96, title: 'AI Intelligence', subtitle: 'Grounded investigation', fill: '#25152c', stroke: '#e879f9' },
};

const architectureElements = [
  ...title('architecture-title', 'TrackingOps system architecture', 'Local truth, authenticated context and grounded intelligence — kept inside one operator-controlled surface.'),
  ...Object.values(architectureNodes).flatMap(shape),
  ...arrow('a-operator-workspace', architectureNodes.operator, architectureNodes.workspace, '#38bdf8', 'interacts'),
  ...arrow('a-workspace-bridge', architectureNodes.workspace, architectureNodes.bridge, '#8b7cff', 'typed IPC'),
  ...verticalArrow('a-workspace-control', architectureNodes.workspace, architectureNodes.control, '#8b7cff', 'authenticated API'),
  ...arrow('a-bridge-host', architectureNodes.bridge, architectureNodes.host, '#22d3ee', 'reads'),
  ...arrow('a-bridge-docker', architectureNodes.bridge, architectureNodes.docker, '#22d3ee', 'operates'),
  ...arrow('a-bridge-security', architectureNodes.bridge, architectureNodes.security, '#fb7185', 'checks'),
  ...arrow('a-control-data', architectureNodes.control, architectureNodes.data, '#4ade80', 'stores'),
  ...arrow('a-control-ai', architectureNodes.control, architectureNodes.ai, '#e879f9', 'grounds'),
];

const flowNodes = {
  signal: { id: 'signal', type: 'ellipse', x: 60, y: 245, w: 170, h: 90, title: 'Signal', subtitle: 'Something changed', fill: '#10232a', stroke: '#22d3ee' },
  observe: { id: 'observe', x: 300, y: 230, w: 190, h: 120, title: 'Observe', subtitle: 'Live telemetry\n+ system context', fill: '#10232a', stroke: '#22d3ee' },
  correlate: { id: 'correlate', x: 560, y: 230, w: 190, h: 120, title: 'Correlate', subtitle: 'History, alerts\n+ security posture', fill: '#17152c', stroke: '#8b7cff' },
  copilot: { id: 'copilot', x: 820, y: 230, w: 210, h: 120, title: 'AI KILLING', subtitle: 'Selected context\n+ live tool output', fill: '#25152c', stroke: '#e879f9', strokeWidth: 3 },
  decision: { id: 'decision', x: 1100, y: 230, w: 200, h: 120, title: 'Operator Decision', subtitle: 'Review evidence\n+ choose next step', fill: '#2b2112', stroke: '#fbbf24' },
  response: { id: 'response', x: 1370, y: 230, w: 210, h: 120, title: 'Controlled Response', subtitle: 'Runbook, remediation\n+ or documented handoff', fill: '#10251b', stroke: '#4ade80' },
};

const flowElements = [
  ...title('flow-title', 'From signal to controlled response', 'AI accelerates the investigation. Evidence stays visible. The operator keeps the final decision.'),
  ...Object.values(flowNodes).flatMap(shape),
  ...arrow('f-signal-observe', flowNodes.signal, flowNodes.observe, '#22d3ee'),
  ...arrow('f-observe-correlate', flowNodes.observe, flowNodes.correlate, '#8b7cff'),
  ...arrow('f-correlate-copilot', flowNodes.correlate, flowNodes.copilot, '#e879f9', 'context'),
  ...arrow('f-copilot-decision', flowNodes.copilot, flowNodes.decision, '#fbbf24', 'evidence'),
  ...arrow('f-decision-response', flowNodes.decision, flowNodes.response, '#4ade80', 'authorize'),
];

writeFileSync(join(docsDir, 'trackingops-system-architecture.excalidraw'), `${JSON.stringify(diagram(architectureElements), null, 2)}\n`);
writeFileSync(join(docsDir, 'ai-investigation-flow.excalidraw'), `${JSON.stringify(diagram(flowElements), null, 2)}\n`);

const escapeXml = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

function svgCard({ x, y, w, h, title: heading, subtitle, accent, fill = '#121521', radius = 18, ellipse = false }) {
  const tag = ellipse ? `<ellipse cx="${x + w / 2}" cy="${y + h / 2}" rx="${w / 2}" ry="${h / 2}"` : `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}"`;
  return `${tag} fill="${fill}" stroke="${accent}" stroke-width="2"/>\n<text x="${x + w / 2}" y="${y + h / 2 - 8}" text-anchor="middle" class="card-title">${escapeXml(heading)}</text>\n<text x="${x + w / 2}" y="${y + h / 2 + 20}" text-anchor="middle" class="card-sub">${escapeXml(subtitle)}</text>`;
}

const svgStyle = `<style>.title{font:700 31px Inter,Segoe UI,sans-serif;fill:#f7f7fb}.subtitle{font:400 15px Inter,Segoe UI,sans-serif;fill:#8e93a7}.card-title{font:700 16px Inter,Segoe UI,sans-serif;fill:#f7f7fb}.card-sub{font:400 12px Inter,Segoe UI,sans-serif;fill:#9ca0b3}.edge-label{font:600 11px Inter,Segoe UI,sans-serif;fill:#777c90}.kicker{font:700 11px Inter,Segoe UI,sans-serif;fill:#a99fff;letter-spacing:2px}</style>`;
const marker = `<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#111323"/><stop offset="1" stop-color="#080a10"/></linearGradient><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#64687b"/></marker><filter id="glow"><feGaussianBlur stdDeviation="18"/></filter></defs>`;
const line = (x1, y1, x2, y2, color = '#64687b') => `<path d="M${x1} ${y1} H${(x1 + x2) / 2} V${y2} H${x2}" fill="none" stroke="${color}" stroke-width="2" marker-end="url(#arrow)"/>`;

const architectureSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="900" viewBox="0 0 1400 900" role="img" aria-labelledby="title desc"><title id="title">TrackingOps system architecture</title><desc id="desc">Architecture connecting the operator, desktop workspace, isolated bridge, Windows host, Docker, security, control plane, operational data and AI intelligence.</desc>${marker}${svgStyle}<rect width="1400" height="900" rx="28" fill="url(#bg)"/><circle cx="1130" cy="130" r="180" fill="#6d5cff" opacity=".08" filter="url(#glow)"/><text x="60" y="62" class="kicker">SYSTEM BLUEPRINT</text><text x="60" y="108" class="title">Local truth. Connected context. Grounded intelligence.</text><text x="60" y="140" class="subtitle">TrackingOps keeps the operator at the center while joining Windows telemetry, local services and authenticated workflows.</text>${line(240,360,330,360,'#38bdf8')}${line(570,360,660,360,'#8b7cff')}<line x1="450" y1="420" x2="450" y2="605" stroke="#8b7cff" stroke-width="2" marker-end="url(#arrow)"/><text x="466" y="520" class="edge-label">authenticated API</text>${line(900,360,1020,193,'#22d3ee')}${line(900,360,1020,358,'#22d3ee')}${line(900,360,1020,523,'#fb7185')}${line(570,660,700,618,'#4ade80')}${line(570,660,700,748,'#e879f9')}${svgCard({x:60,y:315,w:180,h:90,title:'Operator',subtitle:'Human in control',accent:'#38bdf8',fill:'#111827',ellipse:true})}${svgCard({x:330,y:300,w:240,h:120,title:'TrackingOps Desktop',subtitle:'React + TypeScript workspace',accent:'#8b7cff',fill:'#17152c'})}${svgCard({x:660,y:300,w:240,h:120,title:'Isolated Desktop Bridge',subtitle:'Typed Electron capabilities',accent:'#c084fc',fill:'#21162c'})}${svgCard({x:1020,y:145,w:250,h:96,title:'Windows Host',subtitle:'Live machine telemetry',accent:'#22d3ee',fill:'#10232a'})}${svgCard({x:1020,y:310,w:250,h:96,title:'Docker & Local Services',subtitle:'Workloads, logs and lifecycle',accent:'#22d3ee',fill:'#10232a'})}${svgCard({x:1020,y:475,w:250,h:96,title:'Security Surfaces',subtitle:'Posture, scans and network',accent:'#fb7185',fill:'#2b171d'})}${svgCard({x:330,y:605,w:240,h:110,title:'Authenticated Control Plane',subtitle:'Organization-scoped APIs',accent:'#8b7cff',fill:'#17152c'})}${svgCard({x:700,y:570,w:220,h:96,title:'Operational Data',subtitle:'Metrics, alerts and history',accent:'#4ade80',fill:'#10251b'})}${svgCard({x:700,y:700,w:220,h:96,title:'AI Intelligence',subtitle:'Grounded investigation',accent:'#e879f9',fill:'#25152c'})}<text x="60" y="850" class="subtitle">Desktop-first by design · Sensitive actions remain explicit · Source code stays private</text></svg>`;

const flowLine = (x1, y, x2, color) => `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${color}" stroke-width="2" marker-end="url(#arrow)"/>`;
const flowSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1680" height="560" viewBox="0 0 1680 560" role="img" aria-labelledby="title desc"><title id="title">TrackingOps AI investigation flow</title><desc id="desc">A signal becomes observation, correlation, grounded AI assistance, an operator decision and a controlled response.</desc>${marker}${svgStyle}<rect width="1680" height="560" rx="28" fill="url(#bg)"/><circle cx="920" cy="260" r="210" fill="#b56cff" opacity=".07" filter="url(#glow)"/><text x="60" y="62" class="kicker">INVESTIGATION FLOW</text><text x="60" y="108" class="title">From signal to controlled response.</text><text x="60" y="140" class="subtitle">AI accelerates the investigation. Evidence stays visible. The operator keeps the final decision.</text>${flowLine(230,290,300,'#22d3ee')}${flowLine(490,290,560,'#8b7cff')}${flowLine(750,290,820,'#e879f9')}${flowLine(1030,290,1100,'#fbbf24')}${flowLine(1300,290,1370,'#4ade80')}${svgCard({x:60,y:245,w:170,h:90,title:'Signal',subtitle:'Something changed',accent:'#22d3ee',fill:'#10232a',ellipse:true})}${svgCard({x:300,y:230,w:190,h:120,title:'Observe',subtitle:'Live telemetry + context',accent:'#22d3ee',fill:'#10232a'})}${svgCard({x:560,y:230,w:190,h:120,title:'Correlate',subtitle:'History, alerts, posture',accent:'#8b7cff',fill:'#17152c'})}${svgCard({x:820,y:230,w:210,h:120,title:'AI KILLING',subtitle:'Context + live tool output',accent:'#e879f9',fill:'#25152c'})}${svgCard({x:1100,y:230,w:200,h:120,title:'Operator Decision',subtitle:'Review evidence',accent:'#fbbf24',fill:'#2b2112'})}${svgCard({x:1370,y:230,w:210,h:120,title:'Controlled Response',subtitle:'Runbook or handoff',accent:'#4ade80',fill:'#10251b'})}<text x="60" y="505" class="subtitle">Observe → understand → decide → act · No invisible autonomous control</text></svg>`;

writeFileSync(join(assetsDir, 'system-architecture.svg'), architectureSvg);
writeFileSync(join(assetsDir, 'ai-investigation-flow.svg'), flowSvg);

console.log('Generated 2 Excalidraw sources and 2 GitHub-ready SVG previews.');
