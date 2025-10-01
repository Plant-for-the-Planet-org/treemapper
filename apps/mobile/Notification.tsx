// components/NotificationSettings.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { OneSignal } from 'react-native-onesignal';

interface NotificationSettingsProps {}

export const NotificationSettings: React.FC<NotificationSettingsProps> = () => {
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [isOptedIn, setIsOptedIn] = useState<boolean>(false);
  const [onesignalId, setOnesignalId] = useState<string | null>(null);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    checkPermissionStatus();
    getOneSignalData();
  }, []);

  const checkPermissionStatus = async () => {
    try {
      const permission = await OneSignal.Notifications.getPermissionAsync();
      const optedIn = await OneSignal.User.pushSubscription.getOptedInAsync();
      
      setHasPermission(permission);
      setIsOptedIn(optedIn);
    } catch (error) {
      console.error('Error checking permission status:', error);
    }
  };

  const getOneSignalData = async () => {
    try {
      const id = await OneSignal.User.getOnesignalId();
      const token = await OneSignal.User.pushSubscription.getTokenAsync();
      
      setOnesignalId(id);
      setPushToken(token);
    } catch (error) {
      console.error('Error getting OneSignal data:', error);
    }
  };

  const requestPermission = async () => {
    setLoading(true);
    try {
      const granted = await OneSignal.Notifications.requestPermission(true);
      
      if (granted) {
        Alert.alert('Success', 'Notification permission granted!');
        await checkPermissionStatus();
        await getOneSignalData();
      } else {
        Alert.alert('Permission Denied', 'Notification permission was not granted.');
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      Alert.alert('Error', 'Failed to request notification permission.');
    } finally {
      setLoading(false);
    }
  };

  const toggleOptInOut = () => {
    try {
      if (isOptedIn) {
        OneSignal.User.pushSubscription.optOut();
        Alert.alert('Opted Out', 'You have been opted out of push notifications.');
      } else {
        OneSignal.User.pushSubscription.optIn();
        Alert.alert('Opted In', 'You have been opted in to push notifications.');
      }
      
      // Update status after a short delay
      setTimeout(checkPermissionStatus, 1000);
    } catch (error) {
      console.error('Error toggling opt-in status:', error);
    }
  };

  const addTestTags = () => {
    try {
      const testTags = {
        'user_type': 'premium',
        'last_login': new Date().toISOString(),
        'app_version': '2.0.6'
      };
      
      OneSignal.User.addTags(testTags);
      Alert.alert('Success', 'Test tags added successfully!');
    } catch (error) {
      console.error('Error adding test tags:', error);
      Alert.alert('Error', 'Failed to add test tags.');
    }
  };

  const simulateUserLogin = () => {
    try {
      // Example: Login with a test external ID
      const testExternalId = `user_${Date.now()}`;
      OneSignal.login(testExternalId);
      
      Alert.alert('User Login', `Logged in with external ID: ${testExternalId}`);
      
      // Refresh OneSignal data after login
      setTimeout(getOneSignalData, 2000);
    } catch (error) {
      console.error('Error logging in user:', error);
      Alert.alert('Error', 'Failed to log in user.');
    }
  };

  const simulateUserLogout = () => {
    try {
      OneSignal.logout();
      Alert.alert('User Logout', 'User has been logged out.');
      
      // Refresh OneSignal data after logout
      setTimeout(getOneSignalData, 2000);
    } catch (error) {
      console.error('Error logging out user:', error);
      Alert.alert('Error', 'Failed to log out user.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>OneSignal Notification Settings</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Permission Status:</Text>
        <Text style={[styles.statusValue, { color: hasPermission ? 'green' : 'red' }]}>
          {hasPermission ? 'Granted' : 'Not Granted'}
        </Text>
      </View>

      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Opt-in Status:</Text>
        <Text style={[styles.statusValue, { color: isOptedIn ? 'green' : 'red' }]}>
          {isOptedIn ? 'Opted In' : 'Opted Out'}
        </Text>
      </View>

      <View style={styles.dataContainer}>
        <Text style={styles.dataLabel}>OneSignal ID:</Text>
        <Text style={styles.dataValue}>{onesignalId || 'Not available'}</Text>
      </View>

      <View style={styles.dataContainer}>
        <Text style={styles.dataLabel}>Push Token:</Text>
        <Text style={styles.dataValue} numberOfLines={2}>
          {pushToken ? `${pushToken.substring(0, 40)}...` : 'Not available'}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title={loading ? 'Requesting...' : 'Request Permission'}
          onPress={requestPermission}
          disabled={loading || hasPermission}
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title={isOptedIn ? 'Opt Out' : 'Opt In'}
          onPress={toggleOptInOut}
          disabled={!hasPermission}
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Add Test Tags"
          onPress={addTestTags}
          color="#007AFF"
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Simulate User Login"
          onPress={simulateUserLogin}
          color="#34C759"
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Simulate User Logout"
          onPress={simulateUserLogout}
          color="#FF3B30"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  dataContainer: {
    marginVertical: 10,
  },
  dataLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
  },
  dataValue: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonContainer: {
    marginVertical: 8,
  },
});