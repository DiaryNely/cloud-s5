package mg.uem.mg.clouds5p17authapi.controller;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import mg.uem.mg.clouds5p17authapi.dto.SignalementCreateRequest;
import mg.uem.mg.clouds5p17authapi.dto.SignalementResponse;
import mg.uem.mg.clouds5p17authapi.dto.SignalementUpdateRequest;
import mg.uem.mg.clouds5p17authapi.entity.Signalement;
import mg.uem.mg.clouds5p17authapi.service.SignalementService;

@RestController
@RequestMapping("/api/signalements")
@Tag(name = "Signalements", description = "API de signalement des problèmes routiers")
public class SignalementController {

    private final SignalementService service;

    public SignalementController(SignalementService service) {
        this.service = service;
    }

    @Operation(summary = "Liste des signalements", description = "Retourne tous les signalements (public). Option mine=true pour l'utilisateur connecté.")
    @GetMapping
    public ResponseEntity<?> list(
            @Parameter(description = "Afficher uniquement mes signalements")
            @RequestParam(name = "mine", required = false) Boolean mine) {

        if (Boolean.TRUE.equals(mine)) {
            Optional<AuthInfo> auth = getAuthInfo();
            if (auth.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
            }
            List<SignalementResponse> own = service.listByUserUid(auth.get().uid()).stream()
                    .map(this::toResponse)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(own);
        }

        List<SignalementResponse> all = service.listAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(all);
    }

    @Operation(summary = "Résumé global", description = "Retourne un résumé des signalements (public).")
    @GetMapping("/summary")
    public ResponseEntity<?> summary() {
        List<Signalement> all = service.listAll();
        long total = all.size();
        long done = all.stream().filter(s -> "TERMINE".equalsIgnoreCase(s.getStatus())).count();
        double totalSurface = all.stream().map(Signalement::getSurfaceM2).filter(v -> v != null).mapToDouble(Double::doubleValue).sum();
        double totalBudget = all.stream().map(Signalement::getBudgetAr).filter(v -> v != null).mapToDouble(Double::doubleValue).sum();
        double completion = total == 0 ? 0 : (done * 100.0) / total;

        return ResponseEntity.ok(Map.of(
                "totalSignalements", total,
                "surfaceTotale", totalSurface,
                "budgetTotal", totalBudget,
                "avancement", completion
        ));
    }

    @Operation(summary = "Créer un signalement", description = "Création de signalement (UTILISATEUR ou MANAGER).")
    @PostMapping
    @PreAuthorize("hasAnyRole('UTILISATEUR','MANAGER')")
    public ResponseEntity<?> create(@RequestBody SignalementCreateRequest request) {
        Optional<AuthInfo> auth = getAuthInfo();
        if (auth.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }

        if (request.title() == null || request.title().isBlank() || request.latitude() == null || request.longitude() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "title, latitude and longitude are required"));
        }

        Signalement created = service.create(request, auth.get().uid(), auth.get().email());
        return ResponseEntity.ok(toResponse(created));
    }

    @Operation(summary = "Modifier un signalement", description = "Mise à jour des champs (MANAGER ou créateur).")
    @PatchMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody SignalementUpdateRequest request) {
        Optional<Signalement> updated = service.update(id, request);
        if (updated.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Signalement not found"));
        }
        return ResponseEntity.ok(toResponse(updated.get()));
    }

    @Operation(summary = "Uploader une photo", description = "Ajouter une photo à un signalement.")
    @PostMapping("/{id}/photo")
    public ResponseEntity<?> uploadPhoto(@PathVariable Long id, @RequestParam("photo") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No file provided"));
        }

        try {
            // Créer le répertoire uploads si nécessaire
            String uploadDir = "uploads/signalements/";
            File directory = new File(uploadDir);
            if (!directory.exists()) {
                directory.mkdirs();
            }

            // Générer un nom de fichier unique
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".")
                    ? originalFilename.substring(originalFilename.lastIndexOf("."))
                    : ".jpg";
            String filename = "sig_" + id + "_" + UUID.randomUUID().toString() + extension;
            Path filePath = Paths.get(uploadDir + filename);

            // Sauvegarder le fichier
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Mettre à jour le signalement avec l'URL de la photo
            String photoUrl = "/uploads/signalements/" + filename;
            SignalementUpdateRequest updateRequest = new SignalementUpdateRequest(
                    null, null, null, null, null, null, null, null, null, photoUrl
            );
            Optional<Signalement> updated = service.update(id, updateRequest);

            if (updated.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Signalement not found"));
            }

            return ResponseEntity.ok(Map.of(
                    "message", "Photo uploaded successfully",
                    "photoUrl", photoUrl,
                    "signalement", toResponse(updated.get())
            ));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to upload file: " + e.getMessage()));
        }
    }

    private SignalementResponse toResponse(Signalement entity) {
        return new SignalementResponse(
                entity.getId(),
                entity.getTitle(),
                entity.getDescription(),
                entity.getLatitude(),
                entity.getLongitude(),
                entity.getStatus(),
                entity.getSurfaceM2(),
                entity.getBudgetAr(),
                entity.getEntreprise(),
                entity.getUserUid(),
                entity.getUserEmail(),
                entity.getCreatedAt(),
                entity.getDateNouveau(),
                entity.getDateEnCours(),
                entity.getDateTermine(),
                entity.getPhotoUrl()
        );
    }

    private Optional<AuthInfo> getAuthInfo() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return Optional.empty();
        }
        Object details = authentication.getDetails();
        if (details instanceof Map<?, ?> map) {
            Object uid = map.get("uid");
            Object email = map.get("email");
            if (uid != null && email != null) {
                return Optional.of(new AuthInfo(uid.toString(), email.toString()));
            }
        }
        return Optional.of(new AuthInfo(null, authentication.getName()));
    }

    private record AuthInfo(String uid, String email) {
    }
}
