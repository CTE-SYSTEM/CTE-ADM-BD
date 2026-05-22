import { useContext } from 'react';
import PersonalizacionContext from './personalizacionContextValue';

export function usePersonalizacion() {
  const context = useContext(PersonalizacionContext);

  if (!context) {
    throw new Error('usePersonalizacion debe usarse dentro de PersonalizacionProvider');
  }

  return context;
}
