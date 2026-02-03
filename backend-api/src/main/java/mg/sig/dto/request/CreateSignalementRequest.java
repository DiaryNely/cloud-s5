package mg.sig.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * DTO pour la création d'un signalement.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Requête de création d'un signalement")
public class CreateSignalementRequest {

    @NotBlank(message = "La localisation est obligatoire")
    @Size(max = 255, message = "La localisation ne peut pas dépasser 255 caractères")
    @Schema(description = "Adresse/localisation", example = "Avenue de l'Indépendance", required = true)
    private String localisation;

    @NotNull(message = "La latitude est obligatoire")
    @DecimalMin(value = "-90.0", message = "Latitude invalide")
    @DecimalMax(value = "90.0", message = "Latitude invalide")
    @Schema(description = "Latitude GPS", example = "-18.8792", required = true)
    private BigDecimal latitude;

    @NotNull(message = "La longitude est obligatoire")
    @DecimalMin(value = "-180.0", message = "Longitude invalide")
    @DecimalMax(value = "180.0", message = "Longitude invalide")
    @Schema(description = "Longitude GPS", example = "47.5079", required = true)
    private BigDecimal longitude;

    @NotBlank(message = "La description est obligatoire")
    @Schema(description = "Description des travaux", required = true)
    private String description;

    @DecimalMin(value = "0.0", message = "La surface doit être positive")
    @Schema(description = "Surface en m²", example = "150")
    private BigDecimal surface;

    @DecimalMin(value = "0.0", message = "Le budget doit être positif")
    @Schema(description = "Budget estimé en MGA", example = "45000000")
    private BigDecimal budgetEstime;
}
