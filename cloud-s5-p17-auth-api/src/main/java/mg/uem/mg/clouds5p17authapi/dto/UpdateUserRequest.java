package mg.uem.mg.clouds5p17authapi.dto;

public record UpdateUserRequest(
    String nom,
    String prenom,
    String numEtu,
    String role
) {}
