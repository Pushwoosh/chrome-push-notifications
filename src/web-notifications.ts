import PushwooshSingleton from './Pushwoosh';
import {getGlobal} from './functions';
import 'SubscribeWidget';
import './inboxWidget';
import './subscribePopup';

function main() {
  const global = getGlobal();

  let {Pushwoosh} = global;
  let predefinedCommands;

  if (Pushwoosh) {
    predefinedCommands = Pushwoosh;
  }

  Pushwoosh = new PushwooshSingleton();
  if (Array.isArray(predefinedCommands)) {
    predefinedCommands.forEach(c => Pushwoosh.push(c));
  }

  global.Pushwoosh = Pushwoosh;
}

if (document.readyState === 'complete') {
  main();
}
else {
  window.addEventListener('load', main);
}
