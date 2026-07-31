import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../../context/AuthContext';
import { DashboardHeader } from '../components/components';
import {
  AsignacionesRecientes,
  JefeTecnicoIntro,
  JefeTecnicoMessages,
  JefeTecnicoStats,
  JefeTecnicoTabs,
} from '../components/sections/JefeTecnicoSections';
import { JefeTecnicoDashboardModals } from '../components/sections/JefeTecnicoDashboardModals';
import { useTecnicoJefeDashboard } from '../hooks/useTecnicoJefeDashboard';
import TecnicoJefeSectionRouter from './sections/TecnicoJefeSectionRouter';

const JefeDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const dashboard = useTecnicoJefeDashboard(user);

  useEffect(() => {
    if (user && !dashboard.esJefeTecnico) {
      navigate('/');
    }
  }, [user, dashboard.esJefeTecnico, navigate]);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans text-slate-900">
      <DashboardHeader
        user={user}
        logout={logout}
        socketConnected={dashboard.header.socketConnected}
        notificationsCount={dashboard.header.notifications.length}
        notifications={dashboard.header.notifications}
        showNotifications={dashboard.header.showNotifications}
        onToggleNotifications={dashboard.header.toggleNotifications}
        onClearNotifications={dashboard.header.clearNotifications}
        onCloseNotifications={dashboard.header.closeNotifications}
      />

      <main className="flex-1 container mx-auto p-8">
        <JefeTecnicoIntro showHelp={dashboard.layout.showHelp} />

        <JefeTecnicoStats
          diagnosticosPendientes={dashboard.data.diagnosticosPendientes}
          ordenesAprobadas={dashboard.data.ordenesAprobadas}
          repuestosPendientes={dashboard.data.repuestosPendientes}
          alertasRetraso={dashboard.data.alertasRetraso}
        />

        <AsignacionesRecientes
          asignacionesRecientes={dashboard.data.asignacionesRecientes}
          asignacionColumns={dashboard.data.asignacionColumns}
        />

        <JefeTecnicoTabs
          activeTab={dashboard.layout.activeTab}
          alertasRetraso={dashboard.data.alertasRetraso}
          correccionesFiltradas={dashboard.data.correccionesFiltradas}
          irreparablesFiltrados={dashboard.data.irreparablesFiltrados}
          onChange={dashboard.layout.setActiveTab}
        />

        <JefeTecnicoMessages
          asignacionError={dashboard.messages.asignacionError}
          asignacionOk={dashboard.messages.asignacionOk}
          repuestoDecisionError={dashboard.messages.repuestoDecisionError}
          repuestoDecisionOk={dashboard.messages.repuestoDecisionOk}
          irreparableDecisionError={dashboard.messages.irreparableDecisionError}
          irreparableDecisionOk={dashboard.messages.irreparableDecisionOk}
          onDismissAsignacion={dashboard.messages.dismissAsignacion}
          onDismissRepuesto={dashboard.messages.dismissRepuesto}
          onDismissIrreparable={dashboard.messages.dismissIrreparable}
        />

        <TecnicoJefeSectionRouter dashboard={dashboard} />
      </main>

      <JefeTecnicoDashboardModals
        showModal={dashboard.modals.showModal}
        detalles={dashboard.modals.detalles}
        loadingDetalles={dashboard.modals.loadingDetalles}
        onCloseDetail={dashboard.modals.closeDetail}
        showEditModal={dashboard.modals.showEditModal}
        editItem={dashboard.modals.editItem}
        editForm={dashboard.modals.editForm}
        editError={dashboard.modals.editError}
        tecnicos={dashboard.modals.tecnicos}
        repuestosCatalogo={dashboard.modals.repuestosCatalogo}
        savingId={dashboard.modals.savingId}
        onCloseEdit={dashboard.modals.closeEdit}
        onFieldChange={dashboard.modals.changeEditField}
        onSave={dashboard.modals.saveCorreccion}
      />
    </div>
  );
};

export default JefeDashboard;
