/// <reference path="pushwoosh.d.ts" />
/// <reference path="subscribe_widget.d.ts" />
/// <reference path="service-worker.d.ts" />
/// <reference path="safari.d.ts" />
/// <reference path="custom.d.ts" />
/// <reference path="notification.d.ts" />
/// <reference path="inbox.d.ts" />
/// <reference path="inbox_widget.d.ts" />
/// <reference path="in-app.d.ts" />
/// <reference path="storage.d.ts" />
/// <reference path="modules/platformChecker.d.ts" />

interface IKeyString {
  [key: string]: string;
}

type TSubscriptionSegmentName = string;
type TSubscriptionSegmentCode = string;
type TSubscriptionSegmentPosition = number;

interface ISubscriptionSegment {
  name: TSubscriptionSegmentName;
  code: TSubscriptionSegmentCode;
  position: TSubscriptionSegmentPosition;
}
