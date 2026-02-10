package mg.uem.mg.clouds5p17authapi.service;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.UserRecord;
import mg.uem.mg.clouds5p17authapi.dto.LoginRequest;
import mg.uem.mg.clouds5p17authapi.dto.RegisterRequest;
import mg.uem.mg.clouds5p17authapi.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class HybridAuthService {

    private static final Logger log = LoggerFactory.getLogger(HybridAuthService.class);

    private final ConnectionDetectorService connectionDetector;
    private final LocalAuthService localAuthService;
    private final LoginAttemptService loginAttemptService;
    private final JwtService jwtService;
    private final FirebaseService firebaseService;
    private final String firebaseApiKey;
    private final String authMode;

    public HybridAuthService(
            ConnectionDetectorService connectionDetector,
            LocalAuthService localAuthService,
            LoginAttemptService loginAttemptService,
            JwtService jwtService,
            FirebaseService firebaseService,
            @Value("${firebase.api.key:}") String firebaseApiKey,
            @Value("${auth.mode:auto}") String authMode) {
        this.connectionDetector = connectionDetector;
        this.localAuthService = localAuthService;
        this.loginAttemptService = loginAttemptService;
        this.jwtService = jwtService;
        this.firebaseService = firebaseService;
        this.firebaseApiKey = firebaseApiKey;
        this.authMode = authMode;
        log.info("HybridAuthService initialized with mode: {}", authMode);
    }

    /**
     * Determine if we should use Firebase (true) or local PostgreSQL (false).
     */
    public boolean shouldUseFirebase() {
        return switch (authMode.toLowerCase()) {
            case "firebase" -> true;
            case "local" -> false;
            default -> connectionDetector.isOnline() && firebaseApiKey != null && !firebaseApiKey.isBlank();
        };
    }

    /**
     * Get current auth mode status.
     */
    public Map<String, Object> getStatus() {
        boolean online = connectionDetector.isOnline();
        boolean useFirebase = shouldUseFirebase();

        Map<String, Object> status = new HashMap<>();
        status.put("mode", authMode);
        status.put("online", online);
        status.put("provider", useFirebase ? "firebase" : "postgresql");
        return status;
    }

    /**
     * Register a new user.
     */
    public AuthResult register(RegisterRequest request) {
        if (shouldUseFirebase()) {
            return registerWithFirebase(request);
        } else {
            return registerLocally(request);
        }
    }

    private AuthResult registerWithFirebase(RegisterRequest request) {
        try {
            UserRecord.CreateRequest createRequest = new UserRecord.CreateRequest()
                    .setEmail(request.email())
                    .setPassword(request.password())
                    .setDisplayName(request.nom() + " " + request.prenom());

            UserRecord user = FirebaseAuth.getInstance().createUser(createRequest);

            // Use role from request or default to UTILISATEUR
            String role = request.role() != null && !request.role().isBlank() 
                    ? request.role() 
                    : "UTILISATEUR";

            // Set custom claims
            Map<String, Object> claims = new HashMap<>();
            claims.put("role", role);
            claims.put("numEtu", request.numEtu());
            FirebaseAuth.getInstance().setCustomUserClaims(user.getUid(), claims);

            // Generate JWT
            String jwt = jwtService.generateToken(user.getUid(), request.email(), role);

            // Synchroniser vers Firebase Realtime Database
            User userEntity = new User();
            userEntity.setUid(user.getUid());
            userEntity.setFirebaseUid(user.getUid());
            userEntity.setEmail(request.email());
            userEntity.setNom(request.nom());
            userEntity.setPrenom(request.prenom());
            userEntity.setNumEtu(request.numEtu());
            userEntity.setRole(role);
            firebaseService.syncUser(userEntity);

            log.info("User registered with Firebase: {} (uid={}, role={})", request.email(), user.getUid(), role);
            return new AuthResult(true, user.getUid(), request.email(), role, jwt, "firebase");

        } catch (FirebaseAuthException e) {
            log.error("Firebase registration failed: {}", e.getMessage());
            return new AuthResult(false, null, request.email(), null, null, "firebase", e.getMessage());
        }
    }

    private AuthResult registerLocally(RegisterRequest request) {
    try {
        // Use role from request or default to UTILISATEUR
        String role = request.role() != null && !request.role().isBlank()
                ? request.role()
                : "UTILISATEUR";

        User user = localAuthService.register(
                request.email(),
                request.password(),
                request.nom(),
                request.prenom(),
                request.numEtu(),
                role
        );

        String jwt = jwtService.generateToken(
                user.getUid(),
                user.getEmail(),
                user.getRole()
        );

        log.info(
                "User registered locally: {} (uid={}, role={})",
                request.email(),
                user.getUid(),
                role
        );

        return new AuthResult(
                true,
                user.getUid(),
                user.getEmail(),
                user.getRole(),
                jwt,
                "postgresql"
        );

    } catch (Exception e) {
        log.error("Local registration failed: {}", e.getMessage(), e);
        return new AuthResult(
                false,
                null,
                request.email(),
                null,
                null,
                "postgresql",
                e.getMessage()
        );
    }
}

        // Ne PAS synchroniser automatiquement vers Firebase
        // La synchronisation se fait uniquement via le bouton "Synchroniser" du manager
    /**
     * Authenticate a user.
     */
    public AuthResult login(LoginRequest request) {
        String email = request.email().toLowerCase().trim();

        // Check if blocked (in-memory for Firebase mode)
        if (shouldUseFirebase() && loginAttemptService.isBlocked(email)) {
            return new AuthResult(false, null, email, null, null, "firebase", "Account temporarily locked");
        }

        if (shouldUseFirebase()) {
            return loginWithFirebase(request);
        } else {
            return loginLocally(request);
        }
    }

    private AuthResult loginWithFirebase(LoginRequest request) {
        String email = request.email().toLowerCase().trim();
        String url = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=" + firebaseApiKey;
        RestTemplate rest = new RestTemplate();

        Map<String, Object> payload = new HashMap<>();
        payload.put("email", email);
        payload.put("password", request.password());
        payload.put("returnSecureToken", true);

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> resp = rest.postForObject(url, payload, Map.class);

            if (resp == null || resp.get("idToken") == null) {
                loginAttemptService.loginFailed(email);
                return new AuthResult(false, null, email, null, null, "firebase", "Invalid credentials");
            }

            // Get user info from Firebase
            String localId = (String) resp.get("localId");
            UserRecord userRecord = FirebaseAuth.getInstance().getUser(localId);

            Object roleClaim = userRecord.getCustomClaims().get("role");
            String role = roleClaim != null ? roleClaim.toString() : "UTILISATEUR";

            // Generate our own JWT
            String jwt = jwtService.generateToken(localId, email, role);

            loginAttemptService.loginSucceeded(email);
            log.info("Login successful via Firebase: {}", email);
            return new AuthResult(true, localId, email, role, jwt, "firebase");

        } catch (HttpClientErrorException e) {
            loginAttemptService.loginFailed(email);
            log.warn("Firebase login failed for {}: {}", email, e.getMessage());
            return new AuthResult(false, null, email, null, null, "firebase", "Invalid credentials");
        } catch (FirebaseAuthException e) {
            loginAttemptService.loginFailed(email);
            log.error("Firebase error during login: {}", e.getMessage());
            return new AuthResult(false, null, email, null, null, "firebase", e.getMessage());
        }
    }

    private AuthResult loginLocally(LoginRequest request) {
        String email = request.email().toLowerCase().trim();

        try {
            User user = localAuthService.login(email, request.password());

            if (user == null) {
                return new AuthResult(false, null, email, null, null, "postgresql", "Invalid credentials");
            }

            String jwt = jwtService.generateToken(user.getUid(), user.getEmail(), user.getRole());

            log.info("Login successful via PostgreSQL: {}", email);
            return new AuthResult(true, user.getUid(), user.getEmail(), user.getRole(), jwt, "postgresql");

        } catch (LocalAuthService.UserBlockedException e) {
            return new AuthResult(false, null, email, null, null, "postgresql", "Account temporarily locked");
        }
    }

    /**
     * Update user info.
     */
    public AuthResult updateUser(String uid, String nom, String prenom) {
        if (shouldUseFirebase()) {
            try {
                String displayName = (nom != null ? nom : "") + " " + (prenom != null ? prenom : "");
                UserRecord.UpdateRequest request = new UserRecord.UpdateRequest(uid)
                        .setDisplayName(displayName.trim());
                FirebaseAuth.getInstance().updateUser(request);
                log.info("User updated on Firebase: {}", uid);
                return new AuthResult(true, uid, null, null, null, "firebase");
            } catch (FirebaseAuthException e) {
                return new AuthResult(false, uid, null, null, null, "firebase", e.getMessage());
            }
        } else {
            try {
                User user = localAuthService.updateUser(uid, nom, prenom);
                return new AuthResult(true, user.getUid(), user.getEmail(), user.getRole(), null, "postgresql");
            } catch (Exception e) {
                return new AuthResult(false, uid, null, null, null, "postgresql", e.getMessage());
            }
        }
    }

    /**
     * Reset block for a user.
     */
    public boolean resetBlock(String uid) {
        // Reset in-memory attempts
        try {
            if (shouldUseFirebase()) {
                UserRecord user = FirebaseAuth.getInstance().getUser(uid);
                String email = user.getEmail();
                if (email != null) {
                    loginAttemptService.reset(email.toLowerCase());
                }
                // Clear custom claims related to blocking
                FirebaseAuth.getInstance().setCustomUserClaims(uid, null);
                FirebaseAuth.getInstance().updateUser(new UserRecord.UpdateRequest(uid).setDisabled(false));
            }
        } catch (FirebaseAuthException e) {
            log.warn("Could not reset Firebase claims for {}: {}", uid, e.getMessage());
        }

        // Also reset local
        return localAuthService.resetBlock(uid);
    }

    /**
     * Block a user (local and Firebase if possible).
     */
    public boolean blockUser(String uid) {
        // 1. D'abord bloquer en LOCAL PostgreSQL
        boolean local = localAuthService.blockUser(uid);
        if (!local) {
            log.error("❌ Échec du blocage local pour UID: {}", uid);
            return false;
        }
        log.info("✅ Utilisateur bloqué en LOCAL: {}", uid);

        // 2. Ensuite bloquer dans Firebase Authentication
        boolean firebase = false;
        String firebaseUid = resolveFirebaseUid(uid);
        if (shouldUseFirebase()) {
            try {
                FirebaseAuth.getInstance().updateUser(new UserRecord.UpdateRequest(firebaseUid).setDisabled(true));
                firebase = true;
                log.info("✅ Utilisateur bloqué dans Firebase Auth: {}", firebaseUid);
            } catch (FirebaseAuthException e) {
                log.warn("⚠️ Impossible de bloquer dans Firebase Auth {}: {}", firebaseUid, e.getMessage());
            }
        }

        // 3. Synchroniser vers Firebase Realtime Database pour mise à jour instantanée de l'UI
        try {
            User user = localAuthService.getUserByUid(uid).orElse(null);
            if (user != null) {
                firebaseService.syncUser(user);
                log.info("✅ Statut bloqué synchronisé vers Firebase Realtime DB: {}", uid);
            }
        } catch (Exception e) {
            log.warn("⚠️ Erreur synchronisation vers Realtime DB: {}", e.getMessage());
        }

        return true;
    }

    /**
     * Unblock a user (local and Firebase if possible).
     */
    public boolean unblockUser(String uid) {
        // 1. D'abord débloquer en LOCAL PostgreSQL
        boolean local = localAuthService.resetBlock(uid);
        if (!local) {
            log.error("❌ Échec du déblocage local pour UID: {}", uid);
            return false;
        }
        log.info("✅ Utilisateur débloqué en LOCAL: {}", uid);

        // 2. Ensuite débloquer dans Firebase Authentication
        boolean firebase = false;
        String firebaseUid = resolveFirebaseUid(uid);
        if (shouldUseFirebase()) {
            try {
                FirebaseAuth.getInstance().updateUser(new UserRecord.UpdateRequest(firebaseUid).setDisabled(false));
                firebase = true;
                log.info("✅ Utilisateur débloqué dans Firebase Auth: {}", firebaseUid);
            } catch (FirebaseAuthException e) {
                log.warn("⚠️ Impossible de débloquer dans Firebase Auth {}: {}", firebaseUid, e.getMessage());
            }
        }

        // 3. Synchroniser vers Firebase Realtime Database pour mise à jour instantanée de l'UI
        try {
            User user = localAuthService.getUserByUid(uid).orElse(null);
            if (user != null) {
                firebaseService.syncUser(user);
                log.info("✅ Statut débloqué synchronisé vers Firebase Realtime DB: {}", uid);
            }
        } catch (Exception e) {
            log.warn("⚠️ Erreur synchronisation vers Realtime DB: {}", e.getMessage());
        }

        return true;
    }

    private String resolveFirebaseUid(String uid) {
        return localAuthService.getUserByUid(uid)
                .map(u -> u.getFirebaseUid() != null ? u.getFirebaseUid() : u.getUid())
                .orElse(uid);
    }

    /**
     * Auth result record.
     */
    public record AuthResult(
            boolean success,
            String uid,
            String email,
            String role,
            String token,
            String provider,
            String error) {
        public AuthResult(boolean success, String uid, String email, String role, String token, String provider) {
            this(success, uid, email, role, token, provider, null);
        }
    }
}
