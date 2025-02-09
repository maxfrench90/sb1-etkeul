import React, { useEffect, useRef } from 'react';
import { performance } from '../../lib/performance';
import { ImageWithFallback } from './ImageWithFallback';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function LazyImage({
  src,
  alt,
  fallbackSrc,
  className = '',
  onLoad,
  onError,
  ...props
}: LazyImageProps) {
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current) {
      performance.observeImage(imgRef.current);
    }
  }, []);

  return (
    <ImageWithFallback
      ref={imgRef}
      data-src={src}
      src={fallbackSrc || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'}
      alt={alt}
      className={`transition-opacity duration-300 ${className}`}
      onLoad={onLoad}
      onError={onError}
      {...props}
    />
  );
}