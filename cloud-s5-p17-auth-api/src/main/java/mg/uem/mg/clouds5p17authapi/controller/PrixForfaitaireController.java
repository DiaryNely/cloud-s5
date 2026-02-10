package mg.uem.mg.clouds5p17authapi.controller;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import mg.uem.mg.clouds5p17authapi.entity.PrixForfaitaire;
import mg.uem.mg.clouds5p17authapi.repository.PrixForfaitaireRepository;

@RestController
@RequestMapping("/api/prix-forfaitaire")
@Tag(name = "Prix Forfaitaire", description = "Gestion des prix au m² pour les réparations routières")
public class PrixForfaitaireController {

    private final PrixForfaitaireRepository repository;

    public PrixForfaitaireController(PrixForfaitaireRepository repository) {
        this.repository = repository;
    }

    @Operation(summary = "Liste des prix forfaitaires")
    @GetMapping
    public ResponseEntity<List<PrixForfaitaire>> list() {
        return ResponseEntity.ok(repository.findAll());
    }

    @Operation(summary = "Obtenir un prix forfaitaire par ID")
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        Optional<PrixForfaitaire> prix = repository.findById(id);
        if (prix.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Prix forfaitaire non trouvé"));
        }
        return ResponseEntity.ok(prix.get());
    }

    @Operation(summary = "Créer un prix forfaitaire (MANAGER)")
    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<?> create(@RequestBody PrixForfaitaireRequest request) {
        if (request.label() == null || request.label().isBlank() || request.prixM2() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "label et prixM2 sont requis"));
        }

        PrixForfaitaire entity = new PrixForfaitaire();
        entity.setLabel(request.label());
        entity.setDescription(request.description());
        entity.setPrixM2(request.prixM2());

        return ResponseEntity.ok(repository.save(entity));
    }

    @Operation(summary = "Modifier un prix forfaitaire (MANAGER)")
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody PrixForfaitaireRequest request) {
        Optional<PrixForfaitaire> opt = repository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Prix forfaitaire non trouvé"));
        }

        PrixForfaitaire entity = opt.get();
        if (request.label() != null) entity.setLabel(request.label());
        if (request.description() != null) entity.setDescription(request.description());
        if (request.prixM2() != null) entity.setPrixM2(request.prixM2());

        return ResponseEntity.ok(repository.save(entity));
    }

    @Operation(summary = "Supprimer un prix forfaitaire (MANAGER)")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Prix forfaitaire non trouvé"));
        }
        repository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Prix forfaitaire supprimé"));
    }

    public record PrixForfaitaireRequest(String label, String description, Double prixM2) {}
}
