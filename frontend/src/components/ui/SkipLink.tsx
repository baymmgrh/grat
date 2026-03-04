import React from 'react';

/**
 * SkipLink - Allows keyboard users to skip navigation and go directly to main content
 * 
 * Usage: Place at the very top of your app, before any other content
 * 
 * <SkipLink />
 * <nav>...</nav>
 * <main id="main-content">...</main>
 */
interface SkipLinkProps {
  href?: string;
  children?: React.ReactNode;
}

const SkipLink: React.FC<SkipLinkProps> = ({
  href = '#main-content',
  children = 'Langsung ke konten utama',
}) => {
  return (
    <a
      href={href}
      className="
        sr-only focus:not-sr-only
        focus:absolute focus:top-4 focus:left-4 focus:z-[100]
        focus:px-4 focus:py-2
        focus:bg-blue-600 focus:text-white
        focus:rounded-lg focus:shadow-lg
        focus:outline-none focus:ring-4 focus:ring-blue-500/50
        transition-all
      "
    >
      {children}
    </a>
  );
};

export default SkipLink;
