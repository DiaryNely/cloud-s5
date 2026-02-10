package mg.uem.mg.clouds5p17authapi.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "signalements")
public class Signalement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(length = 50)
    private String status = "NOUVEAU";

    @Column(name = "surface_m2")
    private Double surfaceM2;

    @Column(name = "budget_ar")
    private Double budgetAr;

    @Column(length = 150)
    private String entreprise;

    @Column(name = "user_uid", length = 128)
    private String userUid;

    @Column(name = "user_email", length = 255)
    private String userEmail;

    @Column(name = "synced_to_firebase")
    private Boolean syncedToFirebase = false;

    @Column(name = "firebase_id", length = 128)
    private String firebaseId;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "date_nouveau")
    private Instant dateNouveau;

    @Column(name = "date_en_cours")
    private Instant dateEnCours;

    @Column(name = "date_termine")
    private Instant dateTermine;

    @Column(name = "photo_url", length = 500)
    private String photoUrl;

    @Column(name = "niveau")
    private Integer niveau = 1;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Double getSurfaceM2() {
        return surfaceM2;
    }

    public void setSurfaceM2(Double surfaceM2) {
        this.surfaceM2 = surfaceM2;
    }

    public Double getBudgetAr() {
        return budgetAr;
    }

    public void setBudgetAr(Double budgetAr) {
        this.budgetAr = budgetAr;
    }

    public String getEntreprise() {
        return entreprise;
    }

    public void setEntreprise(String entreprise) {
        this.entreprise = entreprise;
    }

    public String getUserUid() {
        return userUid;
    }

    public void setUserUid(String userUid) {
        this.userUid = userUid;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Boolean getSyncedToFirebase() {
        return syncedToFirebase;
    }

    public void setSyncedToFirebase(Boolean syncedToFirebase) {
        this.syncedToFirebase = syncedToFirebase;
    }

    public String getFirebaseId() {
        return firebaseId;
    }

    public void setFirebaseId(String firebaseId) {
        this.firebaseId = firebaseId;
    }

    public Instant getDateNouveau() {
        return dateNouveau;
    }

    public void setDateNouveau(Instant dateNouveau) {
        this.dateNouveau = dateNouveau;
    }

    public Instant getDateEnCours() {
        return dateEnCours;
    }

    public void setDateEnCours(Instant dateEnCours) {
        this.dateEnCours = dateEnCours;
    }

    public Instant getDateTermine() {
        return dateTermine;
    }

    public void setDateTermine(Instant dateTermine) {
        this.dateTermine = dateTermine;
    }

    public String getPhotoUrl() {
        return photoUrl;
    }

    public void setPhotoUrl(String photoUrl) {
        this.photoUrl = photoUrl;
    }

    public Integer getNiveau() {
        return niveau;
    }

    public void setNiveau(Integer niveau) {
        this.niveau = niveau;
    }
}
