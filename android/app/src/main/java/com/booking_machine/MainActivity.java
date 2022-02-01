package com.booking_machine;

import android.app.PendingIntent;
import android.app.admin.DevicePolicyManager;
import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbManager;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.view.WindowManager;

import androidx.annotation.RequiresApi;

import com.dantsu.escposprinter.EscPosPrinter;
import com.dantsu.escposprinter.connection.usb.UsbConnection;
import com.dantsu.escposprinter.connection.usb.UsbPrintersConnections;
import com.dantsu.escposprinter.exceptions.EscPosBarcodeException;
import com.dantsu.escposprinter.exceptions.EscPosConnectionException;
import com.dantsu.escposprinter.exceptions.EscPosEncodingException;
import com.dantsu.escposprinter.exceptions.EscPosParserException;
import com.facebook.react.ReactActivity;
import com.facebook.react.bridge.Promise;

public class MainActivity extends ReactActivity {
    private static final String TAG = "MainActivity";
    private static final String ACTION_USB_PERMISSION = "com.vidoctor.USB_PERMISSION";
    private UsbManager usbManager;
    private UsbDevice usbDevice;
    private Promise promise;
    private EscPosPrinter printer;
    private final BroadcastReceiver usbReceiver = new BroadcastReceiver() {
        public void onReceive(Context context, Intent intent) {
            String action = intent.getAction();
            if (MainActivity.ACTION_USB_PERMISSION.equals(action)) {
                synchronized (this) {
                    usbManager = (UsbManager) getSystemService(Context.USB_SERVICE);
                    usbDevice = intent.getParcelableExtra(UsbManager.EXTRA_DEVICE);
                    if (intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false)) {
                        if (usbManager != null && usbDevice != null) {
                            //connect success
                            if (promise != null) {
                                promise.resolve(null);
                                promise = null;
                            }
                        }
                    }
                }
            }
            if (promise != null) {
                promise.reject(new Throwable());
                promise = null;
            }
        }
    };

    public void scanAndConnectPrinter(Promise promise) {
        UsbConnection usbConnection = UsbPrintersConnections.selectFirstConnected(this);
        UsbManager usbManager = (UsbManager) this.getSystemService(Context.USB_SERVICE);
        if (usbConnection != null && usbManager != null) {
            Log.d(TAG, "scanAndConnectPrinter: ");
            PendingIntent permissionIntent = PendingIntent.getBroadcast(this, 0, new Intent(MainActivity.ACTION_USB_PERMISSION), 0);
            usbManager.requestPermission(usbConnection.getDevice(), permissionIntent);
            this.promise = promise;
        }
    }

    public void closeConnectPrinter(Promise promise) {
        usbDevice = null;
        usbManager = null;
        if (printer == null) {
            promise.resolve(null);
            return;
        }
        printer.disconnectPrinter();
        promise.resolve(null);
    }

    public void print(String pattern, Promise promise) {
        if (usbManager == null || usbDevice == null) return;
        printer = null;
        try {
            printer = new EscPosPrinter(new UsbConnection(usbManager, usbDevice), 203, 48f, 48);

            printer
                    .printFormattedTextAndCut(
                            pattern,
                            500
                    );
            promise.resolve(null);
        } catch (EscPosConnectionException | EscPosBarcodeException | EscPosEncodingException | EscPosParserException e) {
            e.printStackTrace();
            promise.reject(new Throwable());
        }
    }

    private DevicePolicyManager dpm;
    private ComponentName adminName;
    private static MainActivity instance;

    public static MainActivity getInstance() {
        return instance;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        IntentFilter filter = new IntentFilter(MainActivity.ACTION_USB_PERMISSION);
        registerReceiver(this.usbReceiver, filter);
        instance = this;
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        instance = null;
    }

    private void setupDPM() {
        this.dpm = (DevicePolicyManager) getSystemService(Context.DEVICE_POLICY_SERVICE);
        adminName = new ComponentName(this, AdminReceiver.class);
    }

    @RequiresApi(api = Build.VERSION_CODES.O)
    private void enableLockMode() {
        setupDPM();
        if (dpm == null || !dpm.isDeviceOwnerApp(getPackageName())) return;
        dpm.setLockTaskPackages(adminName, new String[]{getPackageName(), "com.sample.child"});
        if (dpm.isLockTaskPermitted(getPackageName())) {
            startLockTask();
        }
    }

    public void closeKiosMode() {
        stopLockTask();
    }

    public void clearDeviceOwner() {
        dpm.clearDeviceOwnerApp(getPackageName());
    }

    @RequiresApi(api = Build.VERSION_CODES.O)
    @Override
    protected void onResume() {
        super.onResume();
        enableLockMode();
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        final int flags = View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_IMMERSIVE
                | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY;
        getWindow().getDecorView().setSystemUiVisibility(flags);
    }

    /**
     * Returns the name of the main component registered from JavaScript. This is used to schedule
     * rendering of the component.
     */

    @Override
    protected String getMainComponentName() {
        return "booking_machine";
    }
}
