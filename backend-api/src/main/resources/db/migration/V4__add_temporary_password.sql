-- Migration V4: Ajouter la colonne temporary_password pour stocker les mots de passe temporaires en clair
-- Cette colonne sera affichée aux managers et effacée lors de la première connexion

ALTER TABLE users ADD COLUMN IF NOT EXISTS temporary_password VARCHAR(50);

COMMENT ON COLUMN users.temporary_password IS 'Mot de passe temporaire en clair, visible par les managers. Effacé à la première connexion.';
