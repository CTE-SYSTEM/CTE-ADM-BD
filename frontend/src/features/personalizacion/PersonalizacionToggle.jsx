import React from 'react';
import { Moon, Sun } from 'lucide-react';

function PersonalizacionToggle({ isDarkMode, onToggle }) {
  const Icon = isDarkMode ? Sun : Moon;

  return (
    <button
      type="button"
      className="personalizacion-toggle"
      onClick={onToggle}
      aria-label={isDarkMode ? 'Cambiar a modo normal' : 'Cambiar a modo oscuro'}
      title={isDarkMode ? 'Modo normal' : 'Modo oscuro'}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
      <span>{isDarkMode ? 'Normal' : 'Oscuro'}</span>
    </button>
  );
}

export default PersonalizacionToggle;
