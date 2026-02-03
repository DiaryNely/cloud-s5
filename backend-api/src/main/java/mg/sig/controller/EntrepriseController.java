package mg.sig.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import mg.sig.dto.EntrepriseDTO;
import mg.sig.mapper.EntrepriseMapper;
import mg.sig.repository.EntrepriseRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Controller des entreprises.
 */
@RestController
@RequestMapping("/entreprises")
@RequiredArgsConstructor
@Tag(name = "Entreprises", description = "Gestion des entreprises de travaux")
public class EntrepriseController {

    private final EntrepriseRepository entrepriseRepository;
    private final EntrepriseMapper entrepriseMapper;

    @GetMapping
    @Operation(summary = "Liste des entreprises", description = "Récupère toutes les entreprises actives")
    public ResponseEntity<List<EntrepriseDTO>> getAllEntreprises() {
        List<EntrepriseDTO> entreprises = entrepriseRepository.findByActifTrue().stream()
                .map(entrepriseMapper::toDTO)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(entreprises);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Détail d'une entreprise", description = "Récupère une entreprise par son ID")
    public ResponseEntity<EntrepriseDTO> getEntrepriseById(@PathVariable Integer id) {
        return entrepriseRepository.findById(id)
                .map(entrepriseMapper::toDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
