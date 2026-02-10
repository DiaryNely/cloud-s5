package mg.uem.mg.clouds5p17authapi.controller;

import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import mg.uem.mg.clouds5p17authapi.dto.LoginRequest;
import mg.uem.mg.clouds5p17authapi.dto.RegisterRequest;
import mg.uem.mg.clouds5p17authapi.entity.User;
import mg.uem.mg.clouds5p17authapi.repository.UserRepository;
import mg.uem.mg.clouds5p17authapi.service.HybridAuthService;
import mg.uem.mg.clouds5p17authapi.service.LoginAttemptService;
import mg.uem.mg.clouds5p17authapi.service.SyncService;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "API d'authentification hybride (Firebase online / PostgreSQL offline)")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private HybridAuthService hybridAuthService;

    @Autowired
    private LoginAttemptService loginAttemptService;

    @Autowired
    private SyncService syncService;

    @Autowired
    private UserRepository userRepository;

    // ========================================
    // Registration
    // ========================================
    @Operation(summary = "Inscription d'un nouvel utilisateur", description = "Crée un compte utilisateur. Utilise Firebase si en ligne, PostgreSQL si hors ligne.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Inscription réussie"),
            @ApiResponse(responseCode = "400", description = "Erreur lors de l'inscription (email existant, etc.)")
    })
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        log.info("Register request for: {}", request.email());

        HybridAuthService.AuthResult result = hybridAuthService.register(request);

        if (result.success()) {
            Map<String, Object> response = new HashMap<>();
            response.put("uid", result.uid());
            response.put("email", result.email());
            response.put("role", result.role());
            response.put("token", result.token());
            response.put("provider", result.provider());
            response.put("expiresIn", 3600); // seconds
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", result.error(),
                    "provider", result.provider()));
        }
    }

    // ========================================
    // Login
    // ========================================
    @Operation(summary = "Connexion utilisateur", description = "Authentifie un utilisateur avec email/mot de passe. Retourne un token JWT. "
            +
            "Limite de 3 tentatives par défaut, compte bloqué pendant 5 minutes après dépassement.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Connexion réussie, retourne JWT"),
            @ApiResponse(responseCode = "401", description = "Identifiants invalides"),
            @ApiResponse(responseCode = "423", description = "Compte temporairement bloqué")
    })
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        String email = request.email() != null ? request.email().toLowerCase().trim() : "";
        log.debug("Login request for: {}", email);

        HybridAuthService.AuthResult result = hybridAuthService.login(request);

        if (result.success()) {
            Map<String, Object> response = new HashMap<>();
            response.put("uid", result.uid());
            response.put("email", result.email());
            response.put("role", result.role());
            response.put("token", result.token());
            response.put("provider", result.provider());
            response.put("expiresIn", 3600);
            return ResponseEntity.ok(response);
        } else {
            if (result.error() != null && result.error().contains("locked")) {
                return ResponseEntity.status(HttpStatus.LOCKED).body(Map.of(
                        "error", result.error(),
                        "provider", result.provider()));
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "error", result.error() != null ? result.error() : "Invalid credentials",
                    "provider", result.provider()));
        }
    }

    // ========================================
    // Update User
    // ========================================
    @Operation(summary = "Modifier les informations utilisateur", description = "Permet de modifier le nom et prénom d'un utilisateur.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Modification réussie"),
            @ApiResponse(responseCode = "400", description = "Erreur lors de la modification")
    })
    @PatchMapping("/users/{uid}")
    @PreAuthorize("hasAnyRole('UTILISATEUR','MANAGER')")
    public ResponseEntity<?> updateUser(
            @Parameter(description = "UID de l'utilisateur") @PathVariable String uid,
            @RequestBody Map<String, String> updates) {

        String nom = updates.get("nom");
        String prenom = updates.get("prenom");

        HybridAuthService.AuthResult result = hybridAuthService.updateUser(uid, nom, prenom);

        if (result.success()) {
            return ResponseEntity.ok(Map.of(
                    "message", "Utilisateur mis à jour",
                    "uid", uid,
                    "provider", result.provider()));
        } else {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", result.error(),
                    "provider", result.provider()));
        }
    }

    // ========================================
    // Reset Block
    // ========================================
    @Operation(summary = "Réinitialiser le blocage d'un utilisateur", description = "Réinitialise le compteur de tentatives et débloque le compte.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Blocage réinitialisé"),
            @ApiResponse(responseCode = "404", description = "Utilisateur non trouvé")
    })
    @PostMapping("/reset-block/{uid}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<?> resetBlock(
            @Parameter(description = "UID de l'utilisateur à débloquer") @PathVariable String uid) {

        boolean success = hybridAuthService.resetBlock(uid);

        if (success) {
            log.info("Block reset for user: {}", uid);
            return ResponseEntity.ok(Map.of(
                    "message", "Blocage réinitialisé pour l'utilisateur " + uid));
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "error", "Utilisateur non trouvé"));
        }
    }

    // ========================================
    // Status
    // ========================================
    @Operation(summary = "État du système d'authentification", description = "Retourne le mode actuel (online/offline) et le provider utilisé.")
    @GetMapping("/status")
    public ResponseEntity<?> getStatus() {
        Map<String, Object> status = hybridAuthService.getStatus();
        return ResponseEntity.ok(status);
    }

    // ========================================
    // Sync Status
    // ========================================
    @Operation(summary = "État de la synchronisation", description = "Retourne le nombre d'utilisateurs synchronisés et en attente de synchronisation.")
    @GetMapping("/sync/status")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<?> getSyncStatus() {
        return ResponseEntity.ok(syncService.getSyncStatus());
    }

    // ========================================
    // Force Sync
    // ========================================
    @Operation(summary = "Forcer la synchronisation", description = "Force la synchronisation de tous les utilisateurs locaux vers Firebase.")
    @PostMapping("/sync/force")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<?> forceSync() {
        Map<String, Object> result = syncService.forceSyncAll();
        return ResponseEntity.ok(result);
    }

    // ========================================
    // Firebase Custom Token
    // ========================================
    @Operation(summary = "Obtenir un Firebase Custom Token", description = "Génère un Firebase Custom Token pour l'utilisateur authentifié.")
    @GetMapping("/firebase-token")
    public ResponseEntity<?> getFirebaseToken() {
        log.info("========================================");
        log.info("🔥 REQUÊTE REÇUE: /api/auth/firebase-token");
        log.info("========================================");
        
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            log.info("📋 Authentication object: {}", auth);
            log.info("📋 Is authenticated: {}", auth != null ? auth.isAuthenticated() : "null");
            log.info("📋 Principal: {}", auth != null ? auth.getPrincipal() : "null");
            
            if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
                log.error("❌ ERREUR: Utilisateur non authentifié");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "error", "Non authentifié"
                ));
            }
            
            // Récupérer l'UID depuis les détails de l'authentification
            String uid = null;
            String email = auth.getName(); // Le subject du JWT (email)
            log.info("📧 Email extrait du JWT (subject): {}", email);
            
            if (auth.getDetails() instanceof Map) {
                Map<?, ?> details = (Map<?, ?>) auth.getDetails();
                uid = (String) details.get("uid");
                log.info("🔑 UID extrait des détails: {}", uid);
            }
            
            // Si l'UID n'est pas dans les détails, chercher par email
            User user = null;
            if (uid != null) {
                log.info("🔍 Recherche de l'utilisateur avec UID: {}", uid);
                user = userRepository.findByUid(uid).orElse(null);
            }
            
            if (user == null) {
                log.info("🔍 UID non trouvé ou null, recherche par email: {}", email);
                user = userRepository.findByEmail(email).orElse(null);
                if (user != null) {
                    uid = user.getUid();
                    log.info("✅ Utilisateur trouvé par email, UID: {}", uid);
                }
            }
            
            if (user == null) {
                log.error("❌ ERREUR: Utilisateur non trouvé dans la base de données pour UID: {}", uid);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "error", "Utilisateur non trouvé"
                ));
            }
            
            log.info("✅ Utilisateur trouvé: email={}, role={}", user.getEmail(), user.getRole());

            // Générer le custom token Firebase
            log.info("🔐 Génération du Firebase Custom Token pour UID: {}", uid);
            String customToken = FirebaseAuth.getInstance().createCustomToken(uid);
            log.info("✅ Firebase Custom Token généré avec succès");
            
            log.info("========================================");
            log.info("✅ SUCCÈS: Token Firebase retourné pour {}", user.getEmail());
            log.info("========================================");
            
            return ResponseEntity.ok(Map.of(
                "firebaseToken", customToken,
                "uid", uid,
                "email", user.getEmail()
            ));
            
        } catch (FirebaseAuthException e) {
            log.error("========================================");
            log.error("❌ ERREUR FIREBASE lors de la génération du Firebase Custom Token", e);
            log.error("Message: {}", e.getMessage());
            log.error("========================================");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Erreur lors de la génération du token Firebase",
                "details", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("========================================");
            log.error("❌ ERREUR INATTENDUE dans /api/auth/firebase-token", e);
            log.error("Message: {}", e.getMessage());
            log.error("========================================");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Erreur inattendue",
                "details", e.getMessage()
            ));
        }
    }

    // ========================================
    // Debug Endpoints
    // ========================================
    @Operation(summary = "[DEBUG] Voir les tentatives de connexion", description = "Endpoint de debug pour voir l'état des tentatives (développement uniquement)")
    @GetMapping("/debug/attempts")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<?> debugAttempts() {
        return ResponseEntity.ok(loginAttemptService.snapshot());
    }
}