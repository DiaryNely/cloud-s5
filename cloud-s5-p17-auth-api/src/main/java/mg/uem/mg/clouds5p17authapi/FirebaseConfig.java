package mg.uem.mg.clouds5p17authapi;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.context.annotation.Configuration;

import javax.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;

@Configuration
public class FirebaseConfig {

    @PostConstruct
    public void initialize() {
        try (InputStream serviceAccount = getClass().getClassLoader().getResourceAsStream("firebase-service-account.json")) {
            if (serviceAccount == null) {
                System.err.println("Fichier firebase-service-account.json introuvable dans le classpath.");
                return;
            }

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .setDatabaseUrl("https://clouds5-p17-antananarivo-default-rtdb.firebaseio.com")
                    .build();

            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
            }

            System.out.println("Firebase initialisé avec succès !");
        } catch (Exception e) {
            System.err.println("Erreur lors de l'initialisation de Firebase : " + e.getMessage());
            e.printStackTrace();
            // Ne pas relancer l'exception pour permettre au service de démarrer même si Firebase échoue.
        }
    }
}