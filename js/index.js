// --- HOME PAGE LOGIC ---

// 1. Handle Search Form Submission
document.getElementById('homeSearchForm').addEventListener('submit', function(e) {
    e.preventDefault(); // Stop the page from reloading normally
    
    const query = document.getElementById('homeSearchInput').value.trim();
    
    if (query) {
        // Redirect to the Library page, passing the search term in the URL
        // Example: library.html?search=MTS 101
        window.location.href = `library.html?search=${encodeURIComponent(query)}`;
    }
});

// 2. Handle "Quick Access" Card Clicks
function goToLibrary(level) {
    // Redirect to the Library page, passing the Level filter in the URL
    // Example: library.html?level=200
    window.location.href = `library.html?level=${level}`;
}
