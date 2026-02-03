package mg.sig.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * Service de détection de connectivité Internet et Firebase.
 */
@Service
@Slf4j
public class ConnectivityService {

    private static final String FIREBASE_URL = "https://firebasedatabase.googleapis.com/.json";
    private static final int TIMEOUT_MS = 5000;

    private volatile boolean isOnline = true;
    private long lastCheck = 0;
    private static final long CHECK_INTERVAL = 5000; // 5 secondes

    /**
     * Vérifie si Firebase est accessible
     */
    public boolean isFirebaseAvailable() {
        long now = System.currentTimeMillis();
        
        // Cache pendant 5 secondes
        if (now - lastCheck < CHECK_INTERVAL) {
            log.debug("Utilisation cache connectivité: {}", isOnline ? "ONLINE" : "OFFLINE");
            return isOnline;
        }
        
        lastCheck = now;
        
        try {
            log.debug("Test connexion HTTP vers {}", FIREBASE_URL);
            URL url = new URL(FIREBASE_URL);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("GET");
            connection.setConnectTimeout(TIMEOUT_MS);
            connection.setReadTimeout(TIMEOUT_MS);
            connection.connect();
            
            int responseCode = connection.getResponseCode();
            connection.disconnect();
            
            isOnline = (responseCode == 200 || responseCode == 401 || responseCode == 404); // 401/404 = serveur accessible
            if (isOnline) {
                log.info("✓ Firebase accessible - Mode ONLINE (HTTP {})", responseCode);
            } else {
                log.warn("✗ Code HTTP inattendu - Mode OFFLINE (HTTP {})", responseCode);
            }
            return isOnline;
        } catch (IOException e) {
            isOnline = false;
            log.warn("✗ Firebase inaccessible - Mode OFFLINE: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Force la vérification immédiate
     */
    public boolean checkNow() {
        lastCheck = 0;
        return isFirebaseAvailable();
    }

    /**
     * Retourne le statut en cache (vérifie si première fois)
     */
    public boolean isOnline() {
        // Si c'est la première vérification, forcer un check
        if (lastCheck == 0) {
            return isFirebaseAvailable();
        }
        return isOnline;
    }

    /**
     * Invalide le cache
     */
    public void invalidateCache() {
        lastCheck = 0;
    }
}
