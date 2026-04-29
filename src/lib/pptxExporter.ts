import JSZip from 'jszip';
import { Presentation } from '@/types/slide';

const PX_TO_EMU = 9525;

function pxToEmu(px: number): number {
  return Math.round(px * PX_TO_EMU);
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function hexToRgb(hex: string): string {
  return hex.replace('#', '').toUpperCase();
}

export async function exportPptx(presentation: Presentation): Promise<Blob> {
  const zip = new JSZip();

  // [Content_Types].xml
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Default Extension="jpeg" ContentType="image/jpeg"/>
  <Default Extension="jpg" ContentType="image/jpeg"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  ${presentation.slides.map((_, i) => `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`).join('\n  ')}
</Types>`;
  zip.file('[Content_Types].xml', contentTypes);

  // _rels/.rels
  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`);

  // ppt/presentation.xml
  const slideRefs = presentation.slides
    .map((_, i) => `<p:sldIdLst><p:sldId id="${256 + i}" r:id="rId${i + 1}"/></p:sldIdLst>`)
    .join('');

  zip.file('ppt/presentation.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst/>
  ${slideRefs}
  <p:sldSz cx="${pxToEmu(presentation.width)}" cy="${pxToEmu(presentation.height)}" type="custom"/>
  <p:notesSz cx="${pxToEmu(presentation.width)}" cy="${pxToEmu(presentation.height)}"/>
</p:presentation>`);

  // ppt/_rels/presentation.xml.rels
  const presRels = presentation.slides
    .map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i + 1}.xml"/>`)
    .join('\n  ');
  zip.file('ppt/_rels/presentation.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${presRels}
</Relationships>`);

  // Generate each slide
  let mediaCounter = 1;

  for (let si = 0; si < presentation.slides.length; si++) {
    const slide = presentation.slides[si];
    const slideRelsEntries: string[] = [];
    let shapeId = 1;

    // Collect image elements and save media
    const imageElements = slide.elements.filter(el => el.type === 'image' && el.imageUrl);
    const imageRelMap = new Map<string, string>();

    for (const imgEl of imageElements) {
      if (!imgEl.imageUrl) continue;
      const relId = `rId${mediaCounter}`;
      let ext = 'png';
      let data: Uint8Array;

      if (imgEl.imageUrl.startsWith('data:')) {
        const match = imgEl.imageUrl.match(/data:image\/(\w+);base64,(.*)/);
        if (match) {
          ext = match[1] === 'jpeg' ? 'jpg' : match[1];
          const binaryStr = atob(match[2]);
          data = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) {
            data[i] = binaryStr.charCodeAt(i);
          }
        } else {
          continue;
        }
      } else {
        continue; // skip blob URLs for export
      }

      const mediaPath = `ppt/media/image${mediaCounter}.${ext}`;
      zip.file(mediaPath, data);
      slideRelsEntries.push(`<Relationship Id="${relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image${mediaCounter}.${ext}"/>`);
      imageRelMap.set(imgEl.id, relId);
      mediaCounter++;
    }

    // Slide rels
    zip.file(`ppt/slides/_rels/slide${si + 1}.xml.rels`, `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${slideRelsEntries.join('\n  ')}
</Relationships>`);

    // Build shapes XML
    const shapesXml = slide.elements.map((el) => {
      shapeId++;
      const off = `<a:off x="${pxToEmu(el.x)}" y="${pxToEmu(el.y)}"/>`;
      const ext = `<a:ext cx="${pxToEmu(el.width)}" cy="${pxToEmu(el.height)}"/>`;
      const xfrm = `<a:xfrm rot="${el.rotation * 60000}">${off}${ext}</a:xfrm>`;

      if (el.type === 'text') {
        const algn = el.textAlign === 'center' ? 'ctr' : el.textAlign === 'right' ? 'r' : 'l';
        const bold = el.fontWeight === 'bold' ? ' b="1"' : '';
        const italic = el.fontStyle === 'italic' ? ' i="1"' : '';
        const fontSize = el.fontSize * 100;
        const colorHex = hexToRgb(el.color);

        return `<p:sp>
  <p:nvSpPr><p:cNvPr id="${shapeId}" name="TextBox ${shapeId}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
  <p:spPr>${xfrm}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>${el.backgroundColor !== 'transparent' ? `<a:solidFill><a:srgbClr val="${hexToRgb(el.backgroundColor)}"/></a:solidFill>` : '<a:noFill/>'}</p:spPr>
  <p:txBody>
    <a:bodyPr wrap="square" rtlCol="0"/>
    <a:lstStyle/>
    <a:p><a:pPr algn="${algn}"/><a:r><a:rPr lang="en-US" sz="${fontSize}"${bold}${italic}><a:solidFill><a:srgbClr val="${colorHex}"/></a:solidFill></a:rPr><a:t>${escapeXml(el.content)}</a:t></a:r></a:p>
  </p:txBody>
</p:sp>`;
      }

      if (el.type === 'image') {
        const relId = imageRelMap.get(el.id);
        if (!relId) return '';
        return `<p:pic>
  <p:nvPicPr><p:cNvPr id="${shapeId}" name="Picture ${shapeId}"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr>
  <p:blipFill><a:blip r:embed="${relId}"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>
  <p:spPr>${xfrm}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>
</p:pic>`;
      }

      if (el.type === 'shape') {
        return `<p:sp>
  <p:nvSpPr><p:cNvPr id="${shapeId}" name="Shape ${shapeId}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
  <p:spPr>${xfrm}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:solidFill><a:srgbClr val="${hexToRgb(el.backgroundColor || '#e0e0e0')}"/></a:solidFill>${el.borderWidth > 0 ? `<a:ln w="${el.borderWidth * 12700}"><a:solidFill><a:srgbClr val="${hexToRgb(el.borderColor)}"/></a:solidFill></a:ln>` : ''}</p:spPr>
</p:sp>`;
      }

      return '';
    }).join('\n');

    // Background
    const bgXml = slide.background !== '#ffffff'
      ? `<p:bg><p:bgPr><a:solidFill><a:srgbClr val="${hexToRgb(slide.background)}"/></a:solidFill><a:effectLst/></p:bgPr></p:bg>`
      : '';

    zip.file(`ppt/slides/slide${si + 1}.xml`, `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>${bgXml}<p:spTree>
    <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
    <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
    ${shapesXml}
  </p:spTree></p:cSld>
</p:sld>`);
  }

  return zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
}