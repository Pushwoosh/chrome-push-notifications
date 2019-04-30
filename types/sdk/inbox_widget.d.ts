interface TMessagesElementsType {
  [code: string]: HTMLElement
}

interface IConfigStyles {
  name: TStylesNames,
  type: TStylesTypes
}

type TStylesNames = 'bgColor' | 'textColor' | 'fontFamily' | 'borderRadius' | 'borderColor'
  | 'badgeBgColor' | 'badgeTextColor' | 'widgetWidth' | 'zIndex' | 'messageTitleColor' | 'timeTextColor'
  | 'emptyInboxTitleColor' | 'emptyInboxTextColor' | 'arrowBorderColor';

type TStylesTypes = 'number' | 'color' | 'string' | 'size';

type TWidgetPosition = 'left' | 'right' | 'top' | 'bottom';

interface IInboxWidgetConfig {
  enable: boolean;
  triggerId: string;
  position: TWidgetPosition;
  appendTo: string;
  title: string;
  bgColor: string;
  textColor: string;
  fontFamily: string;
  borderRadius: number;
  borderColor: string;
  badgeBgColor: string;
  badgeTextColor: string;
  widgetWidth: number;
  zIndex: number;
  messageTitleColor: string;
  timeTextColor: string;
  emptyInboxTitle: string;
  emptyInboxText: string;
  emptyInboxIconUrl: string;
  emptyInboxTitleColor: string;
  emptyInboxTextColor: string;
  arrowBorderColor: string;
}
