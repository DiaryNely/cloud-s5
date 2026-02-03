package mg.sig.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * Entité représentant les paramètres système configurables.
 */
@Entity
@Table(name = "parametres")
@EntityListeners(AuditingEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Parametre {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "cle", nullable = false, unique = true, length = 100)
    private String cle;

    @Column(name = "valeur", nullable = false, columnDefinition = "TEXT")
    private String valeur;

    @Column(name = "type", length = 50)
    @Builder.Default
    private String type = "STRING";

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "modifiable")
    @Builder.Default
    private Boolean modifiable = true;

    @CreatedDate
    @Column(name = "date_creation", updatable = false)
    private LocalDateTime dateCreation;

    @LastModifiedDate
    @Column(name = "date_modification")
    private LocalDateTime dateModification;

    // Clés de paramètres
    public static final String MAX_TENTATIVES_CONNEXION = "MAX_TENTATIVES_CONNEXION";
    public static final String DUREE_SESSION_HEURES = "DUREE_SESSION_HEURES";
    public static final String DUREE_BLOCAGE_MINUTES = "DUREE_BLOCAGE_MINUTES";
    public static final String SYNC_FIREBASE_INTERVAL_MINUTES = "SYNC_FIREBASE_INTERVAL_MINUTES";
    public static final String MAP_CENTER_LATITUDE = "MAP_CENTER_LATITUDE";
    public static final String MAP_CENTER_LONGITUDE = "MAP_CENTER_LONGITUDE";
    public static final String MAP_DEFAULT_ZOOM = "MAP_DEFAULT_ZOOM";

    /**
     * Récupère la valeur en tant qu'entier
     */
    public Integer getValeurAsInteger() {
        return Integer.parseInt(valeur);
    }

    /**
     * Récupère la valeur en tant que décimal
     */
    public Double getValeurAsDouble() {
        return Double.parseDouble(valeur);
    }

    /**
     * Récupère la valeur en tant que booléen
     */
    public Boolean getValeurAsBoolean() {
        return Boolean.parseBoolean(valeur);
    }
}
