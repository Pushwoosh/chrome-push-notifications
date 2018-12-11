import {
  BELL_POSITION_TOP_RIGHT,
  BELL_POSITION_TOP_LEFT,
  BELL_POSITION_BOTTOM_LEFT,
  BELL_POSITION_BOTTOM_RIGHT,
} from './constants';


export default class Positioning {
  public static getBellPosition(position: TBellPosition, indent: string): TPositionStyles {
    let positionStyles: TPositionStyles;

    switch (position) {
      case BELL_POSITION_BOTTOM_RIGHT:
        positionStyles = {
          top: 'auto',
          left: 'auto',
          bottom: indent,
          right: indent
        };
        break;
      case BELL_POSITION_BOTTOM_LEFT:
        positionStyles = {
          top: 'auto',
          left: indent,
          bottom: indent,
          right: 'auto'
        };
        break;
      case BELL_POSITION_TOP_LEFT:
        positionStyles = {
          top: indent,
          left: indent,
          bottom: 'auto',
          right: 'auto'
        };
        break;
      case BELL_POSITION_TOP_RIGHT:
        positionStyles = {
          top: indent,
          left: 'auto',
          bottom: 'auto',
          right: indent
        };
        break;
      default:
        positionStyles = {
          top: 'auto',
          left: 'auto',
          bottom: indent,
          right: indent
        };
    }

    return positionStyles;
  }

  public static getTooltipPosition(bellPosition: TBellPosition, bellSize: string): [{left: string} | {right: string}, string] {
    let positionStyles;
    let tooltipModification;
    const increaseIndent = (parseInt(bellSize) + 12) + 'px';

    switch (bellPosition) {
      case BELL_POSITION_BOTTOM_RIGHT:
        positionStyles = { right: increaseIndent };
        tooltipModification = 'right';
        break;
      case BELL_POSITION_BOTTOM_LEFT:
        positionStyles = { left: increaseIndent };
        tooltipModification = 'left';
        break;
      case BELL_POSITION_TOP_LEFT:
        positionStyles = { left: increaseIndent };
        tooltipModification = 'left';
        break;
      case BELL_POSITION_TOP_RIGHT:
        positionStyles = { right: increaseIndent };
        tooltipModification = 'right';
        break;
      default:
        positionStyles = { right: increaseIndent };
        tooltipModification = 'right';
    }

    return [positionStyles, tooltipModification];
  }

  public static getPopoverPosition(bellPosition: TBellPosition, bellSize: string): [TPositionStyles, string] {
    let positionStyles;
    let popoverModification;
    const increaseIndent = (parseInt(bellSize) + 15) + 'px';

    switch (bellPosition) {
      case BELL_POSITION_BOTTOM_RIGHT:
        positionStyles = {
          bottom: increaseIndent,
          right: '0',
          left: 'auto',
          top: 'auto'
        };
        popoverModification = 'bottom';
        break;
      case BELL_POSITION_BOTTOM_LEFT:
        positionStyles = {
          bottom: increaseIndent,
          left: '0',
          right: 'auto',
          top: 'auto'
        };
        popoverModification = 'bottom';
        break;
      case BELL_POSITION_TOP_LEFT:
        positionStyles = {
          top: increaseIndent,
          left: '0',
          right: 'auto',
          bottom: 'auto'
        };
        popoverModification = 'top';
        break;
      case BELL_POSITION_TOP_RIGHT:
        positionStyles = {
          top: increaseIndent,
          right: '0',
          left: 'auto',
          bottom: 'auto'
        };
        popoverModification = 'top';
        break;
      default:
        positionStyles = {
          bottom: increaseIndent,
          right: '0',
          left: 'auto',
          top: 'auto'
        };
        popoverModification = 'bottom';
    }

    return [positionStyles, popoverModification];
  }

  public static getPopoverArrowPosition(bellPosition: TBellPosition, bellSize: string) {
    let arrowAdditionalStyles;

    switch (bellPosition) {
      case BELL_POSITION_BOTTOM_RIGHT:
        arrowAdditionalStyles = `\n.pushwoosh-subscribe-widget__popover__bottom:after {left: auto; right: ${(parseInt(bellSize) / 2 - 4) + 'px'}`;
        break;
      case BELL_POSITION_BOTTOM_LEFT:
        arrowAdditionalStyles = `\n.pushwoosh-subscribe-widget__popover__bottom:after {right: auto; left: ${(parseInt(bellSize) / 2 - 12) + 'px'}`;
        break;
      case BELL_POSITION_TOP_LEFT:
        arrowAdditionalStyles = `\n.pushwoosh-subscribe-widget__popover__top:after {right: auto; left: ${(parseInt(bellSize) / 2 - 12) + 'px'}`;
        break;
      case BELL_POSITION_TOP_RIGHT:
        arrowAdditionalStyles = `\n.pushwoosh-subscribe-widget__popover__top:after {left: auto; right: ${(parseInt(bellSize) / 2 - 4) + 'px'}`;
        break;
      default:
        arrowAdditionalStyles = `\n.pushwoosh-subscribe-widget__popover__bottom:after {left: auto; right: ${(parseInt(bellSize) / 2 - 4) + 'px'}`;
    }

    return arrowAdditionalStyles;
  }
}
