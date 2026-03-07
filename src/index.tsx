import UsbSerial from './NativeUsbSerial';

export function multiply(a: number, b: number): number {
  return UsbSerial.multiply(a, b);
}
