/**
 * Manual Test Script for Student Create Game Filtering
 * 
 * This script tests the dropdown filtering functionality after our fix.
 * Run this in the browser console on the student/create-game page.
 */

// Test function to verify filtering is working
function testStudentFiltering() {
    console.log('🧪 Testing Student Create Game Filtering...');

    // Test 1: Check if API returns correct filtering
    fetch('/api/questions/filters?gradeLevel=L2')
        .then(response => response.json())
        .then(data => {
            console.log('✅ API Test - L2 Grade Level Filter:');

            // Check disciplines
            const compatibleDisciplines = data.disciplines.filter(d => d.isCompatible);
            const incompatibleDisciplines = data.disciplines.filter(d => !d.isCompatible);

            console.log('  Compatible disciplines:', compatibleDisciplines.map(d => d.value));
            console.log('  Incompatible disciplines:', incompatibleDisciplines.map(d => d.value));

            // Verify expected results
            const hasMath = compatibleDisciplines.some(d => d.value === 'Mathématiques');
            const hasNoAnglais = !compatibleDisciplines.some(d => d.value === 'Anglais');

            if (hasMath && hasNoAnglais) {
                console.log('  ✅ Disciplines filtering correctly!');
            } else {
                console.log('  ❌ Disciplines NOT filtering correctly!');
            }

            // Check themes
            const compatibleThemes = data.themes.filter(t => t.isCompatible);
            const incompatibleThemes = data.themes.filter(t => !t.isCompatible);

            console.log('  Compatible themes:', compatibleThemes.map(t => t.value));
            console.log('  Expected: Should include Déterminant, Espaces préhilbertiens, etc.');

            const hasExpectedThemes = compatibleThemes.some(t => t.value === 'Déterminant') &&
                compatibleThemes.some(t => t.value === 'Espaces préhilbertiens');
            const hasNoCalcul = !compatibleThemes.some(t => t.value === 'Calcul');

            if (hasExpectedThemes && hasNoCalcul) {
                console.log('  ✅ Themes filtering correctly!');
            } else {
                console.log('  ❌ Themes NOT filtering correctly!');
            }
        })
        .catch(error => {
            console.error('❌ API Test failed:', error);
        });

    // Test 2: Check if no filters returns all as compatible
    fetch('/api/questions/filters')
        .then(response => response.json())
        .then(data => {
            console.log('\n✅ API Test - No Filters (All Compatible):');

            const allDisciplinesCompatible = data.disciplines.every(d => d.isCompatible);
            const allThemesCompatible = data.themes.every(t => t.isCompatible);

            if (allDisciplinesCompatible && allThemesCompatible) {
                console.log('  ✅ All options correctly marked as compatible when no filters applied!');
            } else {
                console.log('  ❌ Not all options marked as compatible when no filters applied!');
            }
        })
        .catch(error => {
            console.error('❌ No filter test failed:', error);
        });

    console.log('\n📋 Manual UI Test Instructions:');
    console.log('1. Go to /student/create-game');
    console.log('2. Select "L2" from the grade level dropdown');
    console.log('3. Verify that only "Mathématiques" appears in the discipline dropdown');
    console.log('4. Select "Mathématiques"');
    console.log('5. Verify that only compatible themes appear (Déterminant, Espaces préhilbertiens, etc.)');
    console.log('6. Incompatible options like "Calcul", "Géométrie" should NOT appear');
}

// Run the test
testStudentFiltering();
