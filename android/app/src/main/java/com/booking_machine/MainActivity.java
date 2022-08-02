package com.booking_machine;

import android.Manifest;
import android.app.DownloadManager;
import android.app.PendingIntent;
import android.app.admin.DevicePolicyManager;
import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageInstaller;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.util.Log;
import android.view.KeyEvent;
import android.view.View;
import android.view.WindowManager;

import androidx.annotation.Nullable;
import androidx.annotation.RequiresApi;
import androidx.core.app.ActivityCompat;
import androidx.core.content.FileProvider;

import com.dantsu.escposprinter.EscPosPrinter;
import com.dantsu.escposprinter.connection.usb.UsbConnection;
import com.dantsu.escposprinter.connection.usb.UsbPrintersConnections;
import com.dantsu.escposprinter.exceptions.EscPosBarcodeException;
import com.dantsu.escposprinter.exceptions.EscPosConnectionException;
import com.dantsu.escposprinter.exceptions.EscPosEncodingException;
import com.dantsu.escposprinter.exceptions.EscPosParserException;
import com.facebook.react.ReactActivity;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.security.MessageDigest;

public class MainActivity extends ReactActivity {
    private static final String TAG = "MainActivity-Vidoctor";
    private static final String ACTION_USB_PERMISSION = "com.vidoctor.USB_PERMISSION";

    private UsbManager usbManager;
    private UsbDevice usbDevice;
    private Promise promise;
    private EscPosPrinter printer;
    private long downloadId;
    private long serviceDownloadId;
    private String downloadLocation;
    private String serviceDownloadLocation;
    private String uiCheckSum;
    private String serviceCheckSum;
    int PERMISSION_ALL = 1;
    private String fileName;
    private String serviceFileName;
    String[] PERMISSIONS = {
            android.Manifest.permission.WRITE_EXTERNAL_STORAGE,
            android.Manifest.permission.READ_EXTERNAL_STORAGE,
    };

    public boolean hasPermissions(String... permissions) {
        for (String permission : permissions) {
            if (ActivityCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED) {
                return false;
            }
        }
        return true;
    }


    private final BroadcastReceiver usbDetect = new BroadcastReceiver() {
        public void onReceive(Context context, Intent intent) {
            String action = intent.getAction();

            if (action.equalsIgnoreCase(UsbManager.ACTION_USB_DEVICE_ATTACHED)){
                sendEvent("onPrinterAttached",null);
                return;
            }
            if (action.equalsIgnoreCase(UsbManager.ACTION_USB_DEVICE_DETACHED)){
                sendEvent("onPrinterDetached",null);
            }
        }
    };


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
    private String barcode = "";

    @Override
    public boolean dispatchKeyEvent(KeyEvent e) {
        Log.d(TAG, "dispatchKeyEvent: ");
        if (e.getAction() == KeyEvent.ACTION_DOWN) {
            char pressedKey = (char) e.getUnicodeChar();
            barcode += pressedKey;
        }
        if (e.getAction() == KeyEvent.ACTION_DOWN && e.getKeyCode() == KeyEvent.KEYCODE_ENTER) {
            sendEvent("onBarcodeScan",  barcode.replaceAll("\\P{Print}", ""));
            barcode = "";
        }
        return super.dispatchKeyEvent(e);
    }

    public void scanAndConnectPrinter(Promise promise) {
        UsbConnection usbConnection = UsbPrintersConnections.selectFirstConnected(this);
        UsbManager usbManager = (UsbManager) this.getSystemService(Context.USB_SERVICE);
        Log.d(TAG, "scanAndConnectPrinter: " + usbConnection + " : " + usbManager);
        if (usbConnection != null && usbManager != null) {
            sendEvent("alreadyAttachedPrinter",null);

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
        IntentFilter usbDetectFilter = new IntentFilter();
        usbDetectFilter.addAction(UsbManager.ACTION_USB_DEVICE_ATTACHED);
        usbDetectFilter.addAction(UsbManager.ACTION_USB_DEVICE_DETACHED);
        registerReceiver(this.usbDetect, usbDetectFilter);
        registerReceiver(downloadComplete,new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE));
        registerReceiver(serviceDownloadComplete,new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE));

        instance = this;
        if(!hasPermissions(this.PERMISSIONS)){
            ActivityCompat.requestPermissions(this, PERMISSIONS, PERMISSION_ALL);
            return;
        }
         setupDPM();
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if(requestCode == PERMISSION_ALL){
            for (int grantResult : grantResults) {
                Log.d(TAG, "onRequestPermissionsResult: "+requestCode + " : " + grantResult);

                if (grantResult != PackageManager.PERMISSION_GRANTED) {
                    return;
                }
            }
        }
    }

    private final BroadcastReceiver downloadComplete = new BroadcastReceiver() {
        public void onReceive(Context context, Intent intent) {
            long id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1);
            if(id == downloadId){
                try {
                    openApkFile(false);
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
    };
    private final BroadcastReceiver serviceDownloadComplete = new BroadcastReceiver() {
        public void onReceive(Context context, Intent intent) {
            long id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1);
            if(id == serviceDownloadId){
                try {
                    openApkFile(true);
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
    };

    public void copyStream(InputStream input, OutputStream output)
            throws IOException
    {
        byte[] buffer = new byte[1024];
        int len;
        while ((len = input.read(buffer)) != -1) {
            output.write(buffer, 0, len);
        }
    }

    private String fileToMD5(File file) {
        InputStream inputStream = null;
        try {
            inputStream = new FileInputStream(file);
            byte[] buffer = new byte[1024];
            MessageDigest digest = MessageDigest.getInstance("SHA1");
            int numRead = 0;
            while (numRead != -1) {
                numRead = inputStream.read(buffer);
                if (numRead > 0)
                    digest.update(buffer, 0, numRead);
            }
            Log.d(TAG, "fileToMD5: " + digest);
            byte [] md5Bytes = digest.digest();
            return convertHashToString(md5Bytes);
        } catch (Exception e) {
            return null;
        } finally {
            if (inputStream != null) {
                try {
                    inputStream.close();
                } catch (Exception e) { }
            }
        }
    }

    private String convertHashToString(byte[] md5Bytes) {
        String returnVal = "";
        for (int i = 0; i < md5Bytes.length; i++) {
            returnVal += Integer.toString(( md5Bytes[i] & 0xff ) + 0x100, 16).substring(1);
        }
        return returnVal.toUpperCase();
    }

    private void openApkFile(boolean isService) throws IOException {
        // PackageManager provides an instance of PackageInstaller
        PackageInstaller packageInstaller = getPackageManager().getPackageInstaller();
        File dir =
                Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
        File apk = new File(dir,isService ? this.serviceFileName: this.fileName);
        String correctCheckSum = isService ? this.serviceCheckSum : this.uiCheckSum;
        String checksum = fileToMD5(apk);
        if(!checksum.equalsIgnoreCase(correctCheckSum)){
            return;
        }
        // Prepare params for installing one APK file with MODE_FULL_INSTALL
        // We could use MODE_INHERIT_EXISTING to install multiple split APKs
        PackageInstaller.SessionParams params = new PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL);
        params.setAppPackageName(isService ? "vn.vidoctor.queuebridge" : getPackageName());

        // Get a PackageInstaller.Session for performing the actual update
        int sessionId = 0;
        try {
            sessionId = packageInstaller.createSession(params);
        } catch (IOException e) {
            e.printStackTrace();
        }

        PackageInstaller.Session session = null;
        try {
            session = packageInstaller.openSession(sessionId);
        } catch (IOException e) {
            e.printStackTrace();
        }
        if(session == null) return;

        // Copy APK file bytes into OutputStream provided by install Session
        OutputStream out = null;
        try {
            out = session.openWrite(isService ? "vn.vidoctor.queuebridge" : getPackageName(), 0, -1);
        } catch (IOException e) {
            e.printStackTrace();
        }

        InputStream fis = null;

        try {
            fis = new FileInputStream(apk);
        } catch (FileNotFoundException e) {
            e.printStackTrace();
        }
        if(fis == null) return;
        copyStream(fis,out);
        try {
            session.fsync(out);
        } catch (IOException e) {
            e.printStackTrace();
        }
        try {
            out.close();
            fis.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
        Log.d(TAG, "openApkFile: done");
        // The app gets killed after installation session commit
        session.commit(PendingIntent.getBroadcast(this, sessionId,
                new Intent("android.intent.action.MAIN"), 0).getIntentSender());
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
        dpm.setLockTaskPackages(adminName, new String[]{getPackageName(), "com.android.systemui"});
        if (dpm.isLockTaskPermitted(getPackageName())) {
            startLockTask();
        }
    }

    public void closeKiosMode() {
        stopLockTask();
    }

    public void clearDeviceOwner() {
        if (dpm == null || !dpm.isDeviceOwnerApp(getPackageName())) return;
        dpm.clearDeviceOwnerApp(getPackageName());
    }


    public void downLoadFileFromUrl(String name, String url,String checkSum){
        this.fileName = name;
        if(!hasPermissions(this.PERMISSIONS)){
            ActivityCompat.requestPermissions(this, PERMISSIONS, PERMISSION_ALL);
            return;
        }
        DownloadManager downloadManager = (DownloadManager) this.getSystemService(DOWNLOAD_SERVICE);
        Uri uri = Uri.parse(url);
        File dir =
                Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
        Uri downloadLocation = Uri.fromFile(new File(dir,name));
        this.downloadLocation =  downloadLocation.toString();
        File oldFile = new File(dir , name);
        this.uiCheckSum = checkSum;
        if(oldFile.exists()){
            try {
                openApkFile(false);
            } catch (IOException e) {
                e.printStackTrace();
            }
            return;
        }
        dir.mkdirs();

        DownloadManager.Request request = new DownloadManager.Request(uri)
                .setTitle(this.fileName)
                .setDescription("Downloading " + this.fileName)
                .setAllowedNetworkTypes(DownloadManager.Request.NETWORK_MOBILE | DownloadManager.Request.NETWORK_WIFI)
                .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                .setVisibleInDownloadsUi(true)
                .setDestinationUri(downloadLocation);
        request.allowScanningByMediaScanner();
        downloadId = downloadManager.enqueue(request);
    }

    public void downLoadServiceFileFromUrl(String name, String url,String checkSum){
        this.serviceFileName = name;
        if(!hasPermissions(this.PERMISSIONS)){
            ActivityCompat.requestPermissions(this, PERMISSIONS, PERMISSION_ALL);
            return;
        }
        DownloadManager downloadManager = (DownloadManager) this.getSystemService(DOWNLOAD_SERVICE);
        Uri uri = Uri.parse(url);
        File dir =
                Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
        Uri downloadLocation = Uri.fromFile(new File(dir,name));
        this.serviceDownloadLocation =  downloadLocation.toString();
        File oldFile = new File(dir , name);
        this.serviceCheckSum = checkSum;
        if(oldFile.exists()){
            try {
                openApkFile(true);
            } catch (IOException e) {
                e.printStackTrace();
            }
            return;
        }
        dir.mkdirs();

        DownloadManager.Request request = new DownloadManager.Request(uri)
                .setTitle(this.serviceFileName)
                .setDescription("Downloading " + this.serviceFileName)
                .setAllowedNetworkTypes(DownloadManager.Request.NETWORK_MOBILE | DownloadManager.Request.NETWORK_WIFI)
                .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                .setVisibleInDownloadsUi(true)
                .setDestinationUri(downloadLocation);
        request.allowScanningByMediaScanner();
        serviceDownloadId = downloadManager.enqueue(request);
    }

    @RequiresApi(api = Build.VERSION_CODES.O)
    @Override
    protected void onResume() {
        super.onResume();
//        enableLockMode();
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
    private void sendEvent(
            String eventName,
            @Nullable Object data) {
        ReactInstanceManager mReactInstanceManager = getReactNativeHost().getReactInstanceManager();
        ReactApplicationContext context = (ReactApplicationContext) mReactInstanceManager.getCurrentReactContext();
        if (context == null) return;
        context
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, data);
    }

    @Override
    protected String getMainComponentName() {
        return "booking_machine";
    }
}
