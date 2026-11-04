package in.hellosahay.patient;

import android.Manifest;
import android.content.Context;
import android.content.SharedPreferences;

import androidx.work.Constraints;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.ExistingWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.OneTimeWorkRequest;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.util.concurrent.TimeUnit;

/** Asks for "allow all the time" location and schedules LocationWorker to report the position every 30 minutes. */
@CapacitorPlugin(name = "SahayLocation", permissions = {
        @Permission(alias = "location", strings = {Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION}),
        @Permission(alias = "background", strings = {Manifest.permission.ACCESS_BACKGROUND_LOCATION})
})
public class SahayLocationPlugin extends Plugin {
    private static final String WORK_NAME = "sahay-location";
    private static final int EVERY_MINUTES = 30;

    private SharedPreferences prefs() {
        return getContext().getSharedPreferences(LocationWorker.PREFS, Context.MODE_PRIVATE);
    }

    private JSObject status() {
        Context c = getContext();
        JSObject o = new JSObject();
        o.put("foreground", LocationWorker.foregroundAllowed(c));
        o.put("background", LocationWorker.backgroundAllowed(c));
        o.put("enabled", prefs().getString("token", null) != null);
        return o;
    }

    @PluginMethod
    public void status(PluginCall call) {
        call.resolve(status());
    }

    // Android 11+ refuses a combined request: precise location first, then "allow all the time" as a second step.
    @PluginMethod
    public void requestAccess(PluginCall call) {
        if (!LocationWorker.foregroundAllowed(getContext())) {
            requestPermissionForAlias("location", call, "afterForeground");
        } else {
            askBackground(call);
        }
    }

    @PermissionCallback
    private void afterForeground(PluginCall call) {
        if (LocationWorker.foregroundAllowed(getContext())) askBackground(call); else call.resolve(status());
    }

    private void askBackground(PluginCall call) {
        if (!LocationWorker.backgroundAllowed(getContext())) {
            requestPermissionForAlias("background", call, "afterBackground");
        } else {
            call.resolve(status());
        }
    }

    @PermissionCallback
    private void afterBackground(PluginCall call) {
        call.resolve(status());
    }

    @PluginMethod
    public void start(PluginCall call) {
        String apiBase = call.getString("apiBase");
        String phone = call.getString("phone");
        String token = call.getString("token");
        if (apiBase == null || phone == null || token == null) {
            call.reject("apiBase, phone and token are required");
            return;
        }
        prefs().edit().putString("apiBase", apiBase).putString("phone", phone).putString("token", token).apply();
        Constraints online = new Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build();
        WorkManager wm = WorkManager.getInstance(getContext());
        wm.enqueueUniquePeriodicWork(WORK_NAME, ExistingPeriodicWorkPolicy.UPDATE,
                new PeriodicWorkRequest.Builder(LocationWorker.class, EVERY_MINUTES, TimeUnit.MINUTES).setConstraints(online).build());
        wm.enqueueUniqueWork(WORK_NAME + "-now", ExistingWorkPolicy.REPLACE,
                new OneTimeWorkRequest.Builder(LocationWorker.class).setConstraints(online).build());
        call.resolve(status());
    }

    @PluginMethod
    public void stop(PluginCall call) {
        WorkManager.getInstance(getContext()).cancelUniqueWork(WORK_NAME);
        prefs().edit().clear().apply();
        call.resolve(status());
    }
}
