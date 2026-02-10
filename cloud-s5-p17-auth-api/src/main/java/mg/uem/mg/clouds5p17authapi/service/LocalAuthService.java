package mg.uem.mg.clouds5p17authapi.service;

import java.time.Instant;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import mg.uem.mg.clouds5p17authapi.entity.User;
import mg.uem.mg.clouds5p17authapi.repository.UserRepository;

/**
 * Service for local PostgreSQL authentication (offline mode).
 */
@Service
public class LocalAuthService {

    private static final Logger log = LoggerFactory.getLogger(LocalAuthService.class);

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final int maxAttempts;
    private final long blockSeconds;

    public LocalAuthService(
            UserRepository userRepository,
            @Value("${login.maxAttempts:3}") int maxAttempts,
            @Value("${login.blockSeconds:300}") long blockSeconds) {
        this.userRepository = userRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
        this.maxAttempts = maxAttempts;
        this.blockSeconds = blockSeconds;
        log.info("LocalAuthService initialized: maxAttempts={}, blockSeconds={}", maxAttempts, blockSeconds);
    }

    /**
     * Register a new user locally.
     */
    @Transactional
    public User register(String email, String password, String nom, String prenom, String numEtu) {
        return register(email, password, nom, prenom, numEtu, "UTILISATEUR");
    }

    /**
     * Register a new user locally with a specific role.
     */
    @Transactional
    public User register(String email, String password, String nom, String prenom, String numEtu, String role) {
        if (userRepository.existsByEmail(email.toLowerCase())) {
            throw new RuntimeException("Email already exists: " + email);
        }

        User user = new User();
        user.setEmail(email.toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setNom(nom);
        user.setPrenom(prenom);
        user.setNumEtu(numEtu);
        user.setRole(role != null && !role.isBlank() ? role : "UTILISATEUR");
        user.setSyncedToFirebase(false);

        User saved = userRepository.save(user);
        log.info("User registered locally: {} (uid={}, role={})", email, saved.getUid(), saved.getRole());
        return saved;
    }

    /**
     * Authenticate user with email/password locally.
     * 
     * @return User if successful, null if failed
     */
    @Transactional
    public User login(String email, String password) {
        String normalizedEmail = email.toLowerCase().trim();
        Optional<User> optUser = userRepository.findByEmail(normalizedEmail);

        if (optUser.isEmpty()) {
            log.warn("Login failed: user not found - {}", normalizedEmail);
            return null;
        }

        User user = optUser.get();

        // Les MANAGER ne sont jamais bloqués
        boolean isManager = "MANAGER".equalsIgnoreCase(user.getRole());

        // Check if blocked (sauf pour MANAGER)
        if (!isManager && isBlocked(user)) {
            log.warn("Login blocked for user: {}", normalizedEmail);
            throw new UserBlockedException("Account temporarily locked due to too many failed attempts");
        }

        // Verify password
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            if (!isManager) {
                incrementFailedAttempts(user);
            }
            log.warn("Login failed: wrong password for {}", normalizedEmail);
            return null;
        }

        // Success - reset attempts
        resetAttempts(user);
        log.info("Login successful for local user: {}", normalizedEmail);
        return user;
    }

    /**
     * Check if user is currently blocked.
     */
    public boolean isBlocked(User user) {
        if (user.getBlockedUntil() == null) {
            return false;
        }
        if (Instant.now().isAfter(user.getBlockedUntil())) {
            // Block expired, reset
            user.setBlockedUntil(null);
            user.setLoginAttempts(0);
            userRepository.save(user);
            return false;
        }
        return true;
    }

    /**
     * Increment failed login attempts and block if necessary.
     */
    @Transactional
    public void incrementFailedAttempts(User user) {
        int attempts = user.getLoginAttempts() + 1;
        user.setLoginAttempts(attempts);

        if (attempts >= maxAttempts) {
            user.setBlockedUntil(Instant.now().plusSeconds(blockSeconds));
            log.warn("User {} blocked for {}s after {} failed attempts", user.getEmail(), blockSeconds, attempts);
        }

        userRepository.save(user);
    }

    /**
     * Reset login attempts after successful login.
     */
    @Transactional
    public void resetAttempts(User user) {
        user.setLoginAttempts(0);
        user.setBlockedUntil(null);
        userRepository.save(user);
    }

    /**
     * Reset block for a user by UID or Firebase UID.
     */
    @Transactional
    public boolean resetBlock(String uid) {
        // Chercher d'abord par UID local
        Optional<User> optUser = userRepository.findByUid(uid);
        
        // Si non trouvé, chercher par Firebase UID
        if (optUser.isEmpty()) {
            optUser = userRepository.findByFirebaseUid(uid);
        }
        
        if (optUser.isEmpty()) {
            log.warn("Cannot reset block: user not found for uid={}", uid);
            return false;
        }
        
        User user = optUser.get();
        user.setLoginAttempts(0);
        user.setBlockedUntil(null);
        userRepository.save(user);
        log.info("Block reset for user: {} (uid={})", user.getEmail(), uid);
        return true;
    }

    /**
     * Block a user by UID or Firebase UID for the configured duration.
     */
    @Transactional
    public boolean blockUser(String uid) {
        // Chercher d'abord par UID local
        Optional<User> optUser = userRepository.findByUid(uid);
        
        // Si non trouvé, chercher par Firebase UID
        if (optUser.isEmpty()) {
            optUser = userRepository.findByFirebaseUid(uid);
        }
        
        if (optUser.isEmpty()) {
            log.warn("Cannot block: user not found for uid={}", uid);
            return false;
        }
        
        User user = optUser.get();
        user.setLoginAttempts(maxAttempts);
        user.setBlockedUntil(Instant.now().plusSeconds(blockSeconds));
        userRepository.save(user);
        log.info("User blocked: {} (uid={})", user.getEmail(), uid);
        return true;
    }

    /**
     * Update user info (nom, prenom).
     */
    @Transactional
    public User updateUser(String uid, String nom, String prenom) {
        Optional<User> optUser = userRepository.findByUid(uid);
        if (optUser.isEmpty()) {
            throw new RuntimeException("User not found: " + uid);
        }
        User user = optUser.get();
        if (nom != null)
            user.setNom(nom);
        if (prenom != null)
            user.setPrenom(prenom);
        return userRepository.save(user);
    }

    /**
     * Get user by UID or Firebase UID.
     */
    public Optional<User> getUserByUid(String uid) {
        // Chercher d'abord par UID local
        Optional<User> user = userRepository.findByUid(uid);
        
        // Si non trouvé, chercher par Firebase UID
        if (user.isEmpty()) {
            user = userRepository.findByFirebaseUid(uid);
        }
        
        return user;
    }

    /**
     * Get user by email.
     */
    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email.toLowerCase());
    }

    /**
     * Exception for blocked accounts.
     */
    public static class UserBlockedException extends RuntimeException {
        public UserBlockedException(String message) {
            super(message);
        }
    }
}
