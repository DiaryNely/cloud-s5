package mg.sig.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * Configuration Swagger/OpenAPI.
 */
@Configuration
public class OpenApiConfig {

    @Value("${server.port:8080}")
    private String serverPort;

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("API Signalements Routiers - Antananarivo")
                        .version("1.0.0")
                        .description("""
                            API REST pour la gestion des signalements de travaux routiers à Antananarivo, Madagascar.
                            
                            ## Fonctionnalités
                            - **Authentification** : JWT avec support offline PostgreSQL et Firebase
                            - **Signalements** : CRUD complet avec géolocalisation
                            - **Utilisateurs** : Gestion des comptes et blocage/déblocage
                            - **Synchronisation** : Firebase bidirectionnel
                            - **Audit** : Journal des actions sensibles
                            
                            ## Authentification
                            Utilisez `/auth/login` pour obtenir un token JWT, puis incluez-le dans le header `Authorization: Bearer <token>`.
                            
                            ## Comptes de test
                            - **Manager**: `admin@manager.mg` / `Manager2026!`
                            - **Utilisateur**: `user@app.mg` / `User2026!`
                            """)
                        .contact(new Contact()
                                .name("Équipe Formation")
                                .email("support@formation.mg"))
                        .license(new License()
                                .name("MIT")
                                .url("https://opensource.org/licenses/MIT")))
                .servers(List.of(
                        new Server()
                                .url("http://localhost:" + serverPort + "/api")
                                .description("Serveur de développement")))
                .components(new Components()
                        .addSecuritySchemes("bearerAuth", new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Token JWT obtenu via /auth/login")))
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"));
    }
}
