import React from "react";

export default function ProjectionPage() {
    return (
        <main className="p-8 space-y-8">
            <h1 className="text-3xl font-bold">Vue Enseignant – Projection</h1>
            <section>
                <h2 className="text-xl font-semibold mb-2">Composants projetables personnalisables</h2>
                <ul className="list-disc ml-6">
                    <li>Fenêtres flottantes pour chrono, question, podium, etc.</li>
                    <li>Déplacement et redimensionnement libre de chaque composant</li>
                </ul>
            </section>
            <section>
                <h2 className="text-xl font-semibold mb-2">Chronomètre</h2>
                <ul className="list-disc ml-6">
                    <li>Affichage chrono visible</li>
                    <li>Démarrer / Pause / Réinitialiser</li>
                    <li>Modifier la durée à tout moment</li>
                    <li>Sauter une question</li>
                </ul>
            </section>
            <section>
                <h2 className="text-xl font-semibold mb-2">Affichage question</h2>
                <ul className="list-disc ml-6">
                    <li>Question en cours avec options de réponse</li>
                    <li>Nombre d’élèves ayant répondu en temps réel</li>
                    <li>Rejouer une question</li>
                    <li>Affichage de la bonne réponse sur action</li>
                </ul>
            </section>
        </main>
    );
}
