export const getStyles = (namespace: string): HTMLStyleElement => {
  const styles = document.createElement('style');

  styles.innerHTML = `
    .pushwoosh-${namespace}-popup {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: none;
      z-index: 999999999;
      opacity: 0.99;
    }
    
    .pushwoosh-${namespace}-popup_show {
      display: block;
    }
    
    .pushwoosh-${namespace}-popup__wrapper {
      width: 100%;
      height: 100%;
      text-align: center;
      background: rgba(0, 0, 0, .2);
    }
    
    .pushwoosh-${namespace}-popup__wrapper:after {
      content: '';
      display: inline-block;
      width: 1px;
      height: 100%;
      vertical-align: middle;
    }
    
    .pushwoosh-${namespace}-popup__inner {
      display: inline-block;
      min-width: 320px;
      max-width: 380px;
      width: 100%;
      vertical-align: middle;
    }
    
    .pushwoosh-${namespace}-popup__body {
      background: #fff;
      text-align: left;
      vertical-align: baseline;
      box-shadow: 0px 10px 16px rgba(0, 0, 0, 0.1), 0px 0px 6px rgba(0, 0, 0, 0.06);
      border-radius: 4px;
    }
    
    .pushwoosh-${namespace}-popup__close {
      appearance: none;
      border: none;
      background-color: transparent;
      box-shadow: none;
      position: absolute;
      top: 24px;
      right: 24px;
      width: 40px;
      height: 40px;
      cursor: pointer;
    }
    
    .pushwoosh-${namespace}-popup__close:before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 30px;
      height: 2px;
      background-color: rgba(255, 255, 255, .8);
      transform: translateX(-50%) translateY(-50%) rotate(45deg);
    }
    
    .pushwoosh-${namespace}-popup__close:after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 30px;
      height: 2px;
      background-color: rgba(255, 255, 255, .8);
      transform: translateX(-50%) translateY(-50%) rotate(-45deg);
    }
  `;

  return styles;
};
