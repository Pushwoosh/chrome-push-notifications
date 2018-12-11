type TBellPosition = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

type TTooltipText = {
  successSubscribe: string,
  needSubscribe: string,
  blockSubscribe: string,
  alreadySubscribed: string
}
type TBellConfig = {
  position: TBellPosition;
  bgColor: string,
  bellColor: string,
  bellStrokeColor: string,
  bellButtonBorder: string,
  shadow: string
  size: string
  indent: string  // edge indent
  zIndex: string,
  tooltipText: TTooltipText
}

type TPositionStyles = {
  top: string,
  bottom: string,
  left: string,
  right: string
}

type TEvent = {
  event_id: number | string,
  application: string
}

type TStyleKeys = 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'zIndex'
  | 'position'
  | 'backgroundColor'
  | 'background'
  | 'zIndex'
  | 'width'
  | 'height'
  | 'boxShadow'
  | 'lineHeight'
  | 'border'
  | 'maxWidth'
  | 'maxHeight';
type TCSSStylesObject = {
  [style: string]: string;
};
