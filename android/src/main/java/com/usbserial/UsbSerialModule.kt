package com.usbserial

import com.facebook.react.bridge.ReactApplicationContext

class UsbSerialModule(reactContext: ReactApplicationContext) :
  NativeUsbSerialSpec(reactContext) {

  override fun multiply(a: Double, b: Double): Double {
    return a * b
  }

  companion object {
    const val NAME = NativeUsbSerialSpec.NAME
  }
}
