import JSZip from 'jszip';
import { Presentation, Slide, SlideElement } from '@/types/slide';

const EMU_PER_PX = 9525;

function emuToPx(emu: number): number {
  return Math.round(emu / EMU_PER_PX);
}

function parseColor(colorNode: Element | null): string {
  if (!colorNode) return '#333333';
  const srgb = colorNode.querySelector('a\\:srgbClr, srgbClr');
  if (srgb) return '#' + srgb.getAttribute('val');
  return '#333333';
}

function parseFontSize(rPr: Element | null): number {
  if (!rPr) return 24;
  const sz = rPr.getAttribute('sz');
  if (sz) return Math.round(parseInt(sz) / 100);
  return 24;
}

async function loadSlideRels(zip: JSZip, slideIndex: number): Promise<Map<string, string>> {
  const relsMap = new Map<string, string>();
  const relsPath = `ppt/slides/_rels/slide${slideIndex + 1}.xml.rels`;
  const relsFile = zip.file(relsPath);
  if (!relsFile) return relsMap;

  const relsXml = await relsFile.async('text');
  const parser = new DOMParser();
  const doc = parser.parseFromString(relsXml, 'application/xml');
  const rels = doc.querySelectorAll('Relationship');

  rels.forEach((rel) => {
    const id = rel.getAttribute('Id') || '';
    const target = rel.getAttribute('Target') || '';
    relsMap.set(id, target);
  });

  return relsMap;
}

async function resolveImageToBase64(zip: JSZip, relTarget: string): Promise<string | null> {
  const normalizedPath = relTarget.replace(/^\.\.\//, 'ppt/');
  const file = zip.file(normalizedPath);
  if (!file) return null;

  const blob = await file.async('blob');
  const ext = normalizedPath.split('.').pop()?.toLowerCase() || 'png';
  const mimeMap: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    bmp: 'image/bmp',
    svg: 'image/svg+xml',
    webp: 'image/webp',
    tif: 'image/tiff',
    tiff: 'image/tiff',
    emf: 'image/emf',
    wmf: 'image/wmf',
  };
  const mime = mimeMap[ext] || 'image/png';

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(new Blob([blob], { type: mime }));
  });
}

async function parseSlideDimensions(zip: JSZip): Promise<{ width: number; height: number }> {
  const presFile = zip.file('ppt/presentation.xml');
  if (!presFile) return { width: 960, height: 540 };

  const xml = await presFile.async('text');
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'application/xml');

  const sldSz = doc.querySelector('p\\:sldSz, sldSz');
  if (sldSz) {
    const cx = parseInt(sldSz.getAttribute('cx') || '0');
    const cy = parseInt(sldSz.getAttribute('cy') || '0');
    if (cx > 0 && cy > 0) {
      return { width: emuToPx(cx), height: emuToPx(cy) };
    }
  }

  return { width: 960, height: 540 };
}

async function parseSlideXml(
  xml: string,
  zip: JSZip,
  slideIndex: number
): Promise<Slide> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'application/xml');
  const elements: SlideElement[] = [];
  const rels = await loadSlideRels(zip, slideIndex);

  let background = '#ffffff';
  const bgFill = doc.querySelector('p\\:bg a\\:srgbClr, bg srgbClr');
  if (bgFill) {
    background = '#' + bgFill.getAttribute('val');
  }

  const spTree = doc.querySelectorAll('p\\:sp, sp');

  spTree.forEach((sp) => {
    const off = sp.querySelector('a\\:off, off');
    const ext = sp.querySelector('a\\:ext, ext');

    const x = off ? emuToPx(parseInt(off.getAttribute('x') || '0')) : 100;
    const y = off ? emuToPx(parseInt(off.getAttribute('y') || '0')) : 100;
    const width = ext ? emuToPx(parseInt(ext.getAttribute('cx') || '3000000')) : 400;
    const height = ext ? emuToPx(parseInt(ext.getAttribute('cy') || '500000')) : 60;

    const textParts: string[] = [];
    let fontSize = 24;
    let color = '#333333';
    let fontWeight = 'normal';
    let textAlign: 'left' | 'center' | 'right' = 'left';

    const paragraphs = sp.querySelectorAll('a\\:p, p');
    paragraphs.forEach((p) => {
      const pPr = p.querySelector('a\\:pPr, pPr');
      const algn = pPr?.getAttribute('algn');
      if (algn === 'ctr') textAlign = 'center';
      else if (algn === 'r') textAlign = 'right';

      const runs = p.querySelectorAll('a\\:r, r');
      runs.forEach((r) => {
        const t = r.querySelector('a\\:t, t');
        if (t?.textContent) textParts.push(t.textContent);

        const rPr = r.querySelector('a\\:rPr, rPr');
        if (rPr) {
          fontSize = parseFontSize(rPr);
          const solidFill = rPr.querySelector('a\\:solidFill, solidFill');
          if (solidFill) color = parseColor(solidFill);
          if (rPr.getAttribute('b') === '1') fontWeight = 'bold';
        }
      });
    });

    const content = textParts.join('');
    if (!content) return;

    const element: SlideElement = {
      id: crypto.randomUUID(),
      type: 'text',
      x,
      y,
      width: Math.max(width, 50),
      height: Math.max(height, 30),
      rotation: 0,
      content,
      fontSize,
      fontFamily: 'Arial',
      fontWeight,
      fontStyle: 'normal',
      textAlign,
      color,
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      borderWidth: 0,
      opacity: 1,
    };

    elements.push(element);
  });

  const pics = doc.querySelectorAll('p\\:pic, pic');
  for (const pic of Array.from(pics)) {
    const off = pic.querySelector('a\\:off, off');
    const ext = pic.querySelector('a\\:ext, ext');

    const x = off ? emuToPx(parseInt(off.getAttribute('x') || '0')) : 100;
    const y = off ? emuToPx(parseInt(off.getAttribute('y') || '0')) : 100;
    const width = ext ? emuToPx(parseInt(ext.getAttribute('cx') || '3000000')) : 400;
    const height = ext ? emuToPx(parseInt(ext.getAttribute('cy') || '3000000')) : 300;

    const blipFill = pic.querySelector('p\\:blipFill a\\:blip, blipFill blip');
    if (!blipFill) continue;

    const embedId = blipFill.getAttribute('r:embed') || blipFill.getAttribute('embed');
    if (!embedId) continue;

    const relTarget = rels.get(embedId);
    if (!relTarget) continue;

    const imageUrl = await resolveImageToBase64(zip, relTarget);
    if (!imageUrl) continue;

    elements.push({
      id: crypto.randomUUID(),
      type: 'image',
      x,
      y,
      width: Math.max(width, 50),
      height: Math.max(height, 50),
      rotation: 0,
      content: '',
      fontSize: 24,
      fontFamily: 'Arial',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'left',
      color: '#333333',
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      borderWidth: 0,
      opacity: 1,
      imageUrl,
    });
  }

  return {
    id: crypto.randomUUID(),
    elements,
    background,
  };
}

export async function parsePptxFile(file: File): Promise<Presentation> {
  const zip = await JSZip.loadAsync(file);
  const slides: Slide[] = [];

  const dimensions = await parseSlideDimensions(zip);

  const slideFiles: string[] = [];
  zip.forEach((path) => {
    if (path.match(/ppt\/slides\/slide\d+\.xml$/)) {
      slideFiles.push(path);
    }
  });

  slideFiles.sort((a, b) => {
    const numA = parseInt(a.match(/slide(\d+)/)?.[1] || '0');
    const numB = parseInt(b.match(/slide(\d+)/)?.[1] || '0');
    return numA - numB;
  });

  for (let i = 0; i < slideFiles.length; i++) {
    const content = await zip.file(slideFiles[i])?.async('text');
    if (content) {
      const slide = await parseSlideXml(content, zip, i);
      slides.push(slide);
    }
  }

  if (slides.length === 0) {
    slides.push({
      id: crypto.randomUUID(),
      elements: [],
      background: '#ffffff',
    });
  }

  const title = file.name.replace(/\.pptx?$/i, '');

  return {
    title,
    slides,
    width: dimensions.width,
    height: dimensions.height,
  };
}