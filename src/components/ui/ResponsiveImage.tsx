import React from 'react';

interface ResponsiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  mobileSrc?: string;
  desktopSrc: string;
  alt: string;
  className?: string;
}

export function ResponsiveImage({
  mobileSrc,
  desktopSrc,
  alt,
  className = '',
  ...props
}: ResponsiveImageProps) {
  return (
    <picture>
      {mobileSrc && (
        <source
          media="(max-width: 768px)"
          srcSet={mobileSrc}
        />
      )}
      <source
        media="(min-width: 769px)"
        srcSet={desktopSrc}
      />
      <img
        src={desktopSrc}
        alt={alt}
        className={`w-full h-full object-cover ${className}`}
        loading="lazy"
        {...props}
      />
    </picture>
  );
}