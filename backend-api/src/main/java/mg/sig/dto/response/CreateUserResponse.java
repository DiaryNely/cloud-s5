package mg.sig.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;
import mg.sig.dto.UtilisateurDTO;

/**
 * Réponse pour la création d'un utilisateur incluant le mot de passe temporaire
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Réponse de création d'utilisateur avec mot de passe temporaire")
public class CreateUserResponse {

    @Schema(description = "Utilisateur créé")
    private UtilisateurDTO user;

    @Schema(description = "Mot de passe temporaire généré", example = "Temp1234!@#$")
    private String temporaryPassword;

    @Schema(description = "Message d'information")
    private String message;
}
