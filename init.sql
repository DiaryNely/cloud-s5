--
-- PostgreSQL database dump
--

\restrict IyiYaHPYYXyfyPcNZBfLITXf8r5jEaEJDvF2rolR75bYsEGODqEC03BL04ahOeK

-- Dumped from database version 15.15
-- Dumped by pg_dump version 15.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: prix_forfaitaire; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.prix_forfaitaire (
    id bigint NOT NULL,
    label character varying(150) NOT NULL,
    description text,
    prix_m2 double precision NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: prix_forfaitaire_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.prix_forfaitaire_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: prix_forfaitaire_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.prix_forfaitaire_id_seq OWNED BY public.prix_forfaitaire.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    libelle character varying(50) NOT NULL,
    description text
);


--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id integer NOT NULL,
    user_id integer,
    token_hash character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp without time zone NOT NULL,
    revoked boolean DEFAULT false,
    device_info character varying(255),
    ip_address character varying(50)
);


--
-- Name: sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sessions_id_seq OWNED BY public.sessions.id;


--
-- Name: signalements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.signalements (
    id bigint NOT NULL,
    title character varying(150) NOT NULL,
    description text,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    status character varying(50) DEFAULT 'NOUVEAU'::character varying,
    surface_m2 double precision,
    budget_ar double precision,
    entreprise character varying(150),
    user_uid character varying(128),
    user_email character varying(255),
    synced_to_firebase boolean DEFAULT false,
    firebase_id character varying(128),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    date_nouveau timestamp without time zone,
    date_en_cours timestamp without time zone,
    date_termine timestamp without time zone,
    photo_url character varying(500),
    niveau integer DEFAULT 1,
    CONSTRAINT check_niveau CHECK (((niveau >= 1) AND (niveau <= 10)))
);


--
-- Name: signalements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.signalements_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: signalements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.signalements_id_seq OWNED BY public.signalements.id;


--
-- Name: sync_queue; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sync_queue (
    id integer NOT NULL,
    user_id integer,
    action character varying(50) NOT NULL,
    payload jsonb,
    status character varying(50) DEFAULT 'PENDING'::character varying,
    attempts integer DEFAULT 0,
    last_attempt timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: sync_queue_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sync_queue_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sync_queue_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sync_queue_id_seq OWNED BY public.sync_queue.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    uid character varying(128) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    nom character varying(100),
    prenom character varying(100),
    num_etu character varying(50),
    role character varying(50) DEFAULT 'UTILISATEUR'::character varying,
    synced_to_firebase boolean DEFAULT false,
    firebase_uid character varying(128),
    login_attempts integer DEFAULT 0,
    blocked_until timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: prix_forfaitaire id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prix_forfaitaire ALTER COLUMN id SET DEFAULT nextval('public.prix_forfaitaire_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: sessions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions ALTER COLUMN id SET DEFAULT nextval('public.sessions_id_seq'::regclass);


--
-- Name: signalements id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signalements ALTER COLUMN id SET DEFAULT nextval('public.signalements_id_seq'::regclass);


--
-- Name: sync_queue id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sync_queue ALTER COLUMN id SET DEFAULT nextval('public.sync_queue_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: prix_forfaitaire; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.prix_forfaitaire (id, label, description, prix_m2, created_at, updated_at) FROM stdin;
2	test	\N	10000	2026-02-10 09:40:22.439267+00	2026-02-10 09:40:22.439267+00
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.roles (id, libelle, description) FROM stdin;
1	VISITEUR	Peut seulement voir la carte
2	UTILISATEUR	Peut signaler des incidents
3	MANAGER	Peut g├®rer les signalements et utilisateurs
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sessions (id, user_id, token_hash, created_at, expires_at, revoked, device_info, ip_address) FROM stdin;
\.


--
-- Data for Name: signalements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.signalements (id, title, description, latitude, longitude, status, surface_m2, budget_ar, entreprise, user_uid, user_email, synced_to_firebase, firebase_id, created_at, updated_at, date_nouveau, date_en_cours, date_termine, photo_url, niveau) FROM stdin;
\.


--
-- Data for Name: sync_queue; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sync_queue (id, user_id, action, payload, status, attempts, last_attempt, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, uid, email, password_hash, nom, prenom, num_etu, role, synced_to_firebase, firebase_uid, login_attempts, blocked_until, created_at, updated_at) FROM stdin;
19	63f853d0-214a-4dd1-a2f1-805d23c22e12	user@cloud-s5.mg	$2a$10$24KvBdrsx7rSG8w54X9e/OTk1lqsy3nOwmK7yH/CfHldDw45Kb4uu	Utilisateur	Test	\N	UTILISATEUR	t	UhWH6X9fNuc4DtqeUGb2apa7At52	0	\N	2026-02-10 08:42:22.412712	2026-02-10 11:44:16.869778
18	fa934712-8497-4c17-bb06-b57c66e6c2e5	manager@cloud-s5.mg	$2a$10$xgPxIUkAtH8WpNw184niQOhi.6IzH.M0ITvvppMuwgHuwDLOKGOAW	Manager	Admin	3123	MANAGER	t	SVZqDXDduVWEgYDgn8yfdjkbWHR2	0	\N	2026-02-10 08:42:03.180329	2026-02-10 12:24:23.457729
20	b916e2b6-5da2-4a64-b755-5fded7418968	cindy@cindy.mg	$2a$10$ht68zS1zqetQklNBQwohdeajvwVaO0cbI5R7PXv0ue.3bERJOEYZ6	test	test	3123	USER	t	aDjVDMQZpMfF7KI1qrKe8mFgJl12	0	\N	2026-02-10 09:43:25.058387	2026-02-10 12:50:35.006209
\.


--
-- Name: prix_forfaitaire_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.prix_forfaitaire_id_seq', 2, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.roles_id_seq', 3, true);


--
-- Name: sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sessions_id_seq', 1, false);


--
-- Name: signalements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.signalements_id_seq', 31, true);


--
-- Name: sync_queue_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sync_queue_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 20, true);


--
-- Name: prix_forfaitaire prix_forfaitaire_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prix_forfaitaire
    ADD CONSTRAINT prix_forfaitaire_pkey PRIMARY KEY (id);


--
-- Name: roles roles_libelle_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_libelle_key UNIQUE (libelle);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: signalements signalements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signalements
    ADD CONSTRAINT signalements_pkey PRIMARY KEY (id);


--
-- Name: sync_queue sync_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sync_queue
    ADD CONSTRAINT sync_queue_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_uid_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_uid_key UNIQUE (uid);


--
-- Name: idx_signalements_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_signalements_status ON public.signalements USING btree (status);


--
-- Name: idx_signalements_synced; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_signalements_synced ON public.signalements USING btree (synced_to_firebase);


--
-- Name: idx_signalements_user_uid; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_signalements_user_uid ON public.signalements USING btree (user_uid);


--
-- Name: idx_sync_queue_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sync_queue_status ON public.sync_queue USING btree (status);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_synced; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_synced ON public.users USING btree (synced_to_firebase);


--
-- Name: signalements update_signalements_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_signalements_updated_at BEFORE UPDATE ON public.signalements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: sync_queue sync_queue_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sync_queue
    ADD CONSTRAINT sync_queue_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict IyiYaHPYYXyfyPcNZBfLITXf8r5jEaEJDvF2rolR75bYsEGODqEC03BL04ahOeK

