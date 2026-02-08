package mg.sig.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

/**
 * Controller pour l'upload et le serving des photos de signalements.
 */
@RestController
@RequestMapping("/photos")
@Slf4j
@Tag(name = "Photos", description = "Upload et gestion des photos de signalements")
public class PhotoController {

    @Value("${app.upload.dir:uploads/photos}")
    private String uploadDir;

    @Value("${server.port:8080}")
    private String serverPort;

    @PostMapping("/upload")
    @Operation(summary = "Upload de photos", description = "Upload une ou plusieurs photos et retourne leurs URLs")
    public ResponseEntity<Map<String, Object>> uploadPhotos(
            @RequestParam("files") MultipartFile[] files) {

        List<String> photoUrls = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        try {
            // Créer le dossier d'upload s'il n'existe pas
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            for (MultipartFile file : files) {
                if (file.isEmpty()) {
                    errors.add("Fichier vide ignoré");
                    continue;
                }

                // Valider le type de fichier
                String contentType = file.getContentType();
                if (contentType == null || !contentType.startsWith("image/")) {
                    errors.add("Type de fichier non supporté: " + contentType);
                    continue;
                }

                // Générer un nom unique
                String extension = getFileExtension(file.getOriginalFilename());
                String fileName = UUID.randomUUID().toString() + extension;

                // Sauvegarder le fichier
                Path filePath = uploadPath.resolve(fileName);
                Files.copy(file.getInputStream(), filePath);

                // Construire l'URL relative (sera servie par le ResourceHandler sous /api context)
                String photoUrl = "/uploads/photos/" + fileName;
                photoUrls.add(photoUrl);

                log.info("Photo uploadée: {}", fileName);
            }

        } catch (IOException e) {
            log.error("Erreur lors de l'upload des photos", e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", "Erreur lors de l'upload: " + e.getMessage()
            ));
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("urls", photoUrls);
        response.put("count", photoUrls.size());
        if (!errors.isEmpty()) {
            response.put("errors", errors);
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/upload-base64")
    @Operation(summary = "Upload de photos base64", description = "Upload des photos encodées en base64 et les sauvegarde en fichiers")
    public ResponseEntity<Map<String, Object>> uploadBase64Photos(
            @RequestBody Map<String, List<String>> body) {

        List<String> base64Photos = body.get("photos");
        if (base64Photos == null || base64Photos.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Aucune photo fournie"
            ));
        }

        List<String> photoUrls = new ArrayList<>();

        try {
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            for (String base64Data : base64Photos) {
                // Extraire le type et les données
                String extension = ".jpg";
                String pureBase64 = base64Data;

                if (base64Data.contains(",")) {
                    String header = base64Data.substring(0, base64Data.indexOf(","));
                    pureBase64 = base64Data.substring(base64Data.indexOf(",") + 1);

                    if (header.contains("png")) {
                        extension = ".png";
                    } else if (header.contains("gif")) {
                        extension = ".gif";
                    } else if (header.contains("webp")) {
                        extension = ".webp";
                    }
                }

                // Décoder et sauvegarder
                byte[] imageBytes = Base64.getDecoder().decode(pureBase64);
                String fileName = UUID.randomUUID().toString() + extension;
                Path filePath = uploadPath.resolve(fileName);
                Files.write(filePath, imageBytes);

                String photoUrl = "/uploads/photos/" + fileName;
                photoUrls.add(photoUrl);

                log.info("Photo base64 sauvegardée: {}", fileName);
            }

        } catch (Exception e) {
            log.error("Erreur lors de la sauvegarde des photos base64", e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", "Erreur: " + e.getMessage()
            ));
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "urls", photoUrls,
                "count", photoUrls.size()
        ));
    }

    private String getFileExtension(String filename) {
        if (filename == null) return ".jpg";
        int dot = filename.lastIndexOf('.');
        return dot > 0 ? filename.substring(dot) : ".jpg";
    }
}
