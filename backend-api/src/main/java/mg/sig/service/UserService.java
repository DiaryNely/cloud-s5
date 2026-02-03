package mg.sig.service;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import mg.sig.dto.UtilisateurDTO;
import mg.sig.dto.request.CreateUserRequest;
import mg.sig.dto.response.CreateUserResponse;
import mg.sig.entity.*;
import mg.sig.mapper.UserMapper;
import mg.sig.repository.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service de gestion des utilisateurs.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserStatusRepository userStatusRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    /**
     * Récupère tous les utilisateurs
     */
    public List<UtilisateurDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(userMapper::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Récupère un utilisateur par ID
     */
    public UtilisateurDTO getUserById(Integer id) {
        return userRepository.findById(id)
                .map(userMapper::toDTO)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
    }

    /**
     * Récupère un utilisateur par email
     */
    public UtilisateurDTO getUserByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .map(userMapper::toDTO)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
    }

    /**
     * Crée un nouvel utilisateur
     */
    @Transactional
    public CreateUserResponse createUser(CreateUserRequest request, String adminEmail, HttpServletRequest httpRequest) {
        // Vérifier si l'email existe déjà
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Un utilisateur avec cet email existe déjà");
        }

        // Récupérer le rôle
        String roleCode = request.getRole() != null ? request.getRole().toUpperCase() : Role.USER;
        Role role = roleRepository.findByCode(roleCode)
                .orElseThrow(() -> new RuntimeException("Rôle non trouvé: " + roleCode));

        // Récupérer le statut actif
        UserStatus activeStatus = userStatusRepository.findByCode(UserStatus.ACTIF)
                .orElseThrow(() -> new RuntimeException("Statut ACTIF non trouvé"));

        // Utiliser le mot de passe fourni par le manager
        String password = request.getPassword();

        // Créer l'utilisateur
        User user = User.builder()
                .email(request.getEmail().toLowerCase().trim())
                .nom(request.getNom())
                .prenom(request.getPrenom())
                .telephone(request.getTelephone())
                .passwordHash(passwordEncoder.encode(password))
                .temporaryPassword(password)
                .role(role)
                .status(activeStatus)
                .actif(true)
                .bloque(false)
                .build();

        user = userRepository.save(user);

        // Log d'audit
        auditService.logAction(
            AuditLog.ACTION_CREATION_UTILISATEUR, "USER", user.getId(),
            adminEmail, "Création du compte utilisateur " + user.getEmail(), httpRequest
        );

        log.info("Utilisateur créé: {} avec mot de passe défini par le manager", user.getEmail());

        return CreateUserResponse.builder()
                .user(userMapper.toDTO(user))
                .temporaryPassword(password)
                .message("Utilisateur créé avec succès. Le mot de passe est visible dans le tableau.")
                .build();
    }

    /**
     * Récupère les statistiques des utilisateurs
     */
    public UserStats getUserStats() {
        return UserStats.builder()
                .total(userRepository.count())
                .actifs(userRepository.countActifs())
                .bloques(userRepository.countBloques())
                .build();
    }

    /**
     * Génère un mot de passe temporaire
     */
    private String generateTemporaryPassword() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$";
        SecureRandom random = new SecureRandom();
        StringBuilder sb = new StringBuilder(12);
        for (int i = 0; i < 12; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }

    /**
     * Réinitialise le mot de passe d'un utilisateur (MANAGER uniquement)
     */
    @Transactional
    public mg.sig.dto.response.ResetPasswordResponse resetUserPassword(Integer userId, String adminEmail, HttpServletRequest httpRequest) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        // Générer un nouveau mot de passe temporaire
        String newPassword = generateTemporaryPassword();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setTemporaryPassword(newPassword); // Stocker le nouveau mot de passe temporaire en clair
        
        // Débloquer le compte si bloqué
        if (user.getBloque()) {
            user.setBloque(false);
            user.setDateBlocage(null);
            user.setRaisonBlocage(null);
        }
        
        userRepository.save(user);

        // Log d'audit
        auditService.logAction(
            "RESET_PASSWORD", "USER", user.getId(),
            adminEmail, "Réinitialisation du mot de passe pour " + user.getEmail(), httpRequest
        );

        log.info("Mot de passe réinitialisé pour: {} par {}", user.getEmail(), adminEmail);

        return mg.sig.dto.response.ResetPasswordResponse.builder()
                .email(user.getEmail())
                .fullName(user.getPrenom() + " " + user.getNom())
                .temporaryPassword(newPassword)
                .message("Nouveau mot de passe généré avec succès")
                .build();
    }

    @lombok.Data
    @lombok.Builder
    public static class UserStats {
        private Long total;
        private Long actifs;
        private Long bloques;
    }
}
