module.exports = {
  manifest: {
    name: 'Pushwoosh Notifications',
    short_name: 'Pushwoosh Notifications',
    gcm_sender_id: 'GOOGLE_PROJECT_ID',
    display: 'standalone',
    gcm_user_visible_only: true
  },

  initParams: {
    logLevel: 'info',
    applicationCode: 'XXXXX-XXXXX',
    safariWebsitePushID: 'web.com.example.test',
    defaultNotificationTitle: 'Pushwoosh',
    defaultNotificationImage: 'https://cp.pushwoosh.com/img/logo-medium.png',
    autoSubscribe: false,
    userId: 'user_id',
    serviceWorkerUrl: 'pushwoosh-service-worker.js',
    tags: {
      Name: 'John Doe'
    },
    subscribeWidget: {
      enable: true,
    },
    facebook: {
      enable: true,
      containerClass: 'pwasc-container',
      pageId: '687279728362093'
    },
    inApps: {
      enable: false
    },
  },

  ssl: {
    key: '', // absolute path to key
    cert: '' // absolute path to cert
  }
};
