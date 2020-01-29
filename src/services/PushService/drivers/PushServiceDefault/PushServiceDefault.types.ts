export interface IPushServiceDefaultConfig {
  entrypoint?: string;
}

export interface IPushServiceFcmRequest {
  endpoint: string; // subscription endpoint
  encryption_key: string; // subscription p256dh token
  encryption_auth: string; // subscription auth token
  authorized_entity: string; // sender id
  application_pub_key?: string; // application server key
}

export interface IPushServiceFcmResponse {
  token: string; // fcm token
  pushSet: string; // fcm push set
}
