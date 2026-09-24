import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import PurchaseModal from './PurchaseModal.jsx';

const PurchaseContext = createContext(null);

/**
 * Opens the self-serve checkout modal.
 *  - openPlan({ productKey, product, planKey, planName, unitPrice, unit })  → single plan, asks for a quantity first
 *  - openCart({ productKey, product, config, requiresFileUpload })          → pre-configured on the product page
 * Prices shown in the modal's payment step always come from the server (POST /checkout/quote).
 */
export function PurchaseProvider({ children }) {
  const [session, setSession] = useState(null);

  const openPlan = useCallback((p) => setSession({ id: Date.now(), mode: 'plan', ...p }), []);
  const openCart = useCallback((p) => setSession({ id: Date.now(), mode: 'cart', ...p }), []);
  const close = useCallback(() => setSession(null), []);

  const value = useMemo(() => ({ openPlan, openCart }), [openPlan, openCart]);
  return (
    <PurchaseContext.Provider value={value}>
      {children}
      {session && <PurchaseModal key={session.id} session={session} onClose={close} />}
    </PurchaseContext.Provider>
  );
}

export const usePurchase = () => useContext(PurchaseContext);
