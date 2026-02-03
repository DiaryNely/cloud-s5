-- Ajout de la table pour les photos des signalements
CREATE TABLE IF NOT EXISTS signalement_photos (
    id SERIAL PRIMARY KEY,
    signalement_id INTEGER NOT NULL,
    photo_url TEXT NOT NULL,
    photo_base64 TEXT,
    description VARCHAR(255),
    date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_signalement_photo FOREIGN KEY (signalement_id) REFERENCES signalements(id) ON DELETE CASCADE
);

-- Index pour améliorer les performances
CREATE INDEX idx_signalement_photos_signalement_id ON signalement_photos(signalement_id);

-- Commentaires
COMMENT ON TABLE signalement_photos IS 'Photos attachées aux signalements';
COMMENT ON COLUMN signalement_photos.photo_url IS 'URL ou chemin de la photo';
COMMENT ON COLUMN signalement_photos.photo_base64 IS 'Photo encodée en base64 (pour mobile offline)';
