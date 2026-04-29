import { Slide } from '@/types/slide';

interface SlideRendererProps {
  slide: Slide;
  className?: string;
}

export function SlideRenderer({ slide, className = '' }: SlideRendererProps) {
  return (
    <div className={`relative w-full aspect-video bg-slide-bg text-slide-fg overflow-hidden rounded-lg flex items-center justify-center ${className}`}>
      <div className="w-full h-full">
        {slide.layout === 'title' && <TitleLayout slide={slide} />}
        {slide.layout === 'content' && <ContentLayout slide={slide} />}
        {slide.layout === 'image-left' && <ImageTextLayout slide={slide} imageFirst />}
        {slide.layout === 'image-right' && <ImageTextLayout slide={slide} />}
        {slide.layout === 'full-image' && <FullImageLayout slide={slide} />}
      </div>
    </div>
  );
}

function TitleLayout({ slide }: { slide: Slide }) {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {slide.imageUrl && (
        <img
          src={slide.imageUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-30"
          loading="lazy"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-br from-slide-bg/90 via-slide-bg/70 to-transparent" />
      <div className="relative z-10 text-center px-[8%]">
        <h1 className="text-[2.5em] font-display font-bold leading-tight mb-2">{slide.title}</h1>
        {slide.subtitle && (
          <p className="text-[1.1em] opacity-70">{slide.subtitle}</p>
        )}
      </div>
    </div>
  );
}

function ContentLayout({ slide }: { slide: Slide }) {
  return (
    <div className="w-full h-full flex flex-col p-[6%]">
      <h2 className="text-[1.8em] font-display font-bold mb-[3%] pb-[2%] border-b border-slide-fg/10">
        {slide.title}
      </h2>
      {slide.content && <p className="text-[0.9em] opacity-80 mb-[2%]">{slide.content}</p>}
      {(slide.bulletPoints ?? []).length > 0 && (
  <ul className="space-y-[1.5%] flex-1">
    {(slide.bulletPoints ?? []).map((bp, i) => (
            <li key={i} className="flex items-start gap-[1.5%] text-[0.85em]">
              <span className="w-[0.5em] h-[0.5em] rounded-full bg-primary shrink-0 mt-[0.4em]" />
              <span className="opacity-85">{bp}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ImageTextLayout({ slide, imageFirst }: { slide: Slide; imageFirst?: boolean }) {
  const imgBlock = slide.imageUrl ? (
    <div className="w-1/2 h-full relative">
      <img src={slide.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
      <div className="absolute inset-0 bg-gradient-to-r from-slide-bg/30 to-transparent" />
    </div>
  ) : (
    <div className="w-1/2 h-full bg-primary/10" />
  );

  const textBlock = (
    <div className="w-1/2 h-full flex flex-col justify-center p-[5%]">
      <h2 className="text-[1.5em] font-display font-bold mb-[3%]">{slide.title}</h2>
      {slide.bulletPoints && (
        <ul className="space-y-[2%]">
          {slide.bulletPoints.map((bp, i) => (
            <li key={i} className="flex items-start gap-[2%] text-[0.75em]">
              <span className="w-[0.5em] h-[0.5em] rounded-full bg-primary shrink-0 mt-[0.35em]" />
              <span className="opacity-85">{bp}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="w-full h-full flex">
      {imageFirst ? imgBlock : textBlock}
      {imageFirst ? textBlock : imgBlock}
    </div>
  );
}

function FullImageLayout({ slide }: { slide: Slide }) {
  return (
    <div className="relative w-full h-full">
      {slide.imageUrl && (
        <img src={slide.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-slide-bg/80 via-transparent to-transparent" />
      <div className="absolute bottom-[6%] left-[6%] right-[6%]">
        <h2 className="text-[1.8em] font-display font-bold">{slide.title}</h2>
        {slide.subtitle && <p className="text-[1em] opacity-70">{slide.subtitle}</p>}
      </div>
    </div>
  );
}
