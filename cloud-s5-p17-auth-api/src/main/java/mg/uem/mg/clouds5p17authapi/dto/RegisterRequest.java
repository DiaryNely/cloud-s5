package mg.uem.mg.clouds5p17authapi.dto;

public record RegisterRequest(
        String email,
        String password,
        String nom,
        String prenom,
        String numEtu,
        String role
) {}