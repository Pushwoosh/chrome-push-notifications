export const getHTML = (content: { [key: string]: string }, segments: { [key: string]: string | number }[]): string => {
  return `
  <div class="pushwoosh-subscription-segments">
    <div class="pushwoosh-subscription-segments__header">
      ${content.headerText}
    </div>
    <div class="pushwoosh-subscription-segments__body">
      <div class="pushwoosh-subscription-segments__sub-header">
        ${content.subHeaderText ? content.subHeaderText : ''}
      </div>
      <div class="pushwoosh-subscription-segments__channels">
        ${segments.reduce((result, segment): string => {
          return result + `<div class="pushwoosh-subscription-segments__channel">
            <label class="pushwoosh-subscription-segments__label">
              <input
                class="pushwoosh-subscription-segments__field" 
                type="checkbox" 
                value="${segment.code}"
                checked="true"
              />
              <span class="pushwoosh-subscription-segments__icon">
                <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18.0303 8.46967C18.3232 8.76256 18.3232 9.23744 18.0303 9.53033L11.0303 16.5303C10.7374 16.8232 10.2626 16.8232 9.96967 16.5303L6.96967 13.5303C6.67678 13.2374 6.67678 12.7626 6.96967 12.4697C7.26256 12.1768 7.73744 12.1768 8.03033 12.4697L10.5 14.9393L16.9697 8.46967C17.2626 8.17678 17.7374 8.17678 18.0303 8.46967Z" fill="currentColor"/>
                  </svg>
              </span>
              <span class="pushwoosh-subscription-segments__text">
                ${segment.name}
              </span>
            </label>
          </div>`
        }, '')}
      </div>
      <div class="pushwoosh-subscription-segments__controls">
        <button type="button" id="pushwoosh-subscription-segments-deny" class="pushwoosh-subscription-segments__control pushwoosh-subscription-segments__control_deny">
          ${content.controlsDenyButtonText}
        </button>
        <button type="button" id="pushwoosh-subscription-segments-accept" class="pushwoosh-subscription-segments__control pushwoosh-subscription-segments__control_accept">
          ${content.controlsButtonText}
        </button>
      </div>
    </div>
  </div>
  `;
};

export const getStyles = () => {
  const styles = document.createElement('style');

  styles.innerHTML = `
    .pushwoosh-subscription-segments * {
      box-sizing: border-box!important;
    }
  
    .pushwoosh-subscription-segments {
      padding: 24px 16px 16px 24px!important;
      user-select: none!important;
    }
  
    .pushwoosh-subscription-segments__header {
      font-weight: bold!important;
      font-size: 20px!important;
      line-height: 23px!important;
    }
    
    .pushwoosh-subscription-segments__sub-header {
      margin-top: 16px!important;
      font-size: 16px!important;
      line-height: 24px!important;
      color: rgba(0, 0, 0, 0.54)!important;
    }
    
    .pushwoosh-subscription-segments__sub-header:empty {
      display:none!important;
    }
    
    .pushwoosh-subscription-segments__channels {
      margin-top: 16px!important;
      font-size: 16px!important;
      line-height: 24px!important;
    }
    
    .pushwoosh-subscription-segments__channel + .pushwoosh-subscription-segments__channel {
      margin-top: 8px!important;
    }
    
    .pushwoosh-subscription-segments__label {
      display: inline-flex!important;
      align-items: flex-start!important;
      cursor: pointer!important;
    }
    
    .pushwoosh-subscription-segments__field {
      display: none!important;
    }
    
    .pushwoosh-subscription-segments__icon {
      display: block!important;
      line-height: 0!important;
      width: 20px!important;
      height: 20px!important;
      border: 1px solid #ddd!important;
      border-radius: 4px!important;
      color: #fff!important;
      margin: 2px 8px 0 0!important;
    }
    
    .pushwoosh-subscription-segments__text {
      color: rgba(0, 0, 0, 0.54)!important;
    }
    
    .pushwoosh-subscription-segments__controls {
      margin-top: 24px!important;
      text-align: right!important;
    }
    
    .pushwoosh-subscription-segments__field:checked + .pushwoosh-subscription-segments__icon {
      background: #4186F3!important;
      border: 1px solid transparent!important;
    }
    
    .pushwoosh-subscription-segments__control {
      appearance: none!important;
      height: 36px!important;
      border-radius: 4px!important;
      padding: 0 16px!important;
      font-weight: bold!important;
      font-size: 14px!important;
      line-height: 16px!important;
      cursor: pointer!important;
    }
    
    .pushwoosh-subscription-segments__control + .pushwoosh-subscription-segments__control {
      margin: 0 0 0 4px!important;
    }
    
    .pushwoosh-subscription-segments__control.pushwoosh-subscription-segments__control_deny {
      border: 1px solid #ddd!important;
      color: #4186F3!important;
    }
    
    .pushwoosh-subscription-segments__control.pushwoosh-subscription-segments__control_accept {
      border: none!important;
      background: #4186F3!important;
      color: #fff!important;
    }
  `;

  return styles;
};

