// Paystack webhook → sends sale emails server-side (buyer, owner, affiliate).
// Runs on Vercel. Fires on every successful payment, independent of the buyer's
// browser, so emails never get lost when a tab is closed or a transfer confirms late.

import emailjs from '@emailjs/nodejs';

// Affiliate code (the ?af= value) → email to notify.
const AFFILIATES = {
  ogujiexcellent: 'ogujiexcellent@gmail.com'
};

const OWNER_EMAIL  = 'excel8109@gmail.com';
const PRODUCT_LINK = 'https://ecosystemexpantion.github.io/Product_page/';

// These are not secret (already public in the page); kept here to avoid extra env vars.
const EMAILJS_SERVICE  = 'service_ab7fo9g';
const EMAILJS_TEMPLATE = 'template_fnqmdxw';
const EMAILJS_PUBLIC   = 'P6vjGqbInRNLni8GS';

function sendEmail(params) {
  return emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, params, {
    publicKey:  EMAILJS_PUBLIC,
    privateKey: process.env.EMAILJS_PRIVATE_KEY
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const event = req.body || {};
  if (event.event !== 'charge.success') {
    res.status(200).send('Ignored');
    return;
  }

  const reference = event.data && event.data.reference;
  if (!reference) {
    res.status(400).send('No reference');
    return;
  }

  // Verify the transaction directly with Paystack. This is the source of truth:
  // emails only go out for genuinely successful payments, even if someone tried
  // to forge a webhook call.
  let tx;
  try {
    const r = await fetch(
      'https://api.paystack.co/transaction/verify/' + encodeURIComponent(reference),
      { headers: { Authorization: 'Bearer ' + process.env.PAYSTACK_SECRET_KEY } }
    );
    tx = await r.json();
  } catch (e) {
    console.error('Paystack verify request failed', e);
    res.status(200).send('verify failed'); // 200 so Paystack does not spam retries
    return;
  }

  if (!tx.status || !tx.data || tx.data.status !== 'success') {
    res.status(200).send('Not a successful transaction');
    return;
  }

  const data    = tx.data;
  const email   = (data.customer && data.customer.email) || '';
  const meta    = data.metadata || {};
  const af      = (meta.af || '').toString().trim().toLowerCase();
  const afEmail = af && AFFILIATES[af] ? AFFILIATES[af] : '';

  try {
    // 1. Buyer — product access link
    if (email) {
      await sendEmail({
        to_email:     email,
        user_email:   email,
        product_name: 'EEM26 Tech Stack',
        product_link: PRODUCT_LINK,
        payment_ref:  reference
      });
    }

    // 2. Owner — notified of every sale
    await sendEmail({
      to_email:     OWNER_EMAIL,
      user_email:   OWNER_EMAIL,
      product_name: afEmail ? ('New sale via affiliate: ' + af) : 'New direct sale — EEM26 Tech Stack',
      product_link: 'Buyer: ' + email,
      payment_ref:  reference
    });

    // 3. Affiliate — only when a known affiliate link was used
    if (afEmail) {
      await sendEmail({
        to_email:     afEmail,
        user_email:   afEmail,
        product_name: '🎉 You made a referral sale! — EEM26 Tech Stack',
        product_link: 'Someone bought through your link. Payment ref: ' + reference,
        payment_ref:  reference
      });
    }

    res.status(200).send('ok');
  } catch (e) {
    console.error('Email send failed', e);
    res.status(200).send('received'); // logged; avoid Paystack retry storms
  }
}
