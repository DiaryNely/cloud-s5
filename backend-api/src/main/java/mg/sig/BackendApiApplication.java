package mg.sig;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Application principale du backend de gestion des signalements routiers.
 * 
 * Cette application fournit une API REST pour:
 * - La gestion des signalements de travaux routiers à Antananarivo
 * - L'authentification des utilisateurs (Firebase + PostgreSQL offline)
 * - La synchronisation bidirectionnelle avec Firebase
 * - La gestion des utilisateurs et des rôles
 */
@SpringBootApplication
@EnableJpaAuditing
@EnableScheduling
public class BackendApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackendApiApplication.class, args);
    }
}
