package com.booking_machine;

import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;

import androidx.annotation.RequiresApi;

import com.facebook.react.ReactActivity;
public class MainActivity extends ReactActivity {
    private static final String TAG = "MainActivity";
    private DevicePolicyManager dpm;
    private ComponentName adminName;
    private static MainActivity instance;

    public static MainActivity getInstance() {
        return instance;
    }
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
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
        if(dpm == null || !dpm.isDeviceOwnerApp(getPackageName())) return;
        dpm.setLockTaskPackages(adminName, new String[]{getPackageName(),"com.sample.child"});
        if (dpm.isLockTaskPermitted(getPackageName())) {
            startLockTask();
        }
    }

    public void closeKiosMode(){
        stopLockTask();
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
