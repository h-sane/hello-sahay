package in.hellosahay.patient;

import android.Manifest;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.location.Location;
import android.os.Build;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import com.google.android.gms.location.CurrentLocationRequest;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.Priority;
import com.google.android.gms.tasks.Tasks;

import org.json.JSONObject;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.util.Scanner;
import java.util.concurrent.TimeUnit;

/** Reads the phone's position and sends it to the helpline server; runs every 30 minutes even when the app is closed. */
public class LocationWorker extends Worker {
    static final String PREFS = "sahay_location";

    public LocationWorker(@NonNull Context context, @NonNull WorkerParameters params) {
        super(context, params);
    }

    static boolean granted(Context c, String permission) {
        return c.checkSelfPermission(permission) == PackageManager.PERMISSION_GRANTED;
    }

    static boolean backgroundAllowed(Context c) {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.Q || granted(c, Manifest.permission.ACCESS_BACKGROUND_LOCATION);
    }

    static boolean foregroundAllowed(Context c) {
        return granted(c, Manifest.permission.ACCESS_FINE_LOCATION) || granted(c, Manifest.permission.ACCESS_COARSE_LOCATION);
    }

    @NonNull
    @Override
    public Result doWork() {
        Context c = getApplicationContext();
        SharedPreferences prefs = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String base = prefs.getString("apiBase", null);
        String phone = prefs.getString("phone", null);
        String token = prefs.getString("token", null);
        if (base == null || phone == null || token == null) return Result.success();
        if (!foregroundAllowed(c) || !backgroundAllowed(c)) return Result.success(); // nothing to send until the patient allows it

        Location location = null;
        try {
            FusedLocationProviderClient client = LocationServices.getFusedLocationProviderClient(c);
            CurrentLocationRequest request = new CurrentLocationRequest.Builder()
                    .setPriority(Priority.PRIORITY_HIGH_ACCURACY).setDurationMillis(30000).setMaxUpdateAgeMillis(120000).build();
            location = Tasks.await(client.getCurrentLocation(request, null), 45, TimeUnit.SECONDS);
            if (location == null) location = Tasks.await(client.getLastLocation(), 10, TimeUnit.SECONDS);
        } catch (Exception ignored) {
            // no fix this time; WorkManager retries with backoff
        }
        Log.i("SahayLocation", "fix=" + (location != null));
        if (location == null) return Result.retry();

        try {
            HttpURLConnection http = (HttpURLConnection) new URL(base + "/patients/" + URLEncoder.encode(phone, "UTF-8") + "/location").openConnection();
            http.setRequestMethod("PUT");
            http.setConnectTimeout(15000);
            http.setReadTimeout(15000);
            http.setDoOutput(true);
            http.setRequestProperty("Content-Type", "application/json");
            http.setRequestProperty("Authorization", "Bearer " + token);
            JSONObject body = new JSONObject().put("lat", location.getLatitude()).put("lng", location.getLongitude());
            try (OutputStream out = http.getOutputStream()) {
                out.write(body.toString().getBytes("UTF-8"));
            }
            int code = http.getResponseCode();
            Log.i("SahayLocation", "server answered " + code);
            if (code == 200) {
                // the server answers with a fresh token, so a patient who never reopens the app stays signed in
                try (Scanner s = new Scanner(http.getInputStream(), "UTF-8").useDelimiter("\\A")) {
                    String fresh = new JSONObject(s.hasNext() ? s.next() : "{}").optString("token", "");
                    if (!fresh.isEmpty()) prefs.edit().putString("token", fresh).apply();
                }
                return Result.success();
            }
            if (code == 401 || code == 404) { // signed out or removed on the server: stop until the app signs in again
                prefs.edit().remove("token").apply();
                return Result.success();
            }
            return Result.retry();
        } catch (Exception e) {
            return Result.retry();
        }
    }
}
