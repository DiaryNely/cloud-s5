package mg.sig.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO Signalement aligné sur la structure frontend.
 * Compatible avec: manager-app/src/data/signalements.js
 *                  mobile-signalement/src/data/signalements.js
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Signalement de travaux routiers")
public class SignalementDTO {

    @Schema(description = "Identifiant unique", example = "1")
    private Integer id;

    @Schema(description = "Latitude GPS", example = "-18.8792")
    private BigDecimal latitude;

    @Schema(description = "Longitude GPS", example = "47.5079")
    private BigDecimal longitude;

    @Schema(description = "Date de création au format ISO", example = "2026-01-15T10:30:00")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime dateCreation;

    @Schema(description = "Date de début des travaux", example = "2026-01-16T08:00:00")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime dateDebutTravaux;

    @Schema(description = "Date de fin des travaux", example = "2026-01-20T17:00:00")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime dateFinTravaux;

    @Schema(description = "Pourcentage d'avancement (0, 50, 100)", example = "50")
    private Integer avancement;

    @Schema(description = "Code du statut", example = "nouveau", allowableValues = {"nouveau", "en_cours", "planifie", "en_attente", "termine"})
    private String statut;

    @Schema(description = "Surface en m²", example = "150")
    private BigDecimal surface;

    @Schema(description = "Budget estimé en MGA", example = "45000000")
    private BigDecimal budgetEstime;

    @Schema(description = "Nom de l'entreprise", example = "COLAS Madagascar")
    private String entreprise;

    @Schema(description = "Description des travaux")
    private String description;

    @Schema(description = "Nom du créateur", example = "Jean Rakoto")
    private String creePar;

    @Schema(description = "Adresse/localisation", example = "Avenue de l'Indépendance")
    private String localisation;

    @Schema(description = "Liste des URLs des photos")
    private java.util.List<String> photos;
}
