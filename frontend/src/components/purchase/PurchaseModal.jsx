import { useCallback, useEffect, useState } from 'react';
import { publicApi } from '../../api/public.js';
import { useSite } from '../../context/SiteContext.jsx';
import { sleep } from '../../utils/format.js';
import { DetailsStep, OtpStep, PaymentStep, RequirementStep, SuccessStep } from './steps.jsx';

const RAZORPAY_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = RAZORPAY_SRC;
    s.onload = resolve;
    s.onerror = () => reject(new Error('Could not load the payment window. Check your connection and try again.'));
    document.head.appendChild(s);
  });
}

const EMPTY_CUSTOMER = { company: '', contact: '', gstNumber: '', phone: '', email: '' };

export default function PurchaseModal({ session, onClose }) {
  const { payment } = useSite();
  const isCart = session.mode === 'cart';

  const [step, setStep] = useState(isCart ? 'details' : 'requirement');
  const [qty, setQty] = useState(1);
  const [customer, setCustomer] = useState(EMPTY_CUSTOMER);
  const [scopeFile, setScopeFile] = useState(null);
  const [devOtp, setDevOtp] = useState('');
  const [verifyToken, setVerifyToken] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false); // true while the order is being created / payment is in flight

  // What the server should price: cart flows send the page's configuration, plan flows the chosen plan + quantity.
  const itemFor = useCallback(
    (extra = {}) => ({
      productKey: session.productKey,
      config: isCart ? session.config : { planKey: session.planKey, qty },
      ...extra,
    }),
    [session, isCart, qty]
  );

  const closable = !busy;
  const close = useCallback(() => { if (closable) onClose(); }, [closable, onClose]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [close]);

  const stepLabel = (planLabel, cartLabel) => (isCart ? cartLabel : planLabel);
  const sendOtp = () => publicApi.sendOtp({ purpose: 'checkout', email: customer.email });

  const pay = async (currentPromo) => {
    setBusy(true);
    try {
      const order = await publicApi.createOrder({ ...itemFor({ promoCode: currentPromo }), customer, verifyToken }, scopeFile);

      if (order.paymentMode === 'razorpay') {
        await loadRazorpay();
        const paid = await new Promise((resolve, reject) => {
          const rz = new window.Razorpay({
            key: order.razorpay.keyId,
            order_id: order.razorpay.orderId,
            amount: order.razorpay.amount,
            currency: order.razorpay.currency,
            name: 'CallMaster',
            description: `${order.quote.product} — ${order.quote.plan}`,
            prefill: { name: customer.contact, email: customer.email, contact: customer.phone },
            theme: { color: '#E9A23B' },
            handler: (r) => resolve(r),
            modal: { ondismiss: () => reject(new Error('Payment was cancelled. You can try again.')) },
          });
          rz.open();
        });
        setResult(await publicApi.verifyRazorpay(order.orderId, {
          accessToken: order.accessToken,
          razorpayOrderId: paid.razorpay_order_id,
          razorpayPaymentId: paid.razorpay_payment_id,
          signature: paid.razorpay_signature,
        }));
      } else {
        await sleep(1200); // sandbox: mimic the Razorpay popup handshake
        setResult(await publicApi.sandboxPay(order.orderId, order.accessToken));
      }
      setStep('success');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pm-overlay open" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="pm-box">
        <button type="button" className="pm-close" aria-label="Close" onClick={close}>&times;</button>
        <div>
          {step === 'requirement' && (
            <RequirementStep session={session} qty={qty} setQty={setQty} onNext={() => setStep('details')} />
          )}
          {step === 'details' && (
            <DetailsStep
              eyebrow={stepLabel('STEP 2 OF 3', 'STEP 1 OF 2')}
              customer={customer}
              setCustomer={setCustomer}
              requiresFile={Boolean(session.requiresFileUpload)}
              file={scopeFile}
              setFile={setScopeFile}
              onBack={() => (isCart ? onClose() : setStep('requirement'))}
              onSendOtp={async () => {
                const r = await sendOtp();
                setDevOtp(r.devOtp || '');
                setStep('otp');
              }}
            />
          )}
          {step === 'otp' && (
            <OtpStep
              eyebrow={stepLabel('STEP 2 OF 3', 'STEP 1 OF 2')}
              email={customer.email}
              devOtp={devOtp}
              onResend={async () => setDevOtp((await sendOtp()).devOtp || '')}
              onBack={() => setStep('details')}
              onVerified={async (code) => {
                const r = await publicApi.verifyOtp({ purpose: 'checkout', target: customer.email.toLowerCase(), code });
                setVerifyToken(r.verifyToken);
                setStep('processing');
                await sleep(700);
                setStep('payment');
              }}
            />
          )}
          {step === 'processing' && (
            <div className="pm-processing"><div className="pm-spinner" />Preparing your order…</div>
          )}
          {step === 'payment' && (
            <PaymentStep
              eyebrow={stepLabel('STEP 3 OF 3', 'STEP 2 OF 2')}
              session={session}
              sandbox={payment.mode !== 'razorpay'}
              busy={busy}
              promoCode={promoCode}
              setPromoCode={setPromoCode}
              loadQuote={(code) => publicApi.quote(itemFor({ promoCode: code }))}
              onBack={() => setStep('otp')}
              onPay={pay}
            />
          )}
          {step === 'success' && result && (
            <SuccessStep result={result} sandbox={payment.mode !== 'razorpay'} onDone={onClose} />
          )}
        </div>
      </div>
    </div>
  );
}
