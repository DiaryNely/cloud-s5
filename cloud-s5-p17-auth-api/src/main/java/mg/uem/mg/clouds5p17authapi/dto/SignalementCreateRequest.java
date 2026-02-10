package mg.uem.mg.clouds5p17authapi.dto;

public record SignalementCreateRequest(
        String title,
        String description,
        Double latitude,
        Double longitude,
        Double surfaceM2,
        Double budgetAr,
        String entreprise,
        Integer niveau
) {
}
