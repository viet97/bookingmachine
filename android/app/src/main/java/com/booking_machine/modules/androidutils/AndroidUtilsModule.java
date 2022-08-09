package com.booking_machine.modules.androidutils;

import androidx.annotation.Nullable;

import com.booking_machine.MainActivity;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.util.HashMap;
import java.util.Map;

import javax.annotation.Nonnull;

public class AndroidUtilsModule extends ReactContextBaseJavaModule {
    ReactApplicationContext _reactContext;

    public AndroidUtilsModule(@Nonnull ReactApplicationContext reactContext) {
        super(reactContext);
        _reactContext = reactContext;
    }

    @Nullable
    @Override
    public Map<String, Object> getConstants() {
        final Map<String, Object> constants = new HashMap<>();
        return constants;
    }

    @Nonnull
    @Override
    public String getName() {
        return "AndroidUtils";
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    public void closeKiosMode() {
        AndroidUtilsManager.getInstance().closeKiosMode();
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    public void clearDeviceOwner() {
        AndroidUtilsManager.getInstance().clearDeviceOwner();
    }

    @ReactMethod
    public void closeConnect(Promise promise) {
        AndroidUtilsManager.getInstance().closeConnect(promise);
    }

    @ReactMethod
    public void print(String pattern, Promise promise) {
        AndroidUtilsManager.getInstance().print(pattern, promise);
    }

    @ReactMethod
    public void scanAndConnectUsbPrinter(Promise promise) {
        AndroidUtilsManager.getInstance().scanAndConnect(promise);
    }

    @ReactMethod
    public void downLoadFileFromUrl(String name, String url,String checkSum, Promise promise) {
        MainActivity.getInstance().downLoadFileFromUrl(name,url,checkSum);
    }

    @ReactMethod
    public void downLoadServiceFileFromUrl(String name, String url,String checkSum, Promise promise) {
        MainActivity.getInstance().downLoadServiceFileFromUrl(name,url,checkSum);
    }

    @ReactMethod
    public void startLockMode() {
        MainActivity.getInstance().startLockMode();
    }
}

