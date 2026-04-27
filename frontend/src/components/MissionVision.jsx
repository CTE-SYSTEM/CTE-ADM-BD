import React from 'react';
import { Target, Eye, Award } from 'lucide-react';

const MissionVision = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* Misión */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-indigo-100 rounded-lg">
            <Target className="w-6 h-6 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Misión</h3>
        </div>
        <p className="text-gray-600 leading-relaxed">
          Brindar un servicio profesional de diagnóstico y reparación, ofreciendo 
          soluciones confiables, rápidas y accesibles en Nicaragua.
        </p>
      </div>

      {/* Visión */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-purple-100 rounded-lg">
            <Eye className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Visión</h3>
        </div>
        <p className="text-gray-600 leading-relaxed">
          Convertirse en el lugar predilecto de los nicaragüenses, reconocido por 
          su excelencia en el servicio, seguridad y honestidad.
        </p>
      </div>
    </div>
  );
};

export default MissionVision;