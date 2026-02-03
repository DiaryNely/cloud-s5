-- ============================================================
-- SCHEMA PostgreSQL pour le système de signalements routiers
-- Antananarivo, Madagascar
-- ============================================================

-- Nettoyage (pour développement)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS signalement_historique CASCADE;
DROP TABLE IF EXISTS signalements CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS tentatives_connexion CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS entreprises CASCADE;
DROP TABLE IF EXISTS parametres CASCADE;
DROP TABLE IF EXISTS signalement_status CASCADE;
DROP TABLE IF EXISTS user_status CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- ============================================================
-- TABLES DE RÉFÉRENCE (pas d'enum Java)
-- ============================================================

-- Table des rôles
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    libelle VARCHAR(100) NOT NULL,
    description TEXT,
    actif BOOLEAN DEFAULT TRUE,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des statuts utilisateur
CREATE TABLE user_status (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    libelle VARCHAR(100) NOT NULL,
    description TEXT,
    couleur VARCHAR(20),
    actif BOOLEAN DEFAULT TRUE,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des statuts de signalement
CREATE TABLE signalement_status (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    libelle VARCHAR(100) NOT NULL,
    description TEXT,
    couleur VARCHAR(20),
    ordre INTEGER DEFAULT 0,
    actif BOOLEAN DEFAULT TRUE,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des paramètres système
CREATE TABLE parametres (
    id SERIAL PRIMARY KEY,
    cle VARCHAR(100) NOT NULL UNIQUE,
    valeur TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'STRING',
    description TEXT,
    modifiable BOOLEAN DEFAULT TRUE,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLES MÉTIER
-- ============================================================

-- Table des entreprises
CREATE TABLE entreprises (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(200) NOT NULL,
    adresse TEXT,
    telephone VARCHAR(50),
    email VARCHAR(100),
    contact_nom VARCHAR(100),
    actif BOOLEAN DEFAULT TRUE,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des utilisateurs
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    telephone VARCHAR(50),
    role_id INTEGER NOT NULL REFERENCES roles(id),
    status_id INTEGER NOT NULL REFERENCES user_status(id),
    firebase_uid VARCHAR(128),
    actif BOOLEAN DEFAULT TRUE,
    bloque BOOLEAN DEFAULT FALSE,
    date_blocage TIMESTAMP,
    raison_blocage TEXT,
    derniere_connexion TIMESTAMP,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_users_firebase_uid UNIQUE (firebase_uid)
);

-- Index sur users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_users_status ON users(status_id);
CREATE INDEX idx_users_firebase ON users(firebase_uid);

-- Table des tentatives de connexion
CREATE TABLE tentatives_connexion (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    email VARCHAR(150) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    reussi BOOLEAN DEFAULT FALSE,
    motif_echec TEXT,
    date_tentative TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tentatives_user ON tentatives_connexion(user_id);
CREATE INDEX idx_tentatives_email ON tentatives_connexion(email);
CREATE INDEX idx_tentatives_date ON tentatives_connexion(date_tentative);

-- Table des sessions
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    token VARCHAR(500) NOT NULL UNIQUE,
    refresh_token VARCHAR(500),
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_info TEXT,
    actif BOOLEAN DEFAULT TRUE,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_expiration TIMESTAMP NOT NULL,
    date_derniere_activite TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_actif ON sessions(actif);

-- Table des signalements
CREATE TABLE signalements (
    id SERIAL PRIMARY KEY,
    localisation VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    description TEXT NOT NULL,
    surface DECIMAL(10, 2),
    budget_estime DECIMAL(15, 2),
    status_id INTEGER NOT NULL REFERENCES signalement_status(id),
    entreprise_id INTEGER REFERENCES entreprises(id),
    cree_par_id INTEGER NOT NULL REFERENCES users(id),
    firebase_id VARCHAR(128),
    synced_with_firebase BOOLEAN DEFAULT FALSE,
    last_firebase_sync TIMESTAMP,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_signalements_firebase_id UNIQUE (firebase_id)
);

CREATE INDEX idx_signalements_status ON signalements(status_id);
CREATE INDEX idx_signalements_createur ON signalements(cree_par_id);
CREATE INDEX idx_signalements_entreprise ON signalements(entreprise_id);
CREATE INDEX idx_signalements_firebase ON signalements(firebase_id);
CREATE INDEX idx_signalements_date ON signalements(date_creation);
CREATE INDEX idx_signalements_coords ON signalements(latitude, longitude);

-- Table historique des signalements
CREATE TABLE signalement_historique (
    id SERIAL PRIMARY KEY,
    signalement_id INTEGER NOT NULL REFERENCES signalements(id) ON DELETE CASCADE,
    ancien_status_id INTEGER REFERENCES signalement_status(id),
    nouveau_status_id INTEGER NOT NULL REFERENCES signalement_status(id),
    modifie_par_id INTEGER NOT NULL REFERENCES users(id),
    commentaire TEXT,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_historique_signalement ON signalement_historique(signalement_id);
CREATE INDEX idx_historique_date ON signalement_historique(date_modification);

-- ============================================================
-- TABLE D'AUDIT
-- ============================================================

CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    entite VARCHAR(100),
    entite_id INTEGER,
    user_id INTEGER REFERENCES users(id),
    user_email VARCHAR(150),
    details TEXT,
    donnees_avant JSONB,
    donnees_apres JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    date_action TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_entite ON audit_logs(entite, entite_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_date ON audit_logs(date_action);

-- ============================================================
-- DONNÉES INITIALES
-- ============================================================

-- Rôles (seulement 2 : MANAGER et USER)
-- Les utilisateurs USER peuvent se connecter sur mobile ET web
INSERT INTO roles (code, libelle, description) VALUES
('MANAGER', 'Manager', 'Administrateur du système avec tous les droits'),
('USER', 'Utilisateur', 'Utilisateur standard pouvant utiliser le mobile et le web');

-- Statuts utilisateur
INSERT INTO user_status (code, libelle, description, couleur) VALUES
('ACTIF', 'Actif', 'Compte actif et opérationnel', '#4caf50'),
('INACTIF', 'Inactif', 'Compte désactivé', '#9e9e9e'),
('BLOQUE', 'Bloqué', 'Compte bloqué suite à des tentatives échouées', '#f44336'),
('EN_ATTENTE', 'En attente', 'Compte en attente de validation', '#ff9800');

-- Statuts de signalement
INSERT INTO signalement_status (code, libelle, description, couleur, ordre) VALUES
('NOUVEAU', 'Nouveau', 'Signalement nouvellement créé', '#f44336', 1),
('EN_COURS', 'En cours', 'Travaux en cours de réalisation', '#ff9800', 2),
('PLANIFIE', 'Planifié', 'Travaux planifiés mais non démarrés', '#2196f3', 3),
('EN_ATTENTE', 'En attente', 'En attente de validation ou ressources', '#9c27b0', 4),
('TERMINE', 'Terminé', 'Travaux terminés', '#4caf50', 5);

-- Paramètres système
INSERT INTO parametres (cle, valeur, type, description) VALUES
('MAX_TENTATIVES_CONNEXION', '3', 'INTEGER', 'Nombre maximum de tentatives de connexion avant blocage'),
('DUREE_SESSION_HEURES', '24', 'INTEGER', 'Durée de validité d''une session en heures'),
('DUREE_BLOCAGE_MINUTES', '30', 'INTEGER', 'Durée du blocage automatique en minutes'),
('SYNC_FIREBASE_INTERVAL_MINUTES', '5', 'INTEGER', 'Intervalle de synchronisation Firebase en minutes'),
('MAP_CENTER_LATITUDE', '-18.8792', 'DECIMAL', 'Latitude du centre de la carte (Antananarivo)'),
('MAP_CENTER_LONGITUDE', '47.5079', 'DECIMAL', 'Longitude du centre de la carte (Antananarivo)'),
('MAP_DEFAULT_ZOOM', '13', 'INTEGER', 'Niveau de zoom par défaut de la carte'),
('BUDGET_COEFFICIENT_M2', '300000', 'DECIMAL', 'Coefficient budget par m² en MGA');

-- Entreprises
INSERT INTO entreprises (nom, adresse, telephone, email, contact_nom) VALUES
('COLAS Madagascar', 'Antananarivo, Madagascar', '+261 20 22 123 45', 'contact@colas.mg', 'Directeur Technique'),
('Entreprise Rasoanaivo', 'Ankorondrano, Antananarivo', '+261 34 12 345 67', 'rasoanaivo@gmail.com', 'M. Rasoanaivo'),
('SOGEA', 'Analakely, Antananarivo', '+261 20 22 234 56', 'contact@sogea.mg', 'Chef de Projet'),
('Tsarafara Construction', 'Ivandry, Antananarivo', '+261 33 45 678 90', 'tsarafara@gmail.com', 'Gérant'),
('Groupe Zanaka', 'Ambohijatovo, Antananarivo', '+261 32 98 765 43', 'zanaka@outlook.com', 'Responsable BTP');

-- Utilisateurs par défaut (mot de passe hashé avec BCrypt)
-- Le hash correspond à 'Manager2026!' et 'User2026!'
-- Tous les USER peuvent se connecter sur mobile ET web
INSERT INTO users (email, password_hash, nom, prenom, role_id, status_id, actif, bloque) VALUES
('admin@manager.mg', '$2a$10$Dr1y1oTiekZXU8P582RfpevoDqnGja5cFGjKDcW2OsLTi1VFHje6G', 'Admin', 'Manager', 1, 1, true, false);



-- ============================================================
-- FONCTIONS UTILITAIRES
-- ============================================================

-- Fonction pour obtenir les statistiques des signalements
CREATE OR REPLACE FUNCTION get_signalements_stats()
RETURNS TABLE(
    total_signalements BIGINT,
    nouveaux BIGINT,
    en_cours BIGINT,
    termines BIGINT,
    surface_totale DECIMAL,
    budget_total DECIMAL,
    pourcentage_avancement DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_signalements,
        COUNT(*) FILTER (WHERE ss.code = 'NOUVEAU')::BIGINT as nouveaux,
        COUNT(*) FILTER (WHERE ss.code = 'EN_COURS')::BIGINT as en_cours,
        COUNT(*) FILTER (WHERE ss.code = 'TERMINE')::BIGINT as termines,
        COALESCE(SUM(s.surface), 0) as surface_totale,
        COALESCE(SUM(s.budget_estime), 0) as budget_total,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(*) FILTER (WHERE ss.code = 'TERMINE')::DECIMAL / COUNT(*)::DECIMAL) * 100, 1)
            ELSE 0
        END as pourcentage_avancement
    FROM signalements s
    JOIN signalement_status ss ON s.status_id = ss.id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour nettoyer les sessions expirées
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM sessions WHERE date_expiration < CURRENT_TIMESTAMP OR actif = FALSE;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour date_modification
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.date_modification = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_modtime
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_signalements_modtime
    BEFORE UPDATE ON signalements
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_entreprises_modtime
    BEFORE UPDATE ON entreprises
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_parametres_modtime
    BEFORE UPDATE ON parametres
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
