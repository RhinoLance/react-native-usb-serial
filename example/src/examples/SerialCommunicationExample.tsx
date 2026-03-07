/**
 * Serial Communication Example
 * Demonstrates real-time serial data reading and writing
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  NativeEventEmitter,
} from 'react-native';
import {
  onReadInterval,
  offReadInterval,
  write,
  isConnected,
  type RawReadConfig,
} from '@rejaul/react-native-usb-serial';

interface SerialData {
  timestamp: number;
  data: string;
}

export default function SerialCommunicationExample() {
  const [isListening, setIsListening] = useState(false);
  const [serialData, setSerialData] = useState<SerialData[]>([]);
  const [commandInput, setCommandInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  /**
   * Start listening for serial data
   */
  const startListening = async () => {
    try {
      setError(null);

      // Check if device is connected
      const connected = await isConnected();
      if (!connected) {
        throw new Error('No device connected');
      }

      // Configure read parameters
      const config: RawReadConfig = {
        bufferSize: 2048, // 2KB buffer
        timeout: 1000, // 1 second timeout
      };

      // Start listening every 100ms
      await onReadInterval(100, config);
      setIsListening(true);

      // Subscribe to serial data events
      const eventEmitter = new NativeEventEmitter();
      const subscription = eventEmitter.addListener(
        'USB_SERIAL_DATA',
        (event: any) => {
          const newData: SerialData = {
            timestamp: Date.now(),
            data: event.data,
          };

          // Keep last 50 messages
          setSerialData((prev) => [newData, ...prev].slice(0, 50));
        }
      );

      // Return cleanup function for useEffect
      return () => {
        subscription.remove();
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return undefined;
    }
  };

  /**
   * Stop listening for serial data
   */
  const stopListening = async () => {
    try {
      await offReadInterval();
      setIsListening(false);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    }
  };

  /**
   * Send command to serial device
   */
  const sendCommand = async () => {
    if (!commandInput.trim()) {
      setError('Command cannot be empty');
      return;
    }

    try {
      setError(null);

      const connected = await isConnected();
      if (!connected) {
        throw new Error('Device not connected');
      }

      // Add line ending for common protocols
      const fullCommand = `${commandInput}\r\n`;

      await write(fullCommand);

      // Clear input
      setCommandInput('');

      // Log sent command
      const logData: SerialData = {
        timestamp: Date.now(),
        data: `[SENT] ${commandInput}`,
      };
      setSerialData((prev) => [logData, ...prev].slice(0, 50));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    }
  };

  /**
   * Clear serial data log
   */
  const clearLog = () => {
    setSerialData([]);
  };

  const formatTimestamp = (ms: number): string => {
    const date = new Date(ms);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  return (
    <View style={styles.container}>
      {/* Control Panel */}
      <View style={styles.controlPanel}>
        <TouchableOpacity
          style={[
            styles.button,
            isListening ? styles.buttonActive : styles.buttonInactive,
          ]}
          onPress={isListening ? stopListening : startListening}
        >
          <Text style={styles.buttonText}>
            {isListening ? 'Stop Listening' : 'Start Listening'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={clearLog}
        >
          <Text style={styles.buttonText}>Clear Log</Text>
        </TouchableOpacity>
      </View>

      {/* Status Indicator */}
      <View
        style={[
          styles.statusBar,
          isListening ? styles.statusActive : styles.statusInactive,
        ]}
      >
        <View
          style={[
            styles.statusIndicator,
            isListening && styles.statusIndicatorActive,
          ]}
        />
        <Text style={styles.statusText}>
          {isListening ? 'Listening for data...' : 'Not listening'}
        </Text>
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Serial Data Log */}
      <ScrollView style={styles.logContainer}>
        {serialData.length === 0 ? (
          <Text style={styles.emptyLog}>No data received yet</Text>
        ) : (
          serialData.map((item, index) => (
            <View key={index} style={styles.logEntry}>
              <Text style={styles.logTime}>
                {formatTimestamp(item.timestamp)}
              </Text>
              <Text
                style={[
                  styles.logData,
                  item.data.startsWith('[SENT]') && styles.logDataSent,
                ]}
              >
                {item.data}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* Command Input */}
      <View style={styles.commandPanel}>
        <TextInput
          style={styles.commandInput}
          placeholder="Enter command..."
          placeholderTextColor="#999"
          value={commandInput}
          onChangeText={setCommandInput}
          editable={isListening}
        />
        <TouchableOpacity
          style={[styles.sendButton, !isListening && styles.sendButtonDisabled]}
          onPress={sendCommand}
          disabled={!isListening}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  controlPanel: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonActive: {
    backgroundColor: '#FF3B30',
  },
  buttonInactive: {
    backgroundColor: '#34C759',
  },
  buttonSecondary: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  statusBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statusActive: {
    backgroundColor: '#f0fdf4',
  },
  statusInactive: {
    backgroundColor: '#fef2f2',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    marginRight: 8,
  },
  statusIndicatorActive: {
    backgroundColor: '#34C759',
  },
  statusText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  errorBox: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ffebee',
    borderLeftWidth: 3,
    borderLeftColor: '#FF3B30',
  },
  errorText: {
    color: '#c62828',
    fontSize: 12,
  },
  logContainer: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  emptyLog: {
    textAlign: 'center',
    color: '#999',
    marginTop: 32,
    fontSize: 14,
  },
  logEntry: {
    marginVertical: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#f9f9f9',
    borderLeftWidth: 2,
    borderLeftColor: '#007AFF',
    borderRadius: 4,
  },
  logTime: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
    marginBottom: 2,
  },
  logData: {
    fontSize: 13,
    color: '#222',
    fontFamily: 'Menlo',
  },
  logDataSent: {
    color: '#34C759',
    fontWeight: '600',
  },
  commandPanel: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#f5f5f5',
    gap: 8,
  },
  commandInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 14,
    backgroundColor: '#fff',
  },
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 6,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#999',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
