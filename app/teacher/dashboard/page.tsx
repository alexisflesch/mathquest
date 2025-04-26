/**
 * Teacher Dashboard Page
 * 
 * This page serves as the central control hub for teachers after authentication.
 * It provides an overview of:
 * - Quiz navigation and management features
 * - Real-time statistics available during quiz sessions
 * - Session control capabilities for managing student participation
 * 
 * The dashboard presents a structured menu of teacher capabilities, 
 * allowing quick understanding of available features and establishing
 * expectations for the teacher experience within MathQuest.
 */

import React from "react";

export default function DashboardPage() {
    return (
        <main className="p-8 space-y-8">
            <h1 className="text-3xl font-bold">Vue Enseignant – Dashboard</h1>
            <section>
                <h2 className="text-xl font-semibold mb-2">Navigation et contrôle</h2>
                <ul className="list-disc ml-6">
                    <li>Liste des questions du quiz en cours avec réponses en sous-menu</li>
                    <li>Changer l’ordre, sauter, ou revenir sur une question (glisser-déposer, suppression)</li>
                </ul>
            </section>
            <section>
                <h2 className="text-xl font-semibold mb-2">Statistiques en temps réel</h2>
                <ul className="list-disc ml-6">
                    <li>Nombre de réponses par question</li>
                    <li>Répartition des réponses</li>
                    <li>Score moyen</li>
                    <li>Taux de réussite</li>
                </ul>
            </section>
            <section>
                <h2 className="text-xl font-semibold mb-2">Gestion des sessions</h2>
                <ul className="list-disc ml-6">
                    <li>Lancement manuel de chaque question</li>
                    <li>Rejouer une question même après l'avoir terminée</li>
                    <li>Chrono paramétrable à chaque question</li>
                    <li>Verrouiller une question pour la rendre non modifiable par les élèves</li>
                </ul>
            </section>
        </main>
    );
}