import { useState } from 'react';
import { useCaixaData } from '../../../hooks/useCaixaData';
import CaixaPage from '../pages/CaixaPage';
import OpenCaixaModal from '../OpenCaixaModal';
import CloseCaixaModal from '../CloseCaixaModal';
import SangriaModal from '../SangriaModal';
import ForceCloseExpiredModal from '../ForceCloseExpiredModal';

export default function CaixaContainer() {
  const [openModalOpen, setOpenModalOpen] = useState(false);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [sangriaModalOpen, setSangriaModalOpen] = useState(false);
  const [forceCloseOpen, setForceCloseOpen] = useState(false);

  const caixaData = useCaixaData();
  const {
    loading,
    caixa,
    transactions,
    resumo,
    expiredCaixa,
    reload,
    handleExpiredCaixa,
    clearExpiredCaixa,
  } = caixaData;

  const handleOpenSuccess = () => {
    setOpenModalOpen(false);
    reload();
  };

  const handleExpired = (err) => {
    if (handleExpiredCaixa(err)) {
      setOpenModalOpen(false);
      setForceCloseOpen(true);
      return true;
    }
    return false;
  };

  const handleForceCloseSucess = () => {
    setForceCloseOpen(false);
    clearExpiredCaixa();
    setOpenModalOpen(true);
    reload();
  };

  const handleCloseCaixaSuccess = () => {
    setCloseModalOpen(false);
    reload();
  };

  const handleSangriaSuccess = () => {
    setSangriaModalOpen(false);
    reload();
  };

  const pageProps = {
    loading,
    caixa,
    transactions,
    resumo,
    onOpenCaixaClick: () => setOpenModalOpen(true),
    onCloseCaixaClick: () => setCloseModalOpen(true),
    onSangriaClick: () => setSangriaModalOpen(true),
  };

  return (
    <>
      <CaixaPage {...pageProps} />

      <OpenCaixaModal
        open={openModalOpen}
        onClose={() => setOpenModalOpen(false)}
        onOpened={handleOpenSuccess}
        onExpired={handleExpired}
      />

      <ForceCloseExpiredModal
        open={forceCloseOpen}
        pendingCaixa={expiredCaixa}
        onClose={() => { setForceCloseOpen(false); clearExpiredCaixa(); }}
        onClosed={handleForceCloseSucess}
      />

      {caixa && (
        <CloseCaixaModal
          open={closeModalOpen}
          onClose={() => setCloseModalOpen(false)}
          caixa={caixa}
          resumo={resumo}
          onClosed={handleCloseCaixaSuccess}
        />
      )}

      {caixa && (
        <SangriaModal
          open={sangriaModalOpen}
          onClose={() => setSangriaModalOpen(false)}
          caixa={caixa}
          onRegistered={handleSangriaSuccess}
        />
      )}
    </>
  );
}
