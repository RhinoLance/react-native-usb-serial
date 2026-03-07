/**
 * Soil Sensor Monitoring Example
 * Demonstrates reading modbus soil sensor data
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  NativeEventEmitter,
} from 'react-native';
import {
  readSoilData,
  onReadSoilDataInterval,
  offReadSoilDataInterval,
  type SoilSensorConfig,
  type SoilData,
} from '@rejaul/react-native-usb-serial';

interface SensorReading {
  timestamp: number;
  data: SoilData;
}

export default function SoilSensorExample() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [error, setError] = useState<string | null>(null);

  /**
   * Read soil sensor data once
   */
  const readOnce = async () => {
    try {
      setError(null);

      const config: SoilSensorConfig = {
        slaveId: 1,
        startAddress: 0x0000,
        registerCount: 8,
        responseDelayMs: 300,
      };

      const data = await readSoilData(config);

      if (data) {
        const reading: SensorReading = {
          timestamp: Date.now(),
          data,
        };
        setReadings((prev) => [reading, ...prev].slice(0, 20));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    }
  };

  /**
   * Start continuous monitoring
   */
  const startMonitoring = async () => {
    try {
      setError(null);

      const config: SoilSensorConfig = {
        slaveId: 1,
        startAddress: 0x0000,
        registerCount: 8,
        responseDelayMs: 300,
      };

      // Start reading every 500ms
      await onReadSoilDataInterval(500, config);
      setIsMonitoring(true);

      // Listen to soil data events
      const eventEmitter = new NativeEventEmitter();
      const subscription = eventEmitter.addListener(
        'USB_SOIL_DATA',
        (event: any) => {
          const reading: SensorReading = {
            timestamp: Date.now(),
            data: event,
          };
          setReadings((prev) => [reading, ...prev].slice(0, 50));
        }
      );

      return () => subscription.remove();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return undefined;
    }
  };

  /**
   * Stop monitoring
   */
  const stopMonitoring = async () => {
    try {
      await offReadSoilDataInterval();
      setIsMonitoring(false);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    }
  };

  const formatTimestamp = (ms: number): string => {
    const date = new Date(ms);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const renderSensorValue = (label: string, value: number | undefined) => {
    return (
      <View style={styles.valueItem}>
        <Text style={styles.valueLabel}>{label}</Text>
        <Text style={styles.valueNumber}>
          {value !== undefined ? value.toFixed(2) : 'N/A'}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Control Panel */}
      <View style={styles.controlPanel}>
        <TouchableOpacity
          style={[
            styles.button,
            isMonitoring ? styles.buttonActive : styles.buttonInactive,
          ]}
          onPress={isMonitoring ? stopMonitoring : startMonitoring}
        >
          <Text style={styles.buttonText}>
            {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={readOnce}
        >
          <Text style={styles.buttonText}>Read Once</Text>
        </TouchableOpacity>
      </View>

      {/* Status */}
      <View
        style={[
          styles.statusBar,
          isMonitoring ? styles.statusActive : styles.statusInactive,
        ]}
      >
        <View
          style={[
            styles.statusIndicator,
            isMonitoring && styles.statusIndicatorActive,
          ]}
        />
        <Text style={styles.statusText}>
          {isMonitoring
            ? `Monitoring (${readings.length} readings)`
            : 'Not monitoring'}
        </Text>
      </View>

      {/* Error */}
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Readings */}
      <ScrollView style={styles.readingsContainer}>
        {readings.length === 0 ? (
          <Text style={styles.emptyText}>No readings yet</Text>
        ) : (
          readings.map((reading, index) => (
            <View key={index} style={styles.readingCard}>
              <View style={styles.readingHeader}>
                <Text style={styles.readingTime}>
                  {formatTimestamp(reading.timestamp)}
                </Text>
              </View>

              <View style={styles.valuesGrid}>
                {renderSensorValue('Moisture', reading.data.moisture)}
                {renderSensorValue('Temperature', reading.data.temperature)}
                {renderSensorValue('EC', reading.data.ec)}
                {renderSensorValue('pH', reading.data.ph)}
              </View>
            </View>
          ))
        )}
      </ScrollView>
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
  readingsContainer: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 32,
    fontSize: 14,
  },
  readingCard: {
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#34C759',
  },
  readingHeader: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  readingTime: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  valuesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  valueItem: {
    width: '48%',
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
    borderRadius: 6,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  valueLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
  },
  valueNumber: {
    fontSize: 16,
    color: '#222',
    fontWeight: '700',
  },
});
