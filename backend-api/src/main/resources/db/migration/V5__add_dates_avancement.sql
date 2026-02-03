-- ============================================================
-- V5: Ajout des dates d'avancement pour le suivi des travaux
-- ============================================================

-- Ajout des colonnes de dates d'avancement
ALTER TABLE signalements 
ADD COLUMN IF NOT EXISTS date_debut_travaux TIMESTAMP,
ADD COLUMN IF NOT EXISTS date_fin_travaux TIMESTAMP;

-- Index pour les requêtes de statistiques
CREATE INDEX IF NOT EXISTS idx_signalements_date_debut ON signalements(date_debut_travaux);
CREATE INDEX IF NOT EXISTS idx_signalements_date_fin ON signalements(date_fin_travaux);

-- Commentaires
COMMENT ON COLUMN signalements.date_debut_travaux IS 'Date de début des travaux (passage en statut EN_COURS)';
COMMENT ON COLUMN signalements.date_fin_travaux IS 'Date de fin des travaux (passage en statut TERMINE)';

-- Mise à jour des signalements existants avec des dates cohérentes basées sur l'historique
UPDATE signalements s
SET date_debut_travaux = (
    SELECT MIN(sh.date_modification)
    FROM signalement_historique sh
    JOIN signalement_status ss ON sh.nouveau_status_id = ss.id
    WHERE sh.signalement_id = s.id AND ss.code = 'EN_COURS'
)
WHERE date_debut_travaux IS NULL;

UPDATE signalements s
SET date_fin_travaux = (
    SELECT MIN(sh.date_modification)
    FROM signalement_historique sh
    JOIN signalement_status ss ON sh.nouveau_status_id = ss.id
    WHERE sh.signalement_id = s.id AND ss.code = 'TERMINE'
)
WHERE date_fin_travaux IS NULL;
