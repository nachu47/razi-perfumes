'use client';
import { useEffect, useState, type CSSProperties } from 'react';
import type { StaticImageData } from 'next/image';

/**
 * Returns a data URL of the logo with its white background removed (optionally with
 * dark pixels turned white for dark backgrounds). `ready` is false until processed.
 */
export function useTransparentLogo(src: string | StaticImageData, invertToWhite = false) {
  const url = typeof src === 'string' ? src : src.src;
  const [state, setState] = useState<{ dataUrl: string; ready: boolean }>({ dataUrl: url, ready: false });

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
      if (!ctx) return setState({ dataUrl: url, ready: true });
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        if (r > 230 && g > 230 && b > 230) {
          data[i + 3] = 0;
        } else if (invertToWhite && (r + g + b) / 3 < 180) {
          data[i] = 255;
          data[i + 1] = 255;
          data[i + 2] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);
      setState({ dataUrl: canvas.toDataURL(), ready: true });
    };
    img.onerror = () => setState({ dataUrl: url, ready: true });
  }, [url, invertToWhite]);

  return state;
}

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
  const { dataUrl } = useTransparentLogo(src, invertToWhite);
  // eslint-disable-next-line @next/next/no-img-element -- canvas-generated data URL
  return <img src={dataUrl} alt={alt} className={className} style={style} />;
}
