package mg.sig.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.time.LocalDateTime;

/**
 * DTO Utilisateur aligné sur la structure frontend utilisateurs.
 * Compatible avec: manager-app/src/data/utilisateurs.js
 *                  mobile-signalement/src/data/utilisateurs.js
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Utilisateur du système")
public class UtilisateurDTO {

    @Schema(description = "Identifiant unique", example = "1")
    private Integer id;

    @Schema(description = "Adresse email", example = "admin@manager.mg")
    private String email;

    @Schema(description = "Nom de famille", example = "Admin")
    private String nom;

    @Schema(description = "Prénom", example = "Manager")
    private String prenom;

    @Schema(description = "Code du rôle", example = "manager", allowableValues = {"manager", "mobile", "utilisateur"})
    private String role;

    @Schema(description = "Date de création", example = "2025-12-01T10:00:00")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime dateCreation;
    
    @Schema(description = "Date d'inscription (alias)", example = "2025-12-01")
    private String dateInscription;

    @Schema(description = "Compte actif", example = "true")
    private Boolean actif;

    @Schema(description = "Compte bloqué", example = "false")
    private Boolean bloque;

    @Schema(description = "Mot de passe temporaire", example = "TempPass123!")
    private String temporaryPassword;

    @Schema(description = "Date de dernière connexion", example = "2026-01-20T08:30:00")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime derniereConnexion;
}
