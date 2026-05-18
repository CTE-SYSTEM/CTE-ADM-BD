import React from 'react';
import logoCte from '../assets/Logo CTE.png';

const BrandLogo = ({ className = '', imageClassName = '', alt = 'Logo CTE' }) => (
  <div className={`overflow-hidden rounded-2xl bg-white ${className}`}>
    <img
      src={logoCte}
      alt={alt}
      className={`h-full w-full object-contain ${imageClassName}`}
    />
  </div>
);

export default BrandLogo;
