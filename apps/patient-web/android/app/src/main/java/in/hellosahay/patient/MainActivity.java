package in.hellosahay.patient;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SahayLocationPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
