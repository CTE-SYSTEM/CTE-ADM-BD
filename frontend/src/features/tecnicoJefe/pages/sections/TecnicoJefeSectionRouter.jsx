import React from 'react';
import {
  TAB_ALERTAS,
  TAB_CORRECCIONES,
  TAB_DIAGNOSTICOS,
  TAB_IRREPARABLES,
  TAB_ORDENES,
  TAB_REPUESTOS,
} from '../../utils/constants';
import AlertasRetrasoPage from './AlertasRetrasoPage';
import CorreccionesPage from './CorreccionesPage';
import DiagnosticosAsignacionPage from './DiagnosticosAsignacionPage';
import IrreparablesRevisionPage from './IrreparablesRevisionPage';
import OrdenesAsignacionPage from './OrdenesAsignacionPage';
import RepuestosAprobacionPage from './RepuestosAprobacionPage';

const TecnicoJefeSectionRouter = ({ dashboard }) => {
  const commonProps = {
    loading: dashboard.layout.loading,
    columns: dashboard.layout.mainColumns,
    data: dashboard.layout.mainData,
  };

  const searchableProps = {
    ...commonProps,
    activeTab: dashboard.layout.activeTab,
    searchTerm: dashboard.layout.searchTermCorrecciones,
    onSearch: dashboard.layout.setSearchTermCorrecciones,
  };

  if (dashboard.layout.activeTab === TAB_ORDENES) {
    return <OrdenesAsignacionPage {...commonProps} />;
  }

  if (dashboard.layout.activeTab === TAB_REPUESTOS) {
    return <RepuestosAprobacionPage {...commonProps} />;
  }

  if (dashboard.layout.activeTab === TAB_IRREPARABLES) {
    return <IrreparablesRevisionPage {...searchableProps} />;
  }

  if (dashboard.layout.activeTab === TAB_ALERTAS) {
    return <AlertasRetrasoPage {...commonProps} />;
  }

  if (dashboard.layout.activeTab === TAB_CORRECCIONES) {
    return <CorreccionesPage {...searchableProps} />;
  }

  if (dashboard.layout.activeTab === TAB_DIAGNOSTICOS) {
    return <DiagnosticosAsignacionPage {...commonProps} />;
  }

  return <DiagnosticosAsignacionPage {...commonProps} />;
};

export default TecnicoJefeSectionRouter;
