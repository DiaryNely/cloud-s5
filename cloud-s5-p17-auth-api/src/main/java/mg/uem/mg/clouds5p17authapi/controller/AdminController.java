package mg.uem.mg.clouds5p17authapi.controller;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.beans.factory.annotation.Value;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import mg.uem.mg.clouds5p17authapi.dto.AdminUserDto;
import mg.uem.mg.clouds5p17authapi.dto.RegisterRequest;
import mg.uem.mg.clouds5p17authapi.dto.UpdateUserRequest;
import mg.uem.mg.clouds5p17authapi.entity.User;
import mg.uem.mg.clouds5p17authapi.repository.UserRepository;
import mg.uem.mg.clouds5p17authapi.service.FirebaseService;
import mg.uem.mg.clouds5p17authapi.service.HybridAuthService;
import mg.uem.mg.clouds5p17authapi.service.LoginAttemptService;
import mg.uem.mg.clouds5p17authapi.service.SyncService;

@RestController
@RequestMapping("/api/admin")
@Tag(name = "Administration", description = "Endpoints réservés au manager")
@PreAuthorize("hasRole('MANAGER')")
public class AdminController {

    private static final Logger log = LoggerFactory.getLogger(AdminController.class);

    @Value("${auth.mode:auto}")
    private String authMode;

    private final UserRepository userRepository;
    private final HybridAuthService hybridAuthService;
    private final LoginAttemptService loginAttemptService;
    private final SyncService syncService;
    private final FirebaseService firebaseService;

    public AdminController(UserRepository userRepository, HybridAuthService hybridAuthService, 
                          LoginAttemptService loginAttemptService, SyncService syncService,
                          FirebaseService firebaseService) {
        this.userRepository = userRepository;
        this.hybridAuthService = hybridAuthService;
        this.loginAttemptService = loginAttemptService;
        this.syncService = syncService;
        this.firebaseService = firebaseService;
    }

    @Operation(summary = "Lister tous les utilisateurs", description = "Retourne la liste des utilisateurs (Firebase + PostgreSQL)")
    @GetMapping("/users")
    public ResponseEntity<?> listUsers(
            @Parameter(description = "Filtrer uniquement les comptes bloqués")
            @RequestParam(name = "blocked", required = false) Boolean blockedOnly) {

        Instant now = Instant.now();
        List<AdminUserDto> users = new java.util.ArrayList<>();
        
        // 1. Ajouter les utilisateurs de PostgreSQL
        List<AdminUserDto> localUsers = userRepository.findAll().stream()
                .map(user -> toDto(user, now))
                .collect(Collectors.toList());
        users.addAll(localUsers);
        
        // 2. En mode local, on ne va pas chercher les utilisateurs Firebase
        if (!"local".equalsIgnoreCase(authMode)) {
            try {
                com.google.firebase.auth.ListUsersPage page = com.google.firebase.auth.FirebaseAuth.getInstance().listUsers(null);
                while (page != null) {
                    for (com.google.firebase.auth.UserRecord firebaseUser : page.getValues()) {
                        boolean existsLocally = localUsers.stream()
                                .anyMatch(u -> u.email().equals(firebaseUser.getEmail()));
                        
                        if (!existsLocally) {
                            String role = "UTILISATEUR";
                            if (firebaseUser.getCustomClaims() != null && firebaseUser.getCustomClaims().get("role") != null) {
                                role = firebaseUser.getCustomClaims().get("role").toString();
                            }
                            
                            boolean temporarilyBlocked = loginAttemptService.isBlocked(firebaseUser.getEmail());
                            
                            AdminUserDto dto = new AdminUserDto(
                                    firebaseUser.getUid(),
                                    firebaseUser.getEmail(),
                                    role,
                                    firebaseUser.getDisplayName() != null ? firebaseUser.getDisplayName().split(" ")[0] : null,
                                    firebaseUser.getDisplayName() != null && firebaseUser.getDisplayName().contains(" ") 
                                        ? firebaseUser.getDisplayName().substring(firebaseUser.getDisplayName().indexOf(" ") + 1) : null,
                                    null,
                                    firebaseUser.isDisabled() || temporarilyBlocked,
                                    null,
                                    true,
                                    firebaseUser.getUid()
                            );
                            users.add(dto);
                        }
                    }
                    page = page.getNextPage();
                }
            } catch (Exception e) {
                log.warn("Erreur lors de la récupération des utilisateurs Firebase: {}", e.getMessage());
            }
        }
        
        // Filtrer si nécessaire
        if (blockedOnly != null) {
            users = users.stream()
                    .filter(dto -> dto.blocked() == blockedOnly)
                    .collect(Collectors.toList());
        }

        return ResponseEntity.ok(users);
    }

    @Operation(summary = "Bloquer un utilisateur", description = "Bloque un utilisateur (local et Firebase si possible)")
    @PostMapping("/users/{uid}/block")
    public ResponseEntity<?> blockUser(@PathVariable String uid) {
        boolean success = hybridAuthService.blockUser(uid);
        if (success) {
            return ResponseEntity.ok(Map.of("message", "Utilisateur bloqué", "uid", uid));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Utilisateur non trouvé", "uid", uid));
    }

    @Operation(summary = "Débloquer un utilisateur", description = "Débloque un utilisateur (local et Firebase si possible)")
    @PostMapping("/users/{uid}/unblock")
    public ResponseEntity<?> unblockUser(@PathVariable String uid) {
        // Débloquer dans la base PostgreSQL + Firebase
        boolean success = hybridAuthService.unblockUser(uid);
        
        // Débloquer aussi dans LoginAttemptService (pour utilisateurs Firebase uniquement)
        // Chercher l'email de l'utilisateur par UID
        try {
            com.google.firebase.auth.UserRecord firebaseUser = com.google.firebase.auth.FirebaseAuth.getInstance().getUser(uid);
            if (firebaseUser != null && firebaseUser.getEmail() != null) {
                loginAttemptService.reset(firebaseUser.getEmail());
            }
        } catch (com.google.firebase.auth.FirebaseAuthException e) {
            // Ignore si l'utilisateur n'existe pas dans Firebase
        }
        
        if (success) {
            return ResponseEntity.ok(Map.of("message", "Utilisateur débloqué", "uid", uid));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Utilisateur non trouvé", "uid", uid));
    }

    @Operation(summary = "Créer un utilisateur", description = "Crée un nouveau compte utilisateur (réservé au manager)")
    @PostMapping("/users")
    public ResponseEntity<?> createUser(@RequestBody RegisterRequest request) {
        HybridAuthService.AuthResult result = hybridAuthService.register(request);

        if (result.success()) {
            Map<String, Object> response = new HashMap<>();
            response.put("uid", result.uid());
            response.put("email", result.email());
            response.put("role", result.role());
            response.put("message", "Utilisateur créé avec succès");
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(Map.of("error", result.error()));
        }
    }

    @Operation(summary = "Modifier un utilisateur", description = "Met à jour les informations d'un utilisateur")
    @PatchMapping("/users/{uid}")
    public ResponseEntity<?> updateUser(@PathVariable String uid, @RequestBody UpdateUserRequest request) {
        // D'abord, essayer de trouver l'utilisateur dans PostgreSQL LOCAL
        var localUserOpt = userRepository.findByUid(uid);
        
        if (localUserOpt.isPresent()) {
            // 1. Modifier d'abord en LOCAL PostgreSQL
            User user = localUserOpt.get();
            if (request.nom() != null) {
                user.setNom(request.nom());
            }
            if (request.prenom() != null) {
                user.setPrenom(request.prenom());
            }
            if (request.numEtu() != null) {
                user.setNumEtu(request.numEtu());
            }
            if (request.role() != null && (request.role().equals("USER") || request.role().equals("MANAGER"))) {
                user.setRole(request.role());
            }
            userRepository.save(user);
            log.info("✅ Utilisateur modifié en LOCAL: {}", uid);
            
            // 2. Synchroniser vers Firebase Authentication
            String firebaseUid = user.getFirebaseUid() != null ? user.getFirebaseUid() : uid;
            try {
                com.google.firebase.auth.UserRecord.UpdateRequest updateRequest = 
                    new com.google.firebase.auth.UserRecord.UpdateRequest(firebaseUid);
                
                if (request.nom() != null || request.prenom() != null) {
                    String displayName = (user.getPrenom() != null ? user.getPrenom() : "") + " " + 
                                       (user.getNom() != null ? user.getNom() : "");
                    updateRequest.setDisplayName(displayName.trim());
                }
                
                com.google.firebase.auth.FirebaseAuth.getInstance().updateUser(updateRequest);
                
                if (request.role() != null) {
                    Map<String, Object> claims = new HashMap<>();
                    claims.put("role", user.getRole());
                    com.google.firebase.auth.FirebaseAuth.getInstance().setCustomUserClaims(firebaseUid, claims);
                }
                log.info("✅ Utilisateur modifié dans Firebase Auth: {}", firebaseUid);
            } catch (com.google.firebase.auth.FirebaseAuthException e) {
                log.warn("⚠️ Impossible de modifier dans Firebase Auth: {}", e.getMessage());
            }
            
            // 3. Synchroniser vers Firebase Realtime Database pour mise à jour instantanée
            try {
                firebaseService.syncUser(user);
                log.info("✅ Modifications synchronisées vers Firebase Realtime DB: {}", uid);
            } catch (Exception e) {
                log.warn("⚠️ Erreur synchronisation vers Realtime DB: {}", e.getMessage());
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("uid", user.getUid());
            response.put("email", user.getEmail());
            response.put("nom", user.getNom());
            response.put("prenom", user.getPrenom());
            response.put("numEtu", user.getNumEtu());
            response.put("role", user.getRole());
            response.put("message", "Utilisateur modifié avec succès");
            return ResponseEntity.ok(response);
        }
        
        // Sinon, essayer de trouver l'utilisateur dans Firebase
        try {
            com.google.firebase.auth.UserRecord firebaseUser = com.google.firebase.auth.FirebaseAuth.getInstance().getUser(uid);
            
            // Mettre à jour le displayName Firebase si nom/prenom fournis
            if (request.nom() != null || request.prenom() != null) {
                com.google.firebase.auth.UserRecord.UpdateRequest updateRequest = 
                    new com.google.firebase.auth.UserRecord.UpdateRequest(uid);
                
                String displayName = (request.prenom() != null ? request.prenom() : "") + " " + 
                                   (request.nom() != null ? request.nom() : "");
                updateRequest.setDisplayName(displayName.trim());
                
                com.google.firebase.auth.FirebaseAuth.getInstance().updateUser(updateRequest);
            }
            
            // Mettre à jour le role dans les custom claims si fourni
            if (request.role() != null) {
                Map<String, Object> claims = new HashMap<>();
                if (firebaseUser.getCustomClaims() != null) {
                    claims.putAll(firebaseUser.getCustomClaims());
                }
                claims.put("role", request.role());
                com.google.firebase.auth.FirebaseAuth.getInstance().setCustomUserClaims(uid, claims);
            }
            
            // Récupérer l'utilisateur mis à jour
            firebaseUser = com.google.firebase.auth.FirebaseAuth.getInstance().getUser(uid);
            
            Map<String, Object> response = new HashMap<>();
            response.put("uid", firebaseUser.getUid());
            response.put("email", firebaseUser.getEmail());
            
            // Parser displayName en nom/prenom
            if (firebaseUser.getDisplayName() != null && !firebaseUser.getDisplayName().isEmpty()) {
                String[] parts = firebaseUser.getDisplayName().split(" ", 2);
                response.put("prenom", parts.length > 0 ? parts[0] : null);
                response.put("nom", parts.length > 1 ? parts[1] : null);
            }
            
            // Récupérer le role des custom claims
            String role = "UTILISATEUR";
            if (firebaseUser.getCustomClaims() != null && firebaseUser.getCustomClaims().get("role") != null) {
                role = firebaseUser.getCustomClaims().get("role").toString();
            }
            response.put("role", role);
            response.put("message", "Utilisateur Firebase modifié avec succès");
            
            return ResponseEntity.ok(response);
            
        } catch (com.google.firebase.auth.FirebaseAuthException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "Utilisateur non trouvé", "uid", uid, "details", e.getMessage()));
        }
    }

    @Operation(summary = "Supprimer un utilisateur", description = "Supprime un utilisateur de la base de données")
    @DeleteMapping("/users/{uid}")
    public ResponseEntity<?> deleteUser(@PathVariable String uid) {
        // Chercher d'abord par UID local
        Optional<User> optUser = userRepository.findByUid(uid);
        
        // Si non trouvé, chercher par Firebase UID
        if (optUser.isEmpty()) {
            optUser = userRepository.findByFirebaseUid(uid);
        }
        
        return optUser
            .map(user -> {
                String firebaseUid = user.getFirebaseUid() != null ? user.getFirebaseUid() : uid;
                
                // 1. D'abord supprimer de PostgreSQL LOCAL
                userRepository.delete(user);
                log.info("✅ Utilisateur supprimé de LOCAL PostgreSQL: {}", uid);
                
                // 2. Ensuite supprimer de Firebase Authentication
                try {
                    com.google.firebase.auth.FirebaseAuth.getInstance().deleteUser(firebaseUid);
                    log.info("✅ Utilisateur supprimé de Firebase Auth: {}", firebaseUid);
                } catch (com.google.firebase.auth.FirebaseAuthException e) {
                    log.warn("⚠️ Impossible de supprimer de Firebase Auth {}: {}", firebaseUid, e.getMessage());
                }
                
                // 3. Supprimer de Firebase Realtime Database pour mise à jour instantanée de l'UI
                // Utiliser le firebaseUid pour supprimer du bon noeud dans Realtime DB
                try {
                    firebaseService.deleteUser(firebaseUid);
                    log.info("✅ Utilisateur supprimé de Firebase Realtime DB: {}", firebaseUid);
                } catch (Exception e) {
                    log.warn("⚠️ Erreur suppression de Realtime DB: {}", e.getMessage());
                }
                
                return ResponseEntity.ok(Map.of("message", "Utilisateur supprimé", "uid", uid));
            })
            .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "Utilisateur non trouvé", "uid", uid)));
    }

    @Operation(summary = "Synchroniser vers Firebase", description = "Synchronise tous les utilisateurs et signalements locaux vers Firebase (Auth + Realtime DB)")
    @PostMapping("/sync-to-firebase")
    public ResponseEntity<?> syncToFirebase() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // ========== 1. Synchroniser les UTILISATEURS ==========
            List<User> allUsers = userRepository.findAll();
            int syncedUsersCount = 0;
            int failedUsersCount = 0;
            List<String> errors = new java.util.ArrayList<>();
            
            for (User user : allUsers) {
                try {
                    // a) Sync vers Firebase Auth (créer le compte si nécessaire)
                    if (!Boolean.TRUE.equals(user.getSyncedToFirebase())) {
                        com.google.firebase.auth.UserRecord existingUser = null;
                        try {
                            existingUser = com.google.firebase.auth.FirebaseAuth.getInstance().getUserByEmail(user.getEmail());
                        } catch (com.google.firebase.auth.FirebaseAuthException e) {
                            // L'utilisateur n'existe pas dans Firebase, c'est normal
                        }
                        
                        if (existingUser != null) {
                            user.setFirebaseUid(existingUser.getUid());
                        } else {
                            // Créer l'utilisateur dans Firebase Auth
                            com.google.firebase.auth.UserRecord.CreateRequest request = 
                                new com.google.firebase.auth.UserRecord.CreateRequest()
                                    .setEmail(user.getEmail())
                                    .setPassword(generateTemporaryPassword())
                                    .setEmailVerified(true);
                            
                            if (user.getPrenom() != null || user.getNom() != null) {
                                String displayName = (user.getPrenom() != null ? user.getPrenom() : "") + " " + 
                                                   (user.getNom() != null ? user.getNom() : "");
                                request.setDisplayName(displayName.trim());
                            }
                            
                            com.google.firebase.auth.UserRecord firebaseUser = 
                                com.google.firebase.auth.FirebaseAuth.getInstance().createUser(request);
                            user.setFirebaseUid(firebaseUser.getUid());
                            
                            // Set custom claims (role)
                            Map<String, Object> claims = new HashMap<>();
                            claims.put("role", user.getRole());
                            com.google.firebase.auth.FirebaseAuth.getInstance().setCustomUserClaims(firebaseUser.getUid(), claims);
                        }
                        
                        user.setSyncedToFirebase(true);
                        userRepository.save(user);
                    }
                    
                    // b) Sync vers Firebase Realtime Database (toujours pousser les données)
                    firebaseService.syncUser(user);
                    syncedUsersCount++;
                    
                } catch (Exception e) {
                    failedUsersCount++;
                    errors.add("Utilisateur " + user.getEmail() + ": " + e.getMessage());
                }
            }
            
            // ========== 2. Synchroniser les SIGNALEMENTS vers Firebase ==========
            Map<String, Object> sigResult = syncService.syncAllSignalementsToFirebase();
            
            // ========== 3. Importer les SIGNALEMENTS depuis Firebase ==========
            Map<String, Object> importResult = syncService.syncSignalementsFromFirebase();
            
            response.put("usersTotal", allUsers.size());
            response.put("usersSynced", syncedUsersCount);
            response.put("usersFailed", failedUsersCount);
            response.put("signalementsSynced", sigResult.getOrDefault("syncedCount", 0));
            response.put("signalementsFailed", sigResult.getOrDefault("failedCount", 0));
            response.put("signalementsImported", importResult.getOrDefault("createdCount", 0));
            response.put("signalementsImportUpdated", importResult.getOrDefault("updatedCount", 0));
            
            int sigSynced = (int) sigResult.getOrDefault("syncedCount", 0);
            int sigImported = (int) importResult.getOrDefault("createdCount", 0);
            response.put("message", syncedUsersCount + " utilisateur(s) synchronisé(s), " 
                + sigSynced + " signalement(s) exporté(s) vers Firebase, " 
                + sigImported + " signalement(s) importé(s) depuis Firebase");
            if (!errors.isEmpty()) {
                response.put("errors", errors);
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Erreur lors de la synchronisation: " + e.getMessage()));
        }
    }

    @Operation(summary = "Synchroniser les signalements vers Firebase", 
               description = "Synchronise tous les signalements non synchronisés de PostgreSQL vers Firebase")
    @PostMapping("/sync-signalements")
    public ResponseEntity<?> syncSignalements() {
        try {
            Map<String, Object> result = syncService.syncSignalementsToFirebase();
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Erreur lors de la synchronisation des signalements: " + e.getMessage()));
        }
    }

    @Operation(summary = "Obtenir le statut de synchronisation des signalements",
               description = "Retourne le nombre de signalements synchronisés et non synchronisés")
    @GetMapping("/signalements/sync-status")
    public ResponseEntity<?> getSignalementsSyncStatus() {
        try {
            Map<String, Object> status = syncService.getSignalementsSyncStatus();
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Erreur lors de la récupération du statut: " + e.getMessage()));
        }
    }

    @Operation(summary = "Synchroniser depuis Firebase vers Local", 
               description = "Récupère les signalements de Firebase et les importe en local (PostgreSQL)")
    @PostMapping("/sync-from-firebase")
    public ResponseEntity<?> syncFromFirebase() {
        try {
            Map<String, Object> result = syncService.syncSignalementsFromFirebase();
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Erreur lors de la synchronisation depuis Firebase: " + e.getMessage()));
        }
    }
    
    private String generateTemporaryPassword() {
        // Générer un mot de passe temporaire aléatoire
        return java.util.UUID.randomUUID().toString().substring(0, 16);
    }

    private AdminUserDto toDto(User user, Instant now) {
        boolean blocked = user.getBlockedUntil() != null && now.isBefore(user.getBlockedUntil());
        return new AdminUserDto(
                user.getUid(),
                user.getEmail(),
                user.getRole(),
                user.getNom(),
                user.getPrenom(),
                user.getNumEtu(),
                blocked,
                user.getBlockedUntil(),
                Boolean.TRUE.equals(user.getSyncedToFirebase()),
                user.getFirebaseUid()
        );
    }
}
