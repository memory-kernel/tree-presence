import { useEffect, useRef } from 'react';

type Props = {
  name: string;
  imageUrl?: string;
};

export function TreeHero({ name, imageUrl }: Props) {
  const heroRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    function classify() {
      if (img!.naturalWidth === 0) return;
      if (img!.naturalHeight > img!.naturalWidth) {
        heroRef.current?.classList.add('tree-hero--portrait');
      }
    }
    if (img.complete && img.naturalWidth > 0) classify();
    else img.addEventListener('load', classify);
  }, [imageUrl]);

  if (!imageUrl) {
    return (
      <div className="tree-hero tree-hero--no-image">
        <h2 className="tree-hero-name">{name}</h2>
      </div>
    );
  }

  return (
    <div className="tree-hero" ref={heroRef}>
      <img className="tree-hero-bg" src={imageUrl} alt="" aria-hidden="true" />
      <img className="tree-hero-img" src={imageUrl} alt={name} ref={imgRef} />
      <div className="tree-hero-overlay">
        <h2 className="tree-hero-name">{name}</h2>
      </div>
    </div>
  );
}
