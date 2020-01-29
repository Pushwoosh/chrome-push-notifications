export const STYLES = document.createElement('style');

STYLES.innerHTML = `
  .pushwoosh-safari-subscription-segments {
    display: none;
    -webkit-box-sizing: border-box;
            box-sizing: border-box;
    line-height: 1.25;
    font-size: 14px;
    position: fixed;
    opacity: 0.999;
    z-index: 999999999999;
    left: 0;
    right: 0;
    top: 0;
    width: 532px;
    padding: 16px 20px;
    margin: 0 auto;
    background: #f0f0f0;
    color: #3e3e3e;
    border: 1px solid #bbbbbb;
    -webkit-box-shadow: 0 2px 24px rgba(0,0,0,.4);
            box-shadow: 0 2px 24px rgba(0,0,0,.4);
    font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial,sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol;
  }
  
  .show .pushwoosh-safari-subscription-segments {
    display: block;
  }
  
  .pushwoosh-safari-subscription-segments__header {
    font-size: 18px;
    font-weight: bold;
    margin: 0 0 16px;
  }
  
  .pushwoosh-safari-subscription-segments__sub-header {
    font-size: 14px;
    font-weight: bold;
    margin: 0 0 12px;
  }
  
  .pushwoosh-safari-subscription-segments__sub-header:empty {
    display: none;
  }
  
  .pushwoosh-safari-subscription-segments__channel + .pushwoosh-safari-subscription-segments__channel {
    margin-top: 4px;
  }
  
  .pushwoosh-safari-subscription-segments__channel label {
    cursor: pointer;
    -webkit-user-select: none;
       -moz-user-select: none;
        -ms-user-select: none;
            user-select: none;
  }
  
  .pushwoosh-safari-subscription-segments__text {
    margin: 0 0 0 4px;
  }
  
  .pushwoosh-safari-subscription-segments__controls {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-pack: end;
        -ms-flex-pack: end;
            justify-content: flex-end;
    margin: 16px -4px 0;
  }
  
  #pushwoosh-safari-subscription-segments-cancel {
    font-size: 14px;
    margin: 0 4px;
    padding: 4px 16px;
    background-color: #ffffff;
    border: 1px solid #bbbbbb;
    border-radius: 4px;
    cursor: pointer;
    -webkit-box-shadow: 0px 2px 3px -1px rgba(0, 0, 0, 0.2);
            box-shadow: 0px 2px 3px -1px rgba(0, 0, 0, 0.2);
  }
  
  #pushwoosh-safari-subscription-segments-accept {
    font-size: 14px;
    margin: 0 4px;
    padding: 8px 16px;
    background-color: #458efa;
    background-image:  -webkit-gradient(linear, left top, left bottom, from(rgba(69,142,250,1)), to(rgba(56,123,217,1)));
    background-image:  -o-linear-gradient(top, rgba(69,142,250,1) 0%, rgba(56,123,217,1) 100%);
    background-image:  linear-gradient(to bottom, rgba(69,142,250,1) 0%, rgba(56,123,217,1) 100%);
    border: 1px solid #5094f7;
    border-radius: 4px;
    color: #ffffff;
    font-weight: bold;
    cursor: pointer;
    -webkit-box-shadow: 0px 2px 3px -1px rgba(0, 0, 0, 0.2);
            box-shadow: 0px 2px 3px -1px rgba(0, 0, 0, 0.2);
  }
`;
