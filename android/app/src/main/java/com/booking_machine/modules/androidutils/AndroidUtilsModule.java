package com.booking_machine.modules.androidutils;

import androidx.annotation.Nullable;

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
}

