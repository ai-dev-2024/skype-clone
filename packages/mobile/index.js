/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './src/App';
import {name as appName} from './package.json';

// Initialize push notifications
import pushNotificationService from './src/services/pushNotifications';
pushNotificationService.initialize();
pushNotificationService.createNotificationChannels();

AppRegistry.registerComponent(appName, () => App);
