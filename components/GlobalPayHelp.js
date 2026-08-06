"use client";

export default function GlobalPayHelp() {
  return (
    <div className="globalpay-box">
      <h3 className="globalpay-title">Using M-Pesa GlobalPay to pay by card</h3>
      <p className="step-hint" style={{ marginBottom: 10 }}>
        Safaricom's M-Pesa app can generate a free virtual Visa card funded straight from your
        M-Pesa balance — no bank account needed. It works on international sites like this one.
      </p>

      <p className="globalpay-step-label">Get your virtual card (one-time setup)</p>
      <ol className="globalpay-list">
        <li>Open the <b>M-Pesa app</b> → tap <b>Grow</b> → select <b>GlobalPay</b>.</li>
        <li>Tap <b>Activate</b>, choose a card colour, and enter your M-Pesa PIN.</li>
        <li>You'll get your 16-digit card number, expiry, and CVV — tap "Show CVV" when ready to pay.</li>
      </ol>
      <p className="field-note" style={{ marginBottom: 10 }}>
        No app? Dial <b>*334#</b> → Lipa na M-Pesa → M-Pesa GlobalPay → Opt-In → enter your PIN.
        Card details arrive by SMS.
      </p>

      <p className="globalpay-step-label">Paying on TumaCV</p>
      <ol className="globalpay-list">
        <li>Make sure your M-Pesa balance covers the amount — the card spends straight from your wallet.</li>
        <li>Tap a plan above to open checkout, choose <b>Card</b>, and enter your GlobalPay card number, expiry, and CVV.</li>
        <li>Use the name exactly as it appears on your M-Pesa registration as the cardholder name.</li>
      </ol>
      <p className="field-note">
        A small forex conversion fee applies (Safaricom, not TumaCV) since the charge settles in USD.
        Full details: <a href="https://www.safaricom.co.ke/mpesaglobalpay/about" target="_blank" rel="noopener noreferrer">safaricom.co.ke/mpesaglobalpay</a>
      </p>
    </div>
  );
}
