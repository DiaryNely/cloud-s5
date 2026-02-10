package mg.uem.mg.clouds5p17authapi.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.net.HttpURLConnection;
import java.net.URL;
import java.time.Instant;

/**
 * Service to detect if Firebase/Internet is accessible.
 * Caches the result for 30 seconds to avoid excessive network calls.
 */
@Service
public class ConnectionDetectorService {

    private static final Logger log = LoggerFactory.getLogger(ConnectionDetectorService.class);
    private static final String FIREBASE_CHECK_URL = "https://identitytoolkit.googleapis.com";
    private static final long CACHE_DURATION_MS = 30_000; // 30 seconds

    private volatile boolean lastStatus = false;
    private volatile long lastCheckTime = 0;

    /**
     * Check if Firebase is reachable (online mode).
     * Result is cached for 30 seconds.
     */
    public boolean isOnline() {
        long now = Instant.now().toEpochMilli();

        // Return cached result if still valid
        if (now - lastCheckTime < CACHE_DURATION_MS) {
            return lastStatus;
        }

        // Perform actual check
        boolean online = checkConnection();
        lastStatus = online;
        lastCheckTime = now;

        log.info("Connection check: {} (cached for {}s)", online ? "ONLINE" : "OFFLINE", CACHE_DURATION_MS / 1000);
        return online;
    }

    private boolean checkConnection() {
        try {
            URL url = new URL(FIREBASE_CHECK_URL);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setConnectTimeout(3000); // 3 seconds timeout
            conn.setReadTimeout(3000);
            conn.setRequestMethod("HEAD");
            int responseCode = conn.getResponseCode();
            conn.disconnect();
            return responseCode >= 200 && responseCode < 500; // Any non-server-error response
        } catch (Exception e) {
            log.debug("Connection check failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Force refresh the connection status (bypass cache).
     */
    public boolean forceCheck() {
        lastCheckTime = 0;
        return isOnline();
    }
}
