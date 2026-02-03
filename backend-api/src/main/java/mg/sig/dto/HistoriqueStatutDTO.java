package mg.sig.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.time.LocalDateTime;

/**
 * DTO Historique aligné sur la structure frontend historiqueStatuts.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Entrée historique de changement de statut")
public class HistoriqueStatutDTO {

    @Schema(description = "Date du changement", example = "2026-01-15T10:30:00")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime date;

    @Schema(description = "Code du statut", example = "nouveau")
    private String statut;

    @Schema(description = "Personne ayant effectué la modification", example = "Manager Admin")
    private String modifiePar;

    @Schema(description = "Commentaire associé", example = "Signalement créé")
    private String commentaire;
}
