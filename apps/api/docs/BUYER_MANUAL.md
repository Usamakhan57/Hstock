# Buyer Manual — ApnaStore v1.0

## Account

1. Register at `/register` with email + password
2. Verify email via the link sent to your inbox
3. Sign in at `/login`

## Shopping

1. Browse the marketplace home and category pages
2. Use search and filters (category, price, rating, availability)
3. Open a product detail page
4. Click **Buy Now** (one product per order)

## Payment (Cryptomus)

1. You are redirected to Cryptomus to pay with crypto
2. On success you return to the order success page
3. On failure/cancel you return to the failed payment page
4. Paid funds are held in escrow until release or dispute resolution

## Orders & escrow

- View orders under **Account → Orders**
- Escrow status is shown on the order
- Delivery credentials/assets appear when the seller fulfills the order

## Disputes

1. Open a dispute from an eligible paid/escrow/delivered order
2. Select disputed quantity (partial disputes supported)
3. Upload evidence screenshots in secure dispute chat
4. Seller may offer replacement accounts
5. Accept replacement or wait for admin resolution / refund

## Wallet

Buyers have a prepaid wallet funded **only via Cryptomus** (deposit / top-up).

1. Open **Account → Wallet**
2. Enter an amount and choose **Deposit** or **Top Up**
3. Complete the Cryptomus invoice
4. After webhook confirmation, available balance increases
5. At Buy Now checkout, choose **Pay from Wallet** or **Pay Direct (Cryptomus)**

Refunds from escrow are credited back to the buyer wallet. Direct Cryptomus Buy Now (without wallet) still works exactly as before.

## Google sign-in

Use **Continue with Google** on login/register when `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` are configured. Existing email accounts are linked automatically.

## Notifications

Open **Account → Notifications** for order, payment, escrow, wallet, and dispute alerts. Unread badges update in real time when connected. Telegram and email mirror wallet credits when enabled.
