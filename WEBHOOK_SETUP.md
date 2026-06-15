# Paystack Webhook Setup (one-time, ~10 minutes)

This makes **every** sale send emails reliably (buyer access link + your
notification + affiliate notification), even if the buyer closes the tab.
Your sales page stays on GitHub Pages — this only adds a small function on Vercel.

You will need two secret values:
- **Paystack Secret Key** — Paystack Dashboard → Settings → API Keys & Webhooks → copy the **Secret Key** (`sk_live_...`)
- **EmailJS Private Key** — see Step 1 below

---

## Step 1 — Get your EmailJS Private Key & allow server sending

1. Go to https://dashboard.emailjs.com → **Account** → **General**
2. Find **Private Key** (also called "Access Token") and copy it
3. Go to **Account** → **Security**
4. Turn **OFF** "Allow EmailJS API requests only from the browser"
   (this lets the webhook send emails from the server)

---

## Step 2 — Deploy to Vercel

1. Go to https://vercel.com and **Sign up with GitHub** (free)
2. Click **Add New… → Project**
3. Find and **Import** the `Ecosystemexpantion/Tech_stack` repository
4. Before clicking Deploy, open **Environment Variables** and add these two:

   | Name | Value |
   |------|-------|
   | `PAYSTACK_SECRET_KEY` | your `sk_live_...` key |
   | `EMAILJS_PRIVATE_KEY` | the EmailJS Private Key from Step 1 |

5. Click **Deploy** and wait for it to finish
6. Your webhook URL is:
   ```
   https://YOUR-PROJECT-NAME.vercel.app/api/paystack-webhook
   ```
   (copy the domain Vercel shows you, then add `/api/paystack-webhook`)

---

## Step 3 — Tell Paystack about the webhook

1. Paystack Dashboard → **Settings** → **API Keys & Webhooks**
2. In the **Webhook URL** (Live) field, paste your URL from Step 2
3. Click **Save**

---

## Step 4 — Test

1. Buy through the affiliate link:
   `https://ecosystemexpantion.github.io/Tech_stack/?af=ogujiexcellent`
2. Complete a real payment
3. Within a few seconds all three inboxes should get an email:
   - Buyer → access link
   - excel8109@gmail.com → "New sale via affiliate: ogujiexcellent"
   - ogujiexcellent@gmail.com → "🎉 You made a referral sale!"
   (Check Spam/Promotions the first time.)

---

## After it works — tell me

Once you confirm the webhook sends all three emails, tell me and I will
**switch off the in-browser email sending** in the page, so emails come only
from the webhook (no duplicates). Until then you may briefly get each email
twice on a completed sale — that is expected and temporary.

## Adding more affiliates later

Edit `api/paystack-webhook.js`, add a line to the `AFFILIATES` list:

```js
const AFFILIATES = {
  ogujiexcellent: 'ogujiexcellent@gmail.com',
  newperson:      'newperson@gmail.com'   // their ?af=newperson link
};
```

Push the change; Vercel redeploys automatically.
