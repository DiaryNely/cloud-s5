package mg.sig.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.time.LocalDateTime;

/**
 * DTO Journal d'audit aligné sur journalAudit du frontend.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Entrée du journal d'audit")
public class AuditLogDTO {

    @Schema(description = "Identifiant unique", example = "1")
    private Integer id;

    @Schema(description = "Date de l'action", example = "2026-01-20T08:30:00")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime date;

    @Schema(description = "Code de l'action", example = "CONNEXION")
    private String action;

    @Schema(description = "Email de l'utilisateur", example = "admin@manager.mg")
    private String utilisateur;

    @Schema(description = "Détails de l'action")
    private String details;

    @Schema(description = "Adresse IP", example = "192.168.1.100")
    private String ipAddress;
}
