import React from 'react';
import { Boxes } from 'lucide-react';

const BrandLogo = ({ className = '', iconClassName = '' }) => (
  <div className={`flex items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white ${className}`}>
    <Boxes className={`h-7 w-7 ${iconClassName}`} aria-hidden="true" />
    <span className="sr-only">Sistema de gestion</span>
  </div>
);

export default BrandLogo;
