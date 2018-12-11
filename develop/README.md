# Change init params and manifest.json

#### Clone the `config/config.js` to a `config/config.local.js` and edit it

```js
module.exports = {
  manifest: {
    gcm_sender_id: 'GOOGLE_PROJECT_ID'
  },

  initParams: {
    applicationCode: 'XXXXX-XXXXX',
    safariWebsitePushID: 'web.com.example.test',
    serviceWorkerUrl: 'pushwoosh-service-worker.uncompress.js'
  },

  ssl: {
    key: '', // absolute path to key
    cert: '' // absolute path to cert
  }
};
```

## Build development

```bash
npm run build
```

## Build production

```bash
npm run build:prod
```

## Run server

```bash
npm run start
```

## Prepare release files

```bash
npm run release
```
