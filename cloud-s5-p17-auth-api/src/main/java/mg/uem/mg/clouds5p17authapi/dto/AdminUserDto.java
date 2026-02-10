package mg.uem.mg.clouds5p17authapi.dto;

import java.time.Instant;

public record AdminUserDto(
        String uid,
        String email,
        String role,
        String nom,
        String prenom,
        String numEtu,
        boolean blocked,
        Instant blockedUntil,
        boolean syncedToFirebase,
        String firebaseUid
) {
}
