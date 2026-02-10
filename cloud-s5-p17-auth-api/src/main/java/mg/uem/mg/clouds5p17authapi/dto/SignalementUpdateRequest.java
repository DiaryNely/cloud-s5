package mg.uem.mg.clouds5p17authapi.dto;

import java.time.Instant;

public record SignalementUpdateRequest(
        String title,
        String description,
        String status,
        Double surfaceM2,
        Double budgetAr,
        String entreprise,
        Instant dateNouveau,
        Instant dateEnCours,
        Instant dateTermine,
        String photoUrl
) {
}
