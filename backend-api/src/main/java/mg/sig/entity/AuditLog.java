package mg.sig.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Entité représentant les logs d'audit du système.
 */
@Entity
@Table(name = "audit_logs")
@EntityListeners(AuditingEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "action", nullable = false, length = 100)
    private String action;

    @Column(name = "entite", length = 100)
    private String entite;

    @Column(name = "entite_id")
    private Integer entiteId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "user_email", length = 150)
    private String userEmail;

    @Column(name = "details", columnDefinition = "TEXT")
    private String details;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "donnees_avant", columnDefinition = "jsonb")
    private Map<String, Object> donneesAvant;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "donnees_apres", columnDefinition = "jsonb")
    private Map<String, Object> donneesApres;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    @CreatedDate
    @Column(name = "date_action", updatable = false)
    private LocalDateTime dateAction;

    // Actions d'audit prédéfinies
    public static final String ACTION_CONNEXION = "CONNEXION";
    public static final String ACTION_DECONNEXION = "DECONNEXION";
    public static final String ACTION_TENTATIVE_CONNEXION_ECHOUEE = "TENTATIVE_CONNEXION_ECHOUEE";
    public static final String ACTION_CREATION_UTILISATEUR = "CREATION_UTILISATEUR";
    public static final String ACTION_MODIFICATION_UTILISATEUR = "MODIFICATION_UTILISATEUR";
    public static final String ACTION_BLOCAGE_COMPTE = "BLOCAGE_COMPTE";
    public static final String ACTION_DEBLOCAGE_COMPTE = "DEBLOCAGE_COMPTE";
    public static final String ACTION_CREATION_SIGNALEMENT = "CREATION_SIGNALEMENT";
    public static final String ACTION_MODIFICATION_SIGNALEMENT = "MODIFICATION_SIGNALEMENT";
    public static final String ACTION_MODIFICATION_STATUT = "MODIFICATION_STATUT";
    public static final String ACTION_SYNCHRONISATION = "SYNCHRONISATION";
}
