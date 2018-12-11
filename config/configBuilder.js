const fs = require('fs');
const path = require('path');


const BASE_PATH = '__base__';


// Utils
function parseEnvKey(key) {
  return key
    .slice(3)
    .replace(/__/g, '.')
    .split('.');
}

function castEnvValueTypes(value) {
  switch (value) {
    case 'true':
      return true;
    case 'false':
      return false;
    default:
      return value;
  }
}

function setValueByPath(path, obj, value) {
  let tmpConfig = obj;
  path.forEach((pathPart, i) => {
    if (!(pathPart in tmpConfig)) {
      tmpConfig[pathPart] = {};
    }

    if (i === path.length - 1) {
      tmpConfig[pathPart] = value;
    }
    else {
      tmpConfig = tmpConfig[pathPart];
    }
  });
}

function buildObjectsMap(object, path=BASE_PATH) {
  const objMap = {[path]: Object.assign({}, object)};
  Object.keys(object).forEach(key => {
    if (object[key] !== null && !Array.isArray(object[key]) && typeof object[key] === 'object') {
      delete objMap[path][key];
      Object.assign(objMap, buildObjectsMap(object[key], `${path}.${key}`));
    }
  });
  return objMap;
}

function configDeepAssign(...configs) {
  const [baseConfig, ...anotherConfigs] = configs;

  // Make result config map
  const resConfigMap = buildObjectsMap(baseConfig);
  anotherConfigs.forEach(config => {
    const configMap = buildObjectsMap(config);
    Object.keys(configMap).forEach(key => {
      if (key in resConfigMap) {
        Object.assign(resConfigMap[key], configMap[key]);
        delete configMap[key];
      }
    });
    Object.assign(resConfigMap, configMap);
  });

  // Make config from map
  const result = {};
  Object.keys(resConfigMap).forEach(key => {
    if (key === BASE_PATH) {
      Object.assign(result, resConfigMap[key]);
    }
    else {
      const path = key.replace(`${BASE_PATH}.`, '').split('.');
      setValueByPath(path, result, resConfigMap[key]);
    }
  });

  return result;
}


// Config Getters
function getEnvironmentConfig() {
  const envConfig = {};
  Object.keys(process.env).forEach(envKey => {
    if (!envKey.startsWith('PW_')) {
      return;
    }

    const path = parseEnvKey(envKey);
    const value = castEnvValueTypes(process.env[envKey]);
    setValueByPath(path, envConfig, value);
  });
  return envConfig;
}


// Configs
const defaultConfig = require(path.resolve(__dirname, 'config.js'));  // Default

const configPath = process.env.GUI_CONFIG_PRESET_NAME
  ? path.resolve(__dirname, `config.${process.env.GUI_CONFIG_PRESET_NAME}.js`)
  : '';
const presetConfig = fs.existsSync(configPath) ? require(configPath) : {};  // Preset


const LOCAL_CONFIG_PATH = path.resolve(__dirname, 'config.local.js');
const localConfig = fs.existsSync(LOCAL_CONFIG_PATH) && process.env.NODE_ENV !== 'production'
  ? require(LOCAL_CONFIG_PATH)
  : {};  // Local


const fileConfig = {};  // Custom file


const envConfig = getEnvironmentConfig();  // Environment

const QA_CONFIG_PATH = path.resolve(__dirname, 'config.qa.js');
const qaConfig = fs.existsSync(QA_CONFIG_PATH) ? require(QA_CONFIG_PATH) : {};  // QA

// Build result config
const config = configDeepAssign(
  defaultConfig,
  presetConfig,
  localConfig,
  fileConfig,
  envConfig,
  qaConfig
);

module.exports = config;

