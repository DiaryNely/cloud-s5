package mg.sig.service;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.google.firebase.database.*;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import mg.sig.entity.*;
import mg.sig.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.FileInputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Service de synchronisation Firebase.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FirebaseService {

    private final SignalementRepository signalementRepository;
    private final UserRepository userRepository;
    private final SignalementStatusRepository signalementStatusRepository; // Inject status repository
    private final AuditService auditService;

    @Value("${firebase.enabled:false}")
    private boolean firebaseEnabled;

    @Value("${firebase.credentials-path:firebase-credentials.json}")
    private String credentialsPath;

    @Value("${firebase.database-url:}")
    private String databaseUrl;

    private DatabaseReference database;

    @PostConstruct
    public void initialize() {
        if (!firebaseEnabled) {
            log.info("Firebase est désactivé");
            return;
        }

        try {
            FileInputStream serviceAccount = new FileInputStream(credentialsPath);

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .setDatabaseUrl(databaseUrl)
                    .build();

            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
            }

            database = FirebaseDatabase.getInstance().getReference();

            // Listen for new signalements from Firebase
            database.child("signalements").addChildEventListener(new ChildEventListener() {
                @Override
                public void onChildAdded(DataSnapshot snapshot, String previousChildName) {
                    try {
                        processFirebaseSignalement(snapshot);
                    } catch (Exception e) {
                        log.error("Erreur processing signalement child_added {}", snapshot.getKey(), e);
                    }
                }

                @Override
                public void onChildChanged(DataSnapshot snapshot, String previousChildName) {
                }

                @Override
                public void onChildRemoved(DataSnapshot snapshot) {
                }

                @Override
                public void onChildMoved(DataSnapshot snapshot, String previousChildName) {
                }

                @Override
                public void onCancelled(DatabaseError error) {
                    log.error("Firebase listener cancelled: {}", error.getMessage());
                }
            });

            log.info("Firebase initialisé avec succès et listener démarré");
        } catch (IOException e) {
            log.error("Erreur lors de l'initialisation de Firebase", e);
        }
    }

    /**
     * Vérifie un token Firebase et retourne les informations utilisateur
     */
    public FirebaseToken verifyToken(String idToken) throws FirebaseAuthException {
        if (!firebaseEnabled) {
            throw new RuntimeException("Firebase est désactivé");
        }
        return FirebaseAuth.getInstance().verifyIdToken(idToken);
    }

    /**
     * Synchronise les signalements non synchronisés vers Firebase (DÉSACTIVÉ -
     * synchronisation manuelle uniquement)
     */
    @Transactional
    public void syncSignalementsToFirebase() {
        // Méthode conservée mais ne s'exécute plus automatiquement
        log.debug("Synchronisation automatique désactivée. Utilisez la synchronisation manuelle.");
    }

    /**
     * Synchronise MANUELLEMENT les signalements vers Firebase
     */
    @Transactional
    public int syncSignalementsToFirebaseManual() {
        if (!firebaseEnabled || database == null) {
            throw new RuntimeException("Firebase non disponible");
        }

        List<Signalement> allSignalements = signalementRepository.findAll();

        if (allSignalements.isEmpty()) {
            return 0;
        }

        log.info("Synchronisation manuelle de {} signalements vers Firebase", allSignalements.size());

        int synced = 0;
        for (Signalement signalement : allSignalements) {
            try {
                // Seulement si pas encore sync ou forcé
                if (signalement.getFirebaseId() != null && Boolean.TRUE.equals(signalement.getSyncedWithFirebase())) {
                    continue;
                }

                Map<String, Object> data = signalementToMap(signalement);

                String firebaseId = signalement.getFirebaseId();
                if (firebaseId == null) {
                    firebaseId = database.child("signalements").push().getKey();
                    signalement.setFirebaseId(firebaseId);
                }

                database.child("signalements").child(firebaseId).setValueAsync(data);

                signalement.setSyncedWithFirebase(true);
                signalement.setLastFirebaseSync(LocalDateTime.now());
                signalementRepository.save(signalement);
                synced++;

            } catch (Exception e) {
                log.error("Erreur sync signalement {} vers Firebase", signalement.getId(), e);
            }
        }

        log.info("Synchronisation Firebase terminée: {} nouveaux signalements synchronisés", synced);
        return synced;
    }

    /**
     * Synchronise TOUS les utilisateurs vers Firebase
     */
    @Transactional
    public int syncUsersToFirebase() {
        if (!firebaseEnabled || database == null) {
            throw new RuntimeException("Firebase non disponible");
        }

        List<User> allUsers = userRepository.findAll();

        if (allUsers.isEmpty()) {
            return 0;
        }

        log.info("Synchronisation de {} utilisateurs vers Firebase", allUsers.size());

        int synced = 0;
        for (User user : allUsers) {
            try {
                Map<String, Object> userData = userToMap(user);

                String firebaseId = user.getFirebaseUid();
                if (firebaseId == null) {
                    firebaseId = database.child("users").push().getKey();
                    user.setFirebaseUid(firebaseId);
                    userRepository.save(user);
                }

                database.child("users").child(firebaseId).setValueAsync(userData);
                synced++;

            } catch (Exception e) {
                log.error("Erreur sync utilisateur {} vers Firebase", user.getId(), e);
            }
        }

        log.info("Synchronisation utilisateurs terminée: {}/{}", synced, allUsers.size());
        return synced;
    }

    /**
     * Convertit un utilisateur en Map pour Firebase
     */
    private Map<String, Object> userToMap(User u) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", u.getId());
        map.put("email", u.getEmail());
        map.put("nom", u.getNom());
        map.put("prenom", u.getPrenom());
        map.put("telephone", u.getTelephone());
        map.put("role", u.getRole().getCode().toLowerCase());
        map.put("actif", u.getActif());
        map.put("bloque", u.getBloque());
        map.put("dateCreation", u.getDateCreation() != null ? u.getDateCreation().toString() : null);
        map.put("derniereConnexion", u.getDerniereConnexion() != null ? u.getDerniereConnexion().toString() : null);
        return map;
    }

    /**
     * Traite un signalement venant de Firebase
     */
    @Transactional
    public void processFirebaseSignalement(DataSnapshot snapshot) {
        String firebaseId = snapshot.getKey();
        if (firebaseId == null)
            return;

        // Eviter boucle infinie: si on l'a déjà et qu'il est sync, on ignore
        // (Pour l'instant on gère que la création)
        if (signalementRepository.findByFirebaseId(firebaseId).isPresent()) {
            return;
        }

        log.info("Nouveau signalement détecté depuis Firebase: {}", firebaseId);

        try {
            Signalement s = new Signalement();
            s.setFirebaseId(firebaseId);
            s.setSyncedWithFirebase(true);
            s.setLastFirebaseSync(LocalDateTime.now());

            // Mapping des champs
            if (snapshot.hasChild("localisation"))
                s.setLocalisation(snapshot.child("localisation").getValue(String.class));

            if (snapshot.hasChild("description"))
                s.setDescription(snapshot.child("description").getValue(String.class));

            if (snapshot.hasChild("latitude"))
                s.setLatitude(BigDecimal.valueOf(snapshot.child("latitude").getValue(Double.class)));

            if (snapshot.hasChild("longitude"))
                s.setLongitude(BigDecimal.valueOf(snapshot.child("longitude").getValue(Double.class)));

            if (snapshot.hasChild("surface"))
                s.setSurface(BigDecimal.valueOf(snapshot.child("surface").getValue(Double.class)));

            if (snapshot.hasChild("budgetEstime"))
                s.setBudgetEstime(BigDecimal.valueOf(snapshot.child("budgetEstime").getValue(Double.class)));

            // Dates
            if (snapshot.hasChild("dateCreation")) {
                String dateStr = snapshot.child("dateCreation").getValue(String.class);
                try {
                    // Support format ISO 8601
                    s.setDateCreation(LocalDateTime.parse(dateStr, DateTimeFormatter.ISO_DATE_TIME));
                } catch (Exception e) {
                    s.setDateCreation(LocalDateTime.now());
                }
            } else {
                s.setDateCreation(LocalDateTime.now());
            }

            // Statut
            String statutCode = "NOUVEAU";
            if (snapshot.hasChild("statut")) {
                statutCode = snapshot.child("statut").getValue(String.class);
            }

            String finalStatutCode = statutCode;
            SignalementStatus status = signalementStatusRepository.findByCode(finalStatutCode.toUpperCase())
                    .orElseGet(() -> signalementStatusRepository.findByCode("NOUVEAU").orElse(null));

            if (status == null) {
                log.error("Statut introuvable: NOUVEAU. Impossible de créer le signalement.");
                return;
            }
            s.setStatus(status);

            // User (CreePar)
            // TODO: Récupérer le vrai user depuis Firebase Auth ou un champ userId dans le
            // payload
            // Pour l'instant on prend le premier admin ou user système
            User defaultUser = userRepository.findById(1)
                    .orElseThrow(() -> new RuntimeException("User par défaut introuvable"));
            s.setCreePar(defaultUser);

            signalementRepository.save(s);
            log.info("Signalement {} sauvegardé dans PostgreSQL (ID: {})", firebaseId, s.getId());

        } catch (Exception e) {
            log.error("Erreur lors de la conversion/sauvegarde du signalement Firebase {}", firebaseId, e);
        }
    }

    private Map<String, Object> signalementToMap(Signalement s) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", s.getId());
        map.put("localisation", s.getLocalisation());
        map.put("latitude", s.getLatitude() != null ? s.getLatitude().doubleValue() : 0.0);
        map.put("longitude", s.getLongitude() != null ? s.getLongitude().doubleValue() : 0.0);
        map.put("description", s.getDescription());
        map.put("surface", s.getSurface() != null ? s.getSurface().doubleValue() : null);
        map.put("budgetEstime", s.getBudgetEstime() != null ? s.getBudgetEstime().doubleValue() : null);
        map.put("statut", s.getStatus() != null ? s.getStatus().getCode().toUpperCase() : "NOUVEAU");
        map.put("entreprise", s.getEntrepriseNom());
        map.put("creePar", s.getCreateurNom());
        map.put("dateCreation",
                s.getDateCreation() != null ? s.getDateCreation().toString() : LocalDateTime.now().toString());
        return map;
    }

    /**
     * Force la synchronisation
     */
    @Transactional
    public int forceSync(String adminEmail) {
        if (!firebaseEnabled) {
            log.warn("Firebase est désactivé, synchronisation ignorée");
            return 0;
        }

        List<Signalement> all = signalementRepository.findAll();
        // Reset sync status to force re-push
        // Note: this might duplicate data if IDs not handled correctly, but
        // setFirebaseId handles it

        syncSignalementsToFirebaseManual();

        auditService.logAction(
                AuditLog.ACTION_SYNCHRONISATION, "FIREBASE", null,
                adminEmail, "Synchronisation Firebase forcée", null);

        return all.size();
    }
}
