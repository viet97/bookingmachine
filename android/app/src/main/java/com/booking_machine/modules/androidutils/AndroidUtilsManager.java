package com.booking_machine.modules.androidutils;

import android.app.Activity;
import android.os.Build;
import android.util.Log;
import android.view.View;

import com.booking_machine.MainActivity;
import com.facebook.react.bridge.Promise;


public class AndroidUtilsManager {
    private static final AndroidUtilsManager instance = new AndroidUtilsManager();
    private String TAG = "AndroidUtilsManager";

    public static AndroidUtilsManager getInstance() {
        return instance;
    }

    public void closeKiosMode() {
        MainActivity.getInstance().closeKiosMode();
    }

    public void clearDeviceOwner() {
        MainActivity.getInstance().clearDeviceOwner();
    }

    public void closeConnect(Promise promise) {
        MainActivity.getInstance().closeConnectPrinter(promise);
    }

    public void scanAndConnect(Promise promise) {
        MainActivity.getInstance().scanAndConnectPrinter(promise);
    }

    public void print(String pattern, Promise promise) {
        MainActivity.getInstance().print(pattern, promise);
    }
}
