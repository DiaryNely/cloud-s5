package mg.uem.mg.clouds5p17authapi.service;

import jakarta.annotation.PostConstruct;
import mg.uem.mg.clouds5p17authapi.entity.Signalement;
import mg.uem.mg.clouds5p17authapi.repository.SignalementRepository;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service pour synchroniser les signalements existants de PostgreSQL vers Firebase au démarrage.
 * Désactivé en mode local (auth.mode=local).
 */
@Service
public class SignalementInitializer {

    private final SignalementRepository repository;
    private final FirebaseService firebaseService;
    private final String authMode;

    public SignalementInitializer(SignalementRepository repository, FirebaseService firebaseService,
            @org.springframework.beans.factory.annotation.Value("${auth.mode:auto}") String authMode) {
        this.repository = repository;
        this.firebaseService = firebaseService;
        this.authMode = authMode;
    }

    @PostConstruct
    public void initializeFirebase() {
        if ("local".equalsIgnoreCase(authMode)) {
            System.out.println("Mode LOCAL — sync signalements → Firebase ignorée");
            return;
        }
        try {
            // Récupérer tous les signalements de PostgreSQL
            List<Signalement> signalements = repository.findAll();
            
            if (signalements.isEmpty()) {
                System.out.println("Aucun signalement à synchroniser");
                return;
            }

            // Synchroniser chaque signalement vers Firebase
            for (Signalement signalement : signalements) {
                firebaseService.syncSignalement(signalement);
            }

            System.out.println("✅ " + signalements.size() + " signalements synchronisés vers Firebase");
        } catch (Exception e) {
            System.err.println("Erreur lors de la synchronisation initiale : " + e.getMessage());
            e.printStackTrace();
        }
    }
}
