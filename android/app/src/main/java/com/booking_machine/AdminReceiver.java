package com.booking_machine;

import android.app.admin.DeviceAdminReceiver;
import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.UserHandle;
import android.util.Log;

import androidx.annotation.NonNull;

public class AdminReceiver extends DeviceAdminReceiver {
    private static final String TAG = "DeviceAdminReceiver";

    /* access modifiers changed from: 0000 */
    public void showToast(Context context, String str) {
    }

    public void onEnabled(Context context, Intent intent) {
        super.onEnabled(context, intent);
        Log.d(TAG, "onEnabled: ");
    }

    public CharSequence onDisableRequested(Context context, Intent intent) {
        Log.d(TAG, "onDisableRequested: ");
        return "turn off";
    }

    public void onDisabled(Context context, Intent intent) {
        super.onDisabled(context, intent);
        Log.d(TAG, "onDisabled: ");
    }

    public void onPasswordChanged(Context context, Intent intent, UserHandle userHandle) {
        Log.d(TAG, "onPasswordChanged: ");
    }
}
