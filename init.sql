--
-- PostgreSQL database dump
--

\restrict tXFIbJiHFrwyNzBkKEyDzK8uSlWV1FOX12u4gmo79O8zjddiIZEI7qxQ6uNubSz

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
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    libelle character varying(50) NOT NULL,
    description text
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.roles_id_seq OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.sessions OWNER TO postgres;

--
-- Name: sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.sessions_id_seq OWNER TO postgres;

--
-- Name: sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sessions_id_seq OWNED BY public.sessions.id;


--
-- Name: signalements; Type: TABLE; Schema: public; Owner: postgres
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
    photo_url character varying(500)
);


ALTER TABLE public.signalements OWNER TO postgres;

--
-- Name: signalements_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.signalements_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.signalements_id_seq OWNER TO postgres;

--
-- Name: signalements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.signalements_id_seq OWNED BY public.signalements.id;


--
-- Name: sync_queue; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.sync_queue OWNER TO postgres;

--
-- Name: sync_queue_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sync_queue_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.sync_queue_id_seq OWNER TO postgres;

--
-- Name: sync_queue_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sync_queue_id_seq OWNED BY public.sync_queue.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: sessions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions ALTER COLUMN id SET DEFAULT nextval('public.sessions_id_seq'::regclass);


--
-- Name: signalements id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signalements ALTER COLUMN id SET DEFAULT nextval('public.signalements_id_seq'::regclass);


--
-- Name: sync_queue id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sync_queue ALTER COLUMN id SET DEFAULT nextval('public.sync_queue_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, libelle, description) FROM stdin;
1	VISITEUR	Peut seulement voir la carte
2	UTILISATEUR	Peut signaler des incidents
3	MANAGER	Peut gérer les signalements et utilisateurs
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (id, user_id, token_hash, created_at, expires_at, revoked, device_info, ip_address) FROM stdin;
\.


--
-- Data for Name: signalements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.signalements (id, title, description, latitude, longitude, status, surface_m2, budget_ar, entreprise, user_uid, user_email, synced_to_firebase, firebase_id, created_at, updated_at, date_nouveau, date_en_cours, date_termine, photo_url) FROM stdin;
4	ity	ity test	-18.986012162114992	47.53247666797211	NOUVEAU	30	4300098	magica	QsiJb1T7gaUbVJA79X9HarfOkgM2	dimbyrajoelijao@gmail.com	t	4	2026-01-27 07:08:59.513158	2026-02-03 08:37:03.391687	2026-01-27 07:08:59.513158	\N	\N	\N
5	test	testststs	-18.919310485418624	47.539582881958594	NOUVEAU	10	500000	ranto adala	QsiJb1T7gaUbVJA79X9HarfOkgM2	dimbyrajoelijao@gmail.com	t	5	2026-01-27 07:08:59.550959	2026-02-03 08:37:03.391687	2026-01-27 07:08:59.550959	\N	\N	\N
6	Nid de lpb	misy rano satria misy lavaka 	-18.985997335642143	47.53246304073257	NOUVEAU	123	49999996	LPB	YPFdwqfnZcMj02OBQpjWqRlw16u2	kantoandriamanakasina@gmail.com	t	6	2026-01-27 07:40:20.580398	2026-02-03 08:37:03.391687	2026-01-27 07:40:20.580398	\N	\N	\N
2	nid de poule	test	-18.886024924428828	47.52194297948091	NOUVEAU	20	300000	tsy magic	QsiJb1T7gaUbVJA79X9HarfOkgM2	dimbyrajoelijao@gmail.com	t	2	2026-01-27 06:07:15.112461	2026-02-03 12:31:57.659825	2026-01-27 06:07:15.112461	\N	\N	/uploads/signalements/sig_2_9d9d8c8d-4af0-4b2c-a732-7e18455b5426.png
1	nid de poule	ratsy	-18.818299628565303	47.52000234377398	TERMINE	20	200000	magic	xdc53w0Npidkj4HSUrNeuJCsGoW2	mota@gmail.com	t	1	2026-01-27 06:07:15.091022	2026-02-03 12:37:04.08764	2026-01-27 06:07:15.091022	2026-02-03 00:00:00	2026-02-21 00:00:00	/uploads/signalements/sig_1_779cb79b-5b93-458c-9742-99e5951146c8.png
3	nid	test	-18.90860681903941	47.53327914493254	EN_COURS	30	240000	magic	QsiJb1T7gaUbVJA79X9HarfOkgM2	dimbyrajoelijao@gmail.com	t	3	2026-01-27 06:07:15.123061	2026-02-03 12:48:06.466006	2026-01-27 06:07:15.123061	2026-02-03 00:00:00	\N	/uploads/signalements/sig_3_997c399a-48c4-4d7f-bc67-30148ac65a0d.jpg
7	nid de cyclone	cyclone tropicale	-18.98600085840515	47.53246822550446	NOUVEAU	62	20000	kantooo	YPFdwqfnZcMj02OBQpjWqRlw16u2	kantoandriamanakasina@gmail.com	t	7	2026-02-10 06:08:27.168089	2026-02-10 09:08:27.265291	\N	\N	\N	/uploads/signalements/sig_7_d2c6bbd7-7238-4349-a533-50101a1045af.jpg
\.


--
-- Data for Name: sync_queue; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sync_queue (id, user_id, action, payload, status, attempts, last_attempt, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, uid, email, password_hash, nom, prenom, num_etu, role, synced_to_firebase, firebase_uid, login_attempts, blocked_until, created_at, updated_at) FROM stdin;
3	local-1769494031935-2	jean.rakoto@test.mg	$2a$10$AQYw7lXwLSE4oDOCLFmM5unbe75XlLexdk6/Vfr4QFh8VKgsdMJ/S	Jean	Rakoto	\N	UTILISATEUR	t	5lV3hToXgAOjs4L1U8wNRSnAQhG3	0	\N	2026-01-27 06:07:12.004572	2026-01-27 06:07:12.004572
4	local-1769494032013-3	offlinefee.user2@test.mg	$2a$10$Nf/TunpLN6N9Up2ZrUX5MuQbm785vSdb0cIdJbvqZQZHvZguTa.w6	\N	\N	\N	USER	t	89gdJEYl46SPRJCL6v21pkJs4Ak1	0	\N	2026-01-27 06:07:12.082859	2026-01-27 06:07:12.082859
6	local-1769494032176-5	ity@gmail.com	$2a$10$rRzZMTyQiRD41Oa2e4q4Suhc5qJf.kAWnYL/xzbawxry1Ql6eX5yq	null	null	\N	USER	t	QRT3cNsJApM5cigyCRAYOaiMCDw1	0	\N	2026-01-27 06:07:12.244183	2026-01-27 06:07:12.244183
7	local-1769494032267-6	dimbyrajoelijao@gmail.com	$2a$10$gZdgsJGJqTI7G/91D/GTn.aRBItZlVjpKueHKhAQYBbt98Qj9GCHG	Dimby	Rajoelijao	\N	UTILISATEUR	t	QsiJb1T7gaUbVJA79X9HarfOkgM2	0	\N	2026-01-27 06:07:12.33535	2026-01-27 06:07:12.33535
8	local-1769494032351-7	tester@example.com	$2a$10$zzqIy1vOHWKNWiME1c7JQualVbuwTSfgDlfaoqVSzf/7nFKbIk3SS	User	Test	\N	UTILISATEUR	t	SLsD2mCFuJYV1AwIzqEWJfAR7ge2	0	\N	2026-01-27 06:07:12.418854	2026-01-27 06:07:12.418854
9	local-1769494032433-8	kantoandriamanakasina@gmail.com	$2a$10$b2APiFsf2U2ld0JhT46nl.JXA3lARTR6nOE9rnVRWDF4lM6yIdnqC	\N	\N	\N	UTILISATEUR	t	YPFdwqfnZcMj02OBQpjWqRlw16u2	0	\N	2026-01-27 06:07:12.504761	2026-01-27 06:07:12.504761
12	local-1769494032672-11	mota@gmail.com	$2a$10$YD8SsuGJTAAMxkbHQyR17.bFe27GDLrUTt.W46sjyGFuIx0gr/Ce6	 mota	mota	\N	UTILISATEUR	t	xdc53w0Npidkj4HSUrNeuJCsGoW2	0	\N	2026-01-27 06:07:12.740249	2026-01-27 06:07:12.740249
1	local-1769494031748-0	kanto@gmail.com	$2a$10$TDrHUZylU5IzurfgD12XauYuEnbrz5Em5lBydGKTyat7SOnUJS7.G	\N	kanto	\N	USER	t	0EgF8ZIeWcWE3kHPhJXImpXMcAN2	3	2026-01-27 06:19:42.906003	2026-01-27 06:07:11.824586	2026-01-27 09:14:42.902849
10	local-1769494032513-9	hasiniaina.nely@gmail.com	$2a$10$rfzAwGO5RqBTdlHU5ZdkKe6AGW4U7GC2qiKzifp1iFe8TSE8t6yIe	Diary	NELY	\N	UTILISATEUR	t	fMwe8MGCfpYONd2BUoLfP3EA3As2	3	2026-01-27 06:19:57.621306	2026-01-27 06:07:12.582844	2026-01-27 09:14:57.620509
13	local-1769504594209-0	andrana@gmail.com	$2a$10$hKwPVV4jsfR5mkWiFpkYBe6nbCMdBeVcxP/EsYxCQXsJ7FXOG4UWu	null	null	\N	USER	t	vUfxAN1MjmfL90KapcZ0GBcFemk2	0	\N	2026-01-27 09:03:14.277801	2026-01-27 09:03:14.277801
11	local-1769494032593-10	nasa@gmail.com	$2a$10$XkT6OeHek7a/r70DcKfygekUzlHV4zLn2BxBg2Xfqqfi3epAkAi76	null	null	\N	USER	t	oetNRgzEpPUgjNgiPtFWVOGJ8Zg2	0	2126-01-10 08:37:32.429807	2026-01-27 06:07:12.662022	2026-02-03 11:37:32.472299
2	local-1769494031857-1	online.user@test.mg	$2a$10$X6q7dZdYKjp8bMiPrPpse.zpXNRmX47jscGlRa6zPw6I1nmdn61/y	\N	Mod	\N	MANAGER	t	0etawFhHLUbJpAUoeBJ2u8Kvlc22	0	\N	2026-01-27 06:07:11.925775	2026-02-03 08:53:44.157721
16	local-1770109224816-0	admin@cloud-s5.mg	$2a$10$ZL9upE5Zwndk/7E9oRGa7Otouo3pFcWH7pe4eQFVAqjvjyImmJQla	Admin	Super	\N	MANAGER	t	7QoOH1onhSRSV79KbLYgLgPLYU33	0	\N	2026-02-03 09:00:24.904441	2026-02-03 09:00:24.904441
17	local-1770109225075-1	manager@cloud-s5.mg	$2a$10$2XD7Ve5322u4GKmbzz0s3uUxu2tK0M2bMLJWDPkuOqHiq12jp/FOy	Manager	Admin	\N	MANAGER	t	SVZqDXDduVWEgYDgn8yfdjkbWHR2	0	\N	2026-02-03 09:00:25.159323	2026-02-03 09:00:25.159323
\.


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_seq', 3, true);


--
-- Name: sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sessions_id_seq', 1, false);


--
-- Name: signalements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.signalements_id_seq', 7, true);


--
-- Name: sync_queue_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sync_queue_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 17, true);


--
-- Name: roles roles_libelle_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_libelle_key UNIQUE (libelle);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: signalements signalements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signalements
    ADD CONSTRAINT signalements_pkey PRIMARY KEY (id);


--
-- Name: sync_queue sync_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sync_queue
    ADD CONSTRAINT sync_queue_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_uid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_uid_key UNIQUE (uid);


--
-- Name: idx_signalements_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signalements_status ON public.signalements USING btree (status);


--
-- Name: idx_signalements_synced; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signalements_synced ON public.signalements USING btree (synced_to_firebase);


--
-- Name: idx_signalements_user_uid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signalements_user_uid ON public.signalements USING btree (user_uid);


--
-- Name: idx_sync_queue_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sync_queue_status ON public.sync_queue USING btree (status);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_synced; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_synced ON public.users USING btree (synced_to_firebase);


--
-- Name: signalements update_signalements_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_signalements_updated_at BEFORE UPDATE ON public.signalements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: sync_queue sync_queue_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sync_queue
    ADD CONSTRAINT sync_queue_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict tXFIbJiHFrwyNzBkKEyDzK8uSlWV1FOX12u4gmo79O8zjddiIZEI7qxQ6uNubSz

