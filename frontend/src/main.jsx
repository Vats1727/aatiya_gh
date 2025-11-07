import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles.css'
import PaymentModal from './components/PaymentModal'

const container = document.getElementById('root')
const root = createRoot(container)

root.render(
  <StrictMode>
    <BrowserRouter>
      <App/>
      <PaymentModalHost />
    </BrowserRouter>
  </StrictMode>
)

function PaymentModalHost() {
  const [open, setOpen] = React.useState(false);
  const [payload, setPayload] = React.useState(null);

  React.useEffect(() => {
    const handler = (e) => {
      setPayload(e.detail);
      setOpen(true);
    };
    window.addEventListener('openPaymentModal', handler);
    return () => window.removeEventListener('openPaymentModal', handler);
  }, []);

  if (!open || !payload) return null;
  return (
    <PaymentModal visible={open} onClose={() => setOpen(false)} student={payload.student} hostelId={payload.hostelId} hostelFee={payload.hostelFee} />
  );
}
