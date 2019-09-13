Pushwoosh Web Push Notification SDK  
=========================  

[![GitHub release](https://img.shields.io/github/release/Pushwoosh/web-push-notifications.svg)](https://github.com/Pushwoosh/web-push-notifications/releases) 
[![npm](https://img.shields.io/npm/v/web-push-notifications.svg)](https://www.npmjs.com/package/web-push-notifications)
![platforms](https://img.shields.io/badge/platforms-Chrome%20%7C%20Firefox%20%7C%20Safari-green.svg)


| [Download](https://cdn.pushwoosh.com/webpush/v3/PushwooshWebSDKFiles.zip) | [Guide](https://www.pushwoosh.com/docs/web-push-sdk-30) | [Sample](https://github.com/Pushwoosh/web-push-notifications-sample) |
| ------------------------------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------- |


### Integration
- Download Pushwoosh Web Push SDK and unzip it. You should have the following files: `manifest.json`, `pushwoosh-service-worker.js`

- Place all these files to top-level root of your website directory.

- Open manifest.json and make the following changes:
  - Change name and short_name to the name of your website.
  - Change `gcm_sender_id` to your Sender ID. Please keep in mind that Sender ID is usually a 12-digit number, and it can't contain any letters.

- Include manifest.json in `<head>`

```html
<link rel="manifest" href="/manifest.json">
```

### Installation

via npm
```bash
npm install web-push-notifications --save
```

via html
```html
<script type="text/javascript" src="//cdn.pushwoosh.com/webpush/v3/pushwoosh-web-notifications.js" async></script>
```

### Usage

```js
import {Pushwoosh} from 'web-push-notifications';
const pwInstance = new Pushwoosh();
pwInstance.push(['init', {
    logLevel: 'info', // possible values: error, info, debug
    applicationCode: 'XXXXX-XXXXX', // you application code from Pushwoosh Control Panel
    safariWebsitePushID: 'web.com.example.domain', //  unique reverse-domain string, obtained in you Apple Developer Portal. Only needed if you send push notifications to Safari browser
    defaultNotificationTitle: 'Pushwoosh', // sets a default title for push notifications
    defaultNotificationImage: 'https://yoursite.com/img/logo-medium.png', // URL to custom custom notification image
    autoSubscribe: false, // or true. If true, prompts a user to subscribe for pushes upon SDK initialization
    subscribeWidget: {
      enable: true
    },
    userId: 'user_id', // optional, set custom user ID
    tags: {
        'Name': 'John Smith'   	// optional, set custom Tags
    }
}]);

pwInstance.push(function(api) {
  console.log('Pushwoosh ready');
});
```

| [Chrome Guide](https://www.pushwoosh.com/docs/chrome-web-push) | [Firefox Guide](https://www.pushwoosh.com/docs/firefox-web-push) | [Safari Guide](https://www.pushwoosh.com/docs/safari-website-notifications) | [HTTP integration Guide](https://www.pushwoosh.com/docs/chrome-web-push-for-http-websites) | [Subscription Button Guide](https://www.pushwoosh.com/v1.0/docs/push-subscription-button) |
| -------------------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |


