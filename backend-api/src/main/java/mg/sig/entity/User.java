package mg.sig.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entité représentant un utilisateur du système.
 */
@Entity
@Table(name = "users")
@EntityListeners(AuditingEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "email", nullable = false, unique = true, length = 150)
    private String email;

    @Column(name = "password_hash", length = 255)
    private String passwordHash;

    @Column(name = "temporary_password", length = 50)
    private String temporaryPassword;

    @Column(name = "nom", nullable = false, length = 100)
    private String nom;

    @Column(name = "prenom", nullable = false, length = 100)
    private String prenom;

    @Column(name = "telephone", length = 50)
    private String telephone;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "status_id", nullable = false)
    private UserStatus status;

    @Column(name = "firebase_uid", unique = true, length = 128)
    private String firebaseUid;

    @Column(name = "actif")
    @Builder.Default
    private Boolean actif = true;

    @Column(name = "bloque")
    @Builder.Default
    private Boolean bloque = false;

    @Column(name = "date_blocage")
    private LocalDateTime dateBlocage;

    @Column(name = "raison_blocage", columnDefinition = "TEXT")
    private String raisonBlocage;

    @Column(name = "derniere_connexion")
    private LocalDateTime derniereConnexion;

    @CreatedDate
    @Column(name = "date_creation", updatable = false)
    private LocalDateTime dateCreation;

    @LastModifiedDate
    @Column(name = "date_modification")
    private LocalDateTime dateModification;

    @OneToMany(mappedBy = "creePar", fetch = FetchType.LAZY)
    @Builder.Default
    private List<Signalement> signalements = new ArrayList<>();

    /**
     * Retourne le nom complet de l'utilisateur
     */
    public String getNomComplet() {
        return prenom + " " + nom;
    }

    /**
     * Vérifie si l'utilisateur a le rôle manager
     */
    public boolean isManager() {
        return role != null && Role.MANAGER.equals(role.getCode());
    }

    /**
     * Vérifie si l'utilisateur peut se connecter
     */
    public boolean canLogin() {
        return actif && !bloque;
    }
}
