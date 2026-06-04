import React from 'react';
import { CorrectionModal, DetailModal } from '../components';

export const JefeTecnicoDashboardModals = ({
  showModal,
  detalles,
  loadingDetalles,
  onCloseDetail,
  showEditModal,
  editItem,
  editForm,
  editError,
  tecnicos,
  repuestosCatalogo,
  savingId,
  onCloseEdit,
  onFieldChange,
  onSave,
}) => (
  <>
    {showModal && (
      <DetailModal
        detalles={detalles}
        loadingDetalles={loadingDetalles}
        onClose={onCloseDetail}
      />
    )}

    {showEditModal && editItem && (
      <CorrectionModal
        editItem={editItem}
        editForm={editForm}
        editError={editError}
        tecnicos={tecnicos}
        repuestosCatalogo={repuestosCatalogo}
        savingId={savingId}
        onClose={onCloseEdit}
        onFieldChange={onFieldChange}
        onSave={onSave}
      />
    )}
  </>
);
