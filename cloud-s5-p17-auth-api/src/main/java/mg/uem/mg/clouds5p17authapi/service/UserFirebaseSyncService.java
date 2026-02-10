package mg.uem.mg.clouds5p17authapi.service;

import mg.uem.mg.clouds5p17authapi.entity.User;
import mg.uem.mg.clouds5p17authapi.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Synchronise tous les utilisateurs existants vers Firebase Realtime Database au démarrage.
 * Désactivé en mode local (auth.mode=local).
 */
@Component
public class UserFirebaseSyncService implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(UserFirebaseSyncService.class);

    private final UserRepository userRepository;
    private final FirebaseService firebaseService;
    private final String authMode;

    public UserFirebaseSyncService(UserRepository userRepository, FirebaseService firebaseService,
            @org.springframework.beans.factory.annotation.Value("${auth.mode:auto}") String authMode) {
        this.userRepository = userRepository;
        this.firebaseService = firebaseService;
        this.authMode = authMode;
    }

    @Override
    public void run(String... args) {
        if ("local".equalsIgnoreCase(authMode)) {
            log.info("Mode LOCAL — sync users → Firebase Realtime DB ignorée");
            return;
        }
        try {
            log.info("Synchronisation des users existants vers Firebase Realtime Database...");
            
            List<User> users = userRepository.findAll();
            
            if (users.isEmpty()) {
                log.info("Aucun user à synchroniser.");
                return;
            }
            
            for (User user : users) {
                firebaseService.syncUser(user);
            }
            
            log.info("✅ {} users synchronisés avec Firebase Realtime Database", users.size());
            
        } catch (Exception e) {
            log.error("Erreur lors de la synchronisation des users: {}", e.getMessage());
        }
    }
}
