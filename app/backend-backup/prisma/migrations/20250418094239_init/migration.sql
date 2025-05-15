-- CreateTable
CREATE TABLE "Question" (
    "uid" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "reponses" JSONB NOT NULL,
    "type" TEXT NOT NULL,
    "discipline" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "difficulte" INTEGER NOT NULL,
    "niveau" TEXT NOT NULL,
    "auteur" TEXT,
    "explication" TEXT,
    "tags" TEXT[],
    "temps" INTEGER,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "Enseignant" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "mot_de_passe" TEXT NOT NULL,
    "email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "avatar" TEXT,

    CONSTRAINT "Enseignant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Joueur" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "cookie_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "avatar" TEXT,

    CONSTRAINT "Joueur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tournoi" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_debut" TIMESTAMP(3),
    "date_fin" TIMESTAMP(3),
    "statut" TEXT NOT NULL,
    "enseignant_id" TEXT,
    "questions_ids" TEXT[],
    "type" TEXT NOT NULL,
    "niveau" TEXT,
    "categorie" TEXT,
    "themes" TEXT[],
    "cree_par_id" TEXT NOT NULL,
    "questions_generées" BOOLEAN NOT NULL DEFAULT false,
    "code" TEXT,

    CONSTRAINT "Tournoi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Score" (
    "id" TEXT NOT NULL,
    "tournoi_id" TEXT NOT NULL,
    "joueur_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "temps" INTEGER,
    "position" INTEGER,
    "date_score" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Score_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournoiSauvegarde" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_sauvegarde" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enseignant_id" TEXT NOT NULL,
    "questions_ids" TEXT[],
    "type" TEXT NOT NULL,
    "niveau" TEXT,
    "categorie" TEXT,
    "themes" TEXT[],

    CONSTRAINT "TournoiSauvegarde_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Enseignant_email_key" ON "Enseignant"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Joueur_cookie_id_key" ON "Joueur"("cookie_id");

-- CreateIndex
CREATE UNIQUE INDEX "Tournoi_code_key" ON "Tournoi"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Score_tournoi_id_joueur_id_key" ON "Score"("tournoi_id", "joueur_id");

-- AddForeignKey
ALTER TABLE "Tournoi" ADD CONSTRAINT "Tournoi_enseignant_id_fkey" FOREIGN KEY ("enseignant_id") REFERENCES "Enseignant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tournoi" ADD CONSTRAINT "Tournoi_cree_par_id_fkey" FOREIGN KEY ("cree_par_id") REFERENCES "Joueur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Score" ADD CONSTRAINT "Score_tournoi_id_fkey" FOREIGN KEY ("tournoi_id") REFERENCES "Tournoi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Score" ADD CONSTRAINT "Score_joueur_id_fkey" FOREIGN KEY ("joueur_id") REFERENCES "Joueur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournoiSauvegarde" ADD CONSTRAINT "TournoiSauvegarde_enseignant_id_fkey" FOREIGN KEY ("enseignant_id") REFERENCES "Enseignant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
