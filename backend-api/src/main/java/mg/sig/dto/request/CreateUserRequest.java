package mg.sig.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.*;

/**
 * DTO pour la création d'un utilisateur.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Requête de création d'un utilisateur")
public class CreateUserRequest {

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Format email invalide")
    @Schema(description = "Adresse email", example = "nouveau@app.mg", required = true)
    private String email;

    @NotBlank(message = "Le nom est obligatoire")
    @Size(max = 100, message = "Le nom ne peut pas dépasser 100 caractères")
    @Schema(description = "Nom de famille", example = "Rakoto", required = true)
    private String nom;

    @NotBlank(message = "Le prénom est obligatoire")
    @Size(max = 100, message = "Le prénom ne peut pas dépasser 100 caractères")
    @Schema(description = "Prénom", example = "Jean", required = true)
    private String prenom;

    @Size(max = 50, message = "Le téléphone ne peut pas dépasser 50 caractères")
    @Schema(description = "Numéro de téléphone", example = "+261 34 12 345 67")
    private String telephone;

    @NotBlank(message = "Le mot de passe est obligatoire")
    @Size(min = 6, max = 50, message = "Le mot de passe doit contenir entre 6 et 50 caractères")
    @Schema(description = "Mot de passe de l'utilisateur", example = "MotDePasse123!", required = true)
    private String password;

    @Schema(description = "Code du rôle", example = "mobile", allowableValues = {"manager", "mobile", "utilisateur"})
    private String role;
}
