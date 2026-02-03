package mg.sig.service;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import mg.sig.dto.*;
import mg.sig.dto.request.CreateSignalementRequest;
import mg.sig.dto.request.UpdateSignalementRequest;
import mg.sig.entity.*;
import mg.sig.mapper.HistoriqueMapper;
import mg.sig.mapper.SignalementMapper;
import mg.sig.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service de gestion des signalements.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SignalementService {

    private final SignalementRepository signalementRepository;
    private final SignalementStatusRepository statusRepository;
    private final SignalementHistoriqueRepository historiqueRepository;
    private final SignalementPhotoRepository photoRepository;
    private final EntrepriseRepository entrepriseRepository;
    private final UserRepository userRepository;
    private final SignalementMapper signalementMapper;
    private final HistoriqueMapper historiqueMapper;
    private final AuditService auditService;

    /**
     * Récupère tous les signalements
     */
    public List<SignalementDTO> getAllSignalements() {
        return signalementRepository.findAllOrderByDateCreationDesc().stream()
                .map(signalementMapper::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Récupère un signalement par ID
     */
    public SignalementDTO getSignalementById(Integer id) {
        return signalementRepository.findById(id)
                .map(signalementMapper::toDTO)
                .orElseThrow(() -> new RuntimeException("Signalement non trouvé"));
    }

    /**
     * Récupère les signalements d'un utilisateur
     */
    public List<SignalementDTO> getSignalementsByUser(String email) {
        return signalementRepository.findByCreeParEmail(email).stream()
                .map(signalementMapper::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Récupère les signalements par statut
     */
    public List<SignalementDTO> getSignalementsByStatus(String statusCode) {
        return signalementRepository.findByStatusCode(statusCode.toUpperCase()).stream()
                .map(signalementMapper::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Crée un nouveau signalement
     */
    @Transactional
    public SignalementDTO createSignalement(CreateSignalementRequest request, String userEmail, HttpServletRequest httpRequest) {
        User createur = userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        SignalementStatus nouveauStatus = statusRepository.findByCode(SignalementStatus.NOUVEAU)
                .orElseThrow(() -> new RuntimeException("Statut NOUVEAU non trouvé"));

        Signalement signalement = Signalement.builder()
                .localisation(request.getLocalisation())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .description(request.getDescription())
                .surface(request.getSurface())
                .budgetEstime(request.getBudgetEstime())
                .status(nouveauStatus)
                .creePar(createur)
                .build();

        signalement = signalementRepository.save(signalement);

        // Sauvegarder les photos si présentes
        if (request.getPhotos() != null && !request.getPhotos().isEmpty()) {
            for (String photoData : request.getPhotos()) {
                SignalementPhoto photo = SignalementPhoto.builder()
                        .signalement(signalement)
                        .photoBase64(photoData)
                        .photoUrl(photoData.startsWith("data:") ? "base64" : photoData)
                        .build();
                photoRepository.save(photo);
            }
        }

        // Créer l'entrée historique
        SignalementHistorique historique = SignalementHistorique.builder()
                .signalement(signalement)
                .nouveauStatus(nouveauStatus)
                .modifiePar(createur)
                .commentaire("Signalement créé")
                .build();
        historiqueRepository.save(historique);

        // Log d'audit
        auditService.logAction(
            AuditLog.ACTION_CREATION_SIGNALEMENT, "SIGNALEMENT", signalement.getId(),
            userEmail, "Création du signalement à " + signalement.getLocalisation(), httpRequest
        );

        log.info("Signalement créé: {} par {}", signalement.getId(), userEmail);

        return signalementMapper.toDTO(signalement);
    }

    /**
     * Met à jour un signalement
     */
    @Transactional
    public SignalementDTO updateSignalement(Integer id, UpdateSignalementRequest request, 
                                             String userEmail, HttpServletRequest httpRequest) {
        Signalement signalement = signalementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Signalement non trouvé"));

        User modificateur = userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        SignalementStatus ancienStatus = signalement.getStatus();
        boolean statusChanged = false;

        // Mise à jour du statut
        if (request.getStatut() != null) {
            SignalementStatus nouveauStatus = statusRepository.findByCodeIgnoreCase(request.getStatut())
                    .orElseThrow(() -> new RuntimeException("Statut non trouvé: " + request.getStatut()));
            
            if (!nouveauStatus.getId().equals(ancienStatus.getId())) {
                signalement.setStatus(nouveauStatus);
                statusChanged = true;
                
                // Gestion automatique des dates d'avancement
                String nouveauCode = nouveauStatus.getCode().toUpperCase();
                if (SignalementStatus.EN_COURS.equals(nouveauCode) && signalement.getDateDebutTravaux() == null) {
                    signalement.setDateDebutTravaux(java.time.LocalDateTime.now());
                }
                if (SignalementStatus.TERMINE.equals(nouveauCode)) {
                    signalement.setDateFinTravaux(java.time.LocalDateTime.now());
                    // S'assurer que la date de début est définie
                    if (signalement.getDateDebutTravaux() == null) {
                        signalement.setDateDebutTravaux(java.time.LocalDateTime.now());
                    }
                }
                
                // Créer l'entrée historique
                SignalementHistorique historique = SignalementHistorique.builder()
                        .signalement(signalement)
                        .ancienStatus(ancienStatus)
                        .nouveauStatus(nouveauStatus)
                        .modifiePar(modificateur)
                        .commentaire(request.getCommentaire() != null ? request.getCommentaire() : 
                                    "Changement de statut: " + ancienStatus.getLibelle() + " → " + nouveauStatus.getLibelle())
                        .build();
                historiqueRepository.save(historique);
            }
        }

        // Mise à jour des autres champs
        if (request.getSurface() != null) {
            signalement.setSurface(request.getSurface());
        }
        if (request.getBudgetEstime() != null) {
            signalement.setBudgetEstime(request.getBudgetEstime());
        }

        // Mise à jour de l'entreprise
        if (request.getEntrepriseId() != null) {
            Entreprise entreprise = entrepriseRepository.findById(request.getEntrepriseId())
                    .orElseThrow(() -> new RuntimeException("Entreprise non trouvée"));
            signalement.setEntreprise(entreprise);
        } else if (request.getEntreprise() != null) {
            entrepriseRepository.findByNomIgnoreCase(request.getEntreprise())
                    .ifPresent(signalement::setEntreprise);
        }

        signalement = signalementRepository.save(signalement);

        // Log d'audit
        String action = statusChanged ? AuditLog.ACTION_MODIFICATION_STATUT : AuditLog.ACTION_MODIFICATION_SIGNALEMENT;
        String details = statusChanged ? 
                "Modification du statut du signalement #" + id + " : " + ancienStatus.getCode().toLowerCase() + " → " + signalement.getStatus().getCode().toLowerCase() :
                "Mise à jour du signalement #" + id;
        
        auditService.logAction(action, "SIGNALEMENT", id, userEmail, details, httpRequest);

        return signalementMapper.toDTO(signalement);
    }

    /**
     * Récupère l'historique d'un signalement
     */
    public List<HistoriqueStatutDTO> getHistorique(Integer signalementId) {
        return historiqueRepository.findBySignalementIdOrderByDateModificationAsc(signalementId).stream()
                .map(historiqueMapper::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Calcule les statistiques des signalements
     */
    public StatistiquesDTO getStatistiques() {
        Long total = signalementRepository.countTotal();
        Long nouveaux = signalementRepository.countByStatusCode(SignalementStatus.NOUVEAU);
        Long enCours = signalementRepository.countByStatusCode(SignalementStatus.EN_COURS);
        Long termines = signalementRepository.countByStatusCode(SignalementStatus.TERMINE);
        Long planifie = signalementRepository.countByStatusCode(SignalementStatus.PLANIFIE);
        BigDecimal surfaceTotale = signalementRepository.sumSurface();
        BigDecimal budgetTotal = signalementRepository.sumBudget();

        BigDecimal pourcentage = BigDecimal.ZERO;
        if (total > 0) {
            pourcentage = BigDecimal.valueOf(termines)
                    .divide(BigDecimal.valueOf(total), 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(1, RoundingMode.HALF_UP);
        }

        return StatistiquesDTO.builder()
                .totalSignalements(total)
                .total(total)
                .surfaceTotale(surfaceTotale)
                .budgetTotal(budgetTotal)
                .termines(termines)
                .termine(termines)
                .enCours(enCours)
                .nouveaux(nouveaux)
                .planifie(planifie)
                .pourcentageAvancement(pourcentage)
                .build();
    }
}
