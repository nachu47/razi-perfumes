'use client';
import { useEffect, useState, type CSSProperties } from 'react';
import type { StaticImageData } from 'next/image';

// Removes the logo's white background on a canvas (and optionally turns dark
// pixels white for use on dark backgrounds). Unchanged from the original design.
export default function TransparentLogo({
  src,
  invertToWhite = false,
  alt = 'Logo',
  className,
  style,
}: {
  src: string | StaticImageData;
  invertToWhite?: boolean;
  alt?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const url = typeof src === 'string' ? src : src.src;
  const [dataUrl, setDataUrl] = useState(url);

  useEffect(() => {
    if (!url) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        if (r > 230 && g > 230 && b > 230) {
          data[i + 3] = 0;
        } else if (invertToWhite) {
          if ((r + g + b) / 3 < 180) {
            data[i] = 255;
            data[i + 1] = 255;
            data[i + 2] = 255;
          }
        }
      }
      ctx.putImageData(imgData, 0, 0);
      setDataUrl(canvas.toDataURL());
    };
    img.onerror = () => setDataUrl(url);
  }, [url, invertToWhite]);

  // eslint-disable-next-line @next/next/no-img-element -- canvas-generated data URL
  return <img src={dataUrl} alt={alt} className={className} style={style} />;
}
