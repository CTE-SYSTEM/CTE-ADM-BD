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
    const handleResize = () => setViewport(getViewportState());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return useMemo(() => ({
    ...viewport,
    pageClassName: viewport.isMobile
      ? 'p-3 space-y-5 max-w-full mx-auto'
      : 'p-4 space-y-6 max-w-7xl mx-auto',
    sectionClassName: viewport.isMobile
      ? 'rounded-xl bg-white p-4 shadow-sm border border-gray-100 space-y-4'
      : 'rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-4',
    splitGridClassName: viewport.isDesktop ? 'grid gap-6 xl:grid-cols-2' : 'grid gap-5',
  }), [viewport]);
}
