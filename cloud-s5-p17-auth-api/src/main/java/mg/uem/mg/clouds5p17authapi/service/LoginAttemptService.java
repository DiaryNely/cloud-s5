package mg.uem.mg.clouds5p17authapi.service;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.UserRecord;
import mg.uem.mg.clouds5p17authapi.entity.User;
import mg.uem.mg.clouds5p17authapi.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class LoginAttemptService {

    private static final Logger log = LoggerFactory.getLogger(LoginAttemptService.class);

    private final int maxAttempts;
    private final long blockSeconds;
    private final UserRepository userRepository;
    private final FirebaseService firebaseService;

    private static class AttemptInfo {
        int attempts;
        long blockedUntilMs;
    }

    private final Map<String, AttemptInfo> attempts = new ConcurrentHashMap<>();

    public LoginAttemptService(@Value("${login.maxAttempts:5}") int maxAttempts,
                               @Value("${login.blockSeconds:300}") long blockSeconds,
                               UserRepository userRepository,
                               FirebaseService firebaseService) {
        this.maxAttempts = maxAttempts;
        this.blockSeconds = blockSeconds;
        this.userRepository = userRepository;
        this.firebaseService = firebaseService;
        log.info("LoginAttemptService initialized: maxAttempts={}, blockSeconds={}", maxAttempts, blockSeconds);
    }

    public boolean isBlocked(String key) {
        AttemptInfo info = attempts.get(key);
        if (info == null) return false;
        if (info.blockedUntilMs == 0) return false;
        if (Instant.now().toEpochMilli() > info.blockedUntilMs) {
            // unblock
            attempts.remove(key);
            log.info("Unblocking key {} after expiry", key);
            return false;
        }
        log.debug("Key {} is currently blocked until {} (now={})", key, info.blockedUntilMs, Instant.now().toEpochMilli());
        return true;
    }

    public void loginSucceeded(String key) {
        attempts.remove(key);
        log.info("Login success for {} — attempts reset", key);
    }

    public void loginFailed(String key) {
        AttemptInfo info = attempts.computeIfAbsent(key, k -> new AttemptInfo());
        info.attempts = info.attempts + 1;
        if (info.attempts >= maxAttempts) {
            info.blockedUntilMs = Instant.now().plusSeconds(blockSeconds).toEpochMilli();
            log.warn("⚠️ Key {} blocked after {} failed attempts — blocking permanently in database", key, info.attempts);
            
            // Bloquer automatiquement et définitivement l'utilisateur
            blockUserPermanently(key);
        } else {
            log.warn("Failed login for {} — attempt {}/{}", key, info.attempts, maxAttempts);
        }
        attempts.put(key, info);
    }
    
    /**
     * Bloque définitivement un utilisateur dans Firebase et/ou PostgreSQL
     * @param email Email de l'utilisateur à bloquer
     */
    private void blockUserPermanently(String email) {
        try {
            // Bloquer dans Firebase Authentication
            try {
                UserRecord firebaseUser = FirebaseAuth.getInstance().getUserByEmail(email);
                FirebaseAuth.getInstance().updateUser(
                    new UserRecord.UpdateRequest(firebaseUser.getUid())
                        .setDisabled(true)
                );
                log.info("✅ User {} bloqué dans Firebase Authentication", email);
                
                // Mettre à jour aussi dans Realtime Database
                User userEntity = new User();
                userEntity.setUid(firebaseUser.getUid());
                userEntity.setFirebaseUid(firebaseUser.getUid());
                userEntity.setEmail(email);
                userEntity.setRole(firebaseUser.getCustomClaims() != null && firebaseUser.getCustomClaims().get("role") != null 
                    ? firebaseUser.getCustomClaims().get("role").toString() : "UTILISATEUR");
                firebaseService.syncUser(userEntity);
                
            } catch (FirebaseAuthException e) {
                log.debug("User {} not found in Firebase: {}", email, e.getMessage());
            }
            
            // Bloquer dans PostgreSQL
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                user.setBlockedUntil(Instant.now().plusSeconds(365 * 24 * 3600)); // 1 an = blocage permanent
                userRepository.save(user);
                log.info("✅ User {} bloqué dans PostgreSQL", email);
            }
            
        } catch (Exception e) {
            log.error("❌ Erreur lors du blocage permanent de {}: {}", email, e.getMessage());
        }
    }

    public void reset(String key) {
        attempts.remove(key);
        log.info("Reset attempts for {}", key);
    }

    // For debugging: return a snapshot of current attempt info
    public Map<String, Map<String, Object>> snapshot() {
        Map<String, Map<String, Object>> snap = new ConcurrentHashMap<>();
        for (Map.Entry<String, AttemptInfo> e : attempts.entrySet()) {
            Map<String, Object> info = new HashMap<>();
            info.put("attempts", e.getValue().attempts);
            info.put("blockedUntilMs", e.getValue().blockedUntilMs);
            snap.put(e.getKey(), info);
        }
        return snap;
    }
}
