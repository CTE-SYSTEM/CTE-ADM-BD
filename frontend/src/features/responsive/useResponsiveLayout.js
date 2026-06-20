import { useEffect, useMemo, useState } from 'react';

const getViewportState = () => {
  if (typeof window === 'undefined') {
    return { width: 1280, isMobile: false, isTablet: false, isDesktop: true };
  }

  const width = window.innerWidth;
  return {
    width,
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
  };
};

export default function useResponsiveLayout() {
  const [viewport, setViewport] = useState(getViewportState);

  useEffect(() => {
    let frameId = null;
    const handleResize = () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => setViewport(getViewportState()));
    };

    window.addEventListener('resize', handleResize);
    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return useMemo(() => ({
    ...viewport,
    pageClassName: viewport.isMobile
      ? 'w-full max-w-full space-y-5 px-3 py-4'
      : 'mx-auto w-full max-w-7xl space-y-6 px-4 py-5',
    sectionClassName: viewport.isMobile
      ? 'rounded-xl bg-white p-4 shadow-sm border border-gray-100 space-y-4 min-w-0'
      : 'rounded-2xl bg-white p-5 sm:p-6 shadow-sm border border-gray-100 space-y-4 min-w-0',
    splitGridClassName: viewport.isDesktop ? 'grid min-w-0 gap-6 xl:grid-cols-2' : 'grid min-w-0 gap-5',
    formGridClassName: viewport.isMobile ? 'grid gap-3' : 'grid gap-4 md:grid-cols-2 xl:grid-cols-4',
    tableWrapClassName: 'min-w-0 overflow-x-auto',
  }), [viewport]);
}
