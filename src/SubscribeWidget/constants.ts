// Bell
export const BELL_POSITION_BOTTOM_RIGHT = 'bottomRight';
export const BELL_POSITION_BOTTOM_LEFT = 'bottomLeft';
export const BELL_POSITION_TOP_RIGHT = 'topRight';
export const BELL_POSITION_TOP_LEFT = 'topLeft';

// Common
export const WIDGET_CONTAINER_ID = 'pushwooshBellWidget';

export const SUBSCRIBE_WIDGET_DEFAULT_CONFIG: TBellConfig = {
  position: BELL_POSITION_BOTTOM_LEFT,
  bgColor: '#12AE7E',
  bellColor: 'white',
  bellStrokeColor: '#08754f',
  bellButtonBorder: '1px solid #379676',
  shadow: '0px 0px 6px rgba(0, 0, 0, 0.75)',
  size: '48px',
  indent: '20px',
  zIndex: '999999',
  tooltipText: {
    successSubscribe: 'You are successfully subscribed!',
    needSubscribe: 'Get notifications about important news!',
    blockSubscribe: 'Click to see how to get notifications',
    alreadySubscribed: 'You are already subscribed'
  }
};
