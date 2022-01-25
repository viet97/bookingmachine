package com.booking_machine;

import android.app.ActivityManager;
import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.os.Bundle;
import android.os.PersistableBundle;
import android.view.View;
import android.view.WindowManager;

import androidx.annotation.Nullable;

import com.facebook.react.ReactActivity;

public class MainActivity extends ReactActivity {
  private final String[] APP_PACKAGES = {};
  private DevicePolicyManager dpm;
  @Override
  public void onCreate(@Nullable Bundle savedInstanceState, @Nullable PersistableBundle persistentState) {
    getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    getSupportActionBar().hide();
    super.onCreate(savedInstanceState, persistentState);
    dpm =
            (DevicePolicyManager) getSystemService(Context.DEVICE_POLICY_SERVICE);
    ComponentName adminName = getComponentName();
    dpm.setLockTaskPackages(adminName, APP_PACKAGES);
  }

  @Override
  protected void onPause() {
    super.onPause();
   ActivityManager activityManager = (ActivityManager) getSystemService(Context.ACTIVITY_SERVICE);

   activityManager.moveTaskToFront(getTaskId(), 0);
  }

  @Override
  protected void onResume() {
    super.onResume();
    startLockTask();
    final int flags = View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_FULLSCREEN
            | View.SYSTEM_UI_FLAG_IMMERSIVE
            | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY;
    getWindow().getDecorView().setSystemUiVisibility(flags);
  }

  @Override
  public void onBackPressed() {
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
