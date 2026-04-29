import PptxGenJS from 'pptxgenjs';
import { Presentation, Slide } from '@/types/presentation';
import { supabase } from '@/integrations/supabase/client';

async function convertImageToDataUrl(imageUrl: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke('proxy-image', {
      body: { url: imageUrl },
    });

    if (error || !data?.dataUrl) {
      console.warn('Failed to proxy image:', imageUrl, error);
      return null;
    }

    return data.dataUrl;
  } catch (e) {
    console.warn('Error converting image:', e);
    return null;
  }
}

export async function exportToPptx(presentation: Presentation) {
  const pptx = new PptxGenJS();

  pptx.author = 'SlideAI';
  pptx.title = presentation.title;
  pptx.subject = presentation.description || '';

  const slidesWithImages: Array<{ slide: Slide; imageDataUrl: string | null }> = await Promise.all(
    presentation.slides.map(async (slide) => ({
      slide,
      imageDataUrl: slide.imageUrl ? await convertImageToDataUrl(slide.imageUrl) : null,
    }))
  );

  for (const { slide, imageDataUrl } of slidesWithImages) {
    const pptxSlide = pptx.addSlide();

    pptxSlide.background = { color: '1e1e1e' };

    if (slide.layout === 'title') {
      pptxSlide.addText(slide.title, {
        x: 0.5,
        y: '40%',
        w: '90%',
        h: 1.5,
        fontSize: 44,
        bold: true,
        color: 'FFFFFF',
        align: 'center',
        fontFace: 'Arial',
      });

      if (slide.subtitle) {
        pptxSlide.addText(slide.subtitle, {
          x: 0.5,
          y: '55%',
          w: '90%',
          h: 0.8,
          fontSize: 24,
          color: 'CCCCCC',
          align: 'center',
          fontFace: 'Arial',
        });
      }

      if (imageDataUrl) {
        try {
          pptxSlide.addImage({
            data: imageDataUrl,
            x: 0,
            y: 0,
            w: '100%',
            h: '100%',
            sizing: { type: 'cover', w: '100%', h: '100%' },
            transparency: 70,
          });
        } catch (e) {
          console.warn('Failed to add image:', e);
        }
      }
    } else if (slide.layout === 'content') {
      pptxSlide.addText(slide.title, {
        x: 0.5,
        y: 0.5,
        w: '90%',
        h: 0.8,
        fontSize: 32,
        bold: true,
        color: 'FFFFFF',
        fontFace: 'Arial',
      });

      if (slide.content) {
        pptxSlide.addText(slide.content, {
          x: 0.5,
          y: 1.5,
          w: '90%',
          h: 1,
          fontSize: 18,
          color: 'DDDDDD',
          fontFace: 'Arial',
        });
      }

      if (slide.bulletPoints && slide.bulletPoints.length > 0) {
        const bulletText = slide.bulletPoints.map(bp => ({
          text: bp,
          options: { bullet: true, color: 'DDDDDD', fontSize: 18 },
        }));

        pptxSlide.addText(bulletText, {
          x: 0.8,
          y: slide.content ? 2.7 : 1.5,
          w: 8.5,
          h: 4,
          fontFace: 'Arial',
        });
      }
    } else if (slide.layout === 'image-left' || slide.layout === 'image-right') {
      const imageOnLeft = slide.layout === 'image-left';
      const textX = imageOnLeft ? 5.5 : 0.5;
      const imageX = imageOnLeft ? 0.2 : 5.5;

      if (imageDataUrl) {
        try {
          pptxSlide.addImage({
            data: imageDataUrl,
            x: imageX,
            y: 0.5,
            w: 4.5,
            h: 5,
            sizing: { type: 'cover', w: 4.5, h: 5 },
          });
        } catch (e) {
          console.warn('Failed to add image:', e);
        }
      }

      pptxSlide.addText(slide.title, {
        x: textX,
        y: 1,
        w: 4.5,
        h: 0.7,
        fontSize: 28,
        bold: true,
        color: 'FFFFFF',
        fontFace: 'Arial',
      });

      if (slide.bulletPoints && slide.bulletPoints.length > 0) {
        const bulletText = slide.bulletPoints.map(bp => ({
          text: bp,
          options: { bullet: true, color: 'DDDDDD', fontSize: 16 },
        }));

        pptxSlide.addText(bulletText, {
          x: textX,
          y: 2,
          w: 4.2,
          h: 3.5,
          fontFace: 'Arial',
        });
      }
    } else if (slide.layout === 'full-image') {
      if (imageDataUrl) {
        try {
          pptxSlide.addImage({
            data: imageDataUrl,
            x: 0,
            y: 0,
            w: '100%',
            h: '100%',
            sizing: { type: 'cover', w: '100%', h: '100%' },
          });
        } catch (e) {
          console.warn('Failed to add image:', e);
        }
      }

      pptxSlide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 4.5,
        w: '100%',
        h: 2,
        fill: { color: '000000', transparency: 30 },
      });

      pptxSlide.addText(slide.title, {
        x: 0.5,
        y: 4.8,
        w: '90%',
        h: 0.7,
        fontSize: 32,
        bold: true,
        color: 'FFFFFF',
        fontFace: 'Arial',
      });

      if (slide.subtitle) {
        pptxSlide.addText(slide.subtitle, {
          x: 0.5,
          y: 5.6,
          w: '90%',
          h: 0.5,
          fontSize: 20,
          color: 'DDDDDD',
          fontFace: 'Arial',
        });
      }
    }
  }

  const fileName = `${presentation.title.replace(/[^a-z0-9]/gi, '_')}.pptx`;
  await pptx.writeFile({ fileName });
}
