# Telegram Notification System

ApnaStore delivers marketplace notifications to buyers and sellers through a Telegram bot connection.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TELEGRAM_ENABLED` | Yes to activate | `true` / `false` |
| `TELEGRAM_BOT_TOKEN` | Yes when enabled | Bot token from @BotFather |
| `TELEGRAM_BOT_USERNAME` | Yes for connect links | Bot username without `@` |
| `TELEGRAM_WEBHOOK_SECRET` | Recommended in production | Sent as `X-Telegram-Bot-Api-Secret-Token` |
| `TELEGRAM_WEBHOOK_URL` | Required for webhook mode | Public HTTPS webhook URL |
| `TELEGRAM_MODE` | Optional | `webhook` (production) or `polling` (development) |

Production example:

```bash
TELEGRAM_ENABLED=true
TELEGRAM_BOT_TOKEN=123456:ABC...
TELEGRAM_BOT_USERNAME=ApnaStoreBot
TELEGRAM_WEBHOOK_SECRET=<long-random-secret>
TELEGRAM_WEBHOOK_URL=https://apnastore.org/api/v1/telegram/webhook
TELEGRAM_MODE=webhook
```

## Connect flow

1. User opens Profile → **Telegram Notifications** → **Connect Telegram**
2. API issues a one-time signed connect token (15 minute TTL)
3. User is redirected to `https://t.me/<bot>?start=<token>`
4. User presses **Start**
5. Bot verifies the token (HMAC + DB one-time use) and links:
   - `telegramConnected`
   - `telegramChatId` (never exposed publicly)
   - `telegramUserId`
   - `telegramUsername`
   - `telegramConnectedAt`

Duplicate Telegram accounts cannot be linked to multiple ApnaStore users.

## Modes

### Webhook (production)

- Set `TELEGRAM_MODE=webhook`
- Nginx already proxies `/api/` to the Node API (PM2)
- On boot the API calls Telegram `setWebhook`
- Protect with `TELEGRAM_WEBHOOK_SECRET`

### Polling (development)

- Set `TELEGRAM_MODE=polling`
- API deletes any webhook and starts `getUpdates` polling
- Safe for local Hostinger-less development

## Admin

Admin Dashboard → Marketplace Ops → **Telegram**

- Bot status
- Connected users + search
- Messages sent / failed
- Recent logs
- Broadcast message + history
- Telegram statistics

## Security

- Chat IDs are `select: false` and stripped from JSON transforms
- Connect tokens are hashed at rest and single-use
- Token HMAC prevents forgery even if DB is partially leaked
- Expired tokens auto-clean via MongoDB TTL
- Telegram API failures never crash commerce APIs

## PM2 / Hostinger

No extra process is required. The API process (`ecosystem.config.js`) owns webhook handling and the in-process Telegram queue. Keep a single PM2 instance while using memory queues.
