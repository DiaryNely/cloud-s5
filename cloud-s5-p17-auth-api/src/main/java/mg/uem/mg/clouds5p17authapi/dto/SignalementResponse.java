package mg.uem.mg.clouds5p17authapi.dto;

import java.time.Instant;

public record SignalementResponse(
        Long id,
        String title,
        String description,
        Double latitude,
        Double longitude,
        String status,
        Double surfaceM2,
        Double budgetAr,
        String entreprise,
        String userUid,
        String userEmail,
        Instant createdAt,
        Instant dateNouveau,
        Instant dateEnCours,
        Instant dateTermine,
        String photoUrl
) {
}
