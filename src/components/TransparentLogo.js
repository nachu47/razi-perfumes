'use client';
import { useState, useEffect } from 'react';

export default function TransparentLogo({ src, invertToWhite = false, alt = "Logo", className, style }) {
  const [dataUrl, setDataUrl] = useState(src);

  useEffect(() => {
    if (!src) return;

    const img = new Image();
    // Allow same-origin canvas reading
    img.crossOrigin = "anonymous";
    img.src = src;
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
        const g = data[i+1];
        const b = data[i+2];
        
        // If pixel is near-white, make it transparent
        if (r > 230 && g > 230 && b > 230) {
          data[i+3] = 0; // Alpha = 0 (transparent)
        } else if (invertToWhite) {
          // If invertToWhite is requested, turn dark pixels to pure white
          const brightness = (r + g + b) / 3;
          if (brightness < 180) {
            data[i] = 255;
            data[i+1] = 255;
            data[i+2] = 255;
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);
      setDataUrl(canvas.toDataURL());
    };
    img.onerror = () => {
      setDataUrl(src);
    };
  }, [src, invertToWhite]);

  return (
    <img 
      src={dataUrl} 
      alt={alt} 
      className={className} 
      style={style} 
    />
  );
}
