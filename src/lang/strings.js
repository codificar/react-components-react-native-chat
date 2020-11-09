import { NativeModules } from 'react-native';

var strings = require('./pt_BR.json');

const deviceLanguage =
    Platform.OS === 'ios' 
    ? 
        NativeModules.SettingsManager.settings.AppleLocale ||
        NativeModules.SettingsManager.settings.AppleLanguages[0]
    : 
        NativeModules.I18nManager.localeIdentifier;

if (deviceLanguage == 'en_US')
    strings = require('./en.json');

export default strings;