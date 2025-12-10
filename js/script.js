// 1. HAMBURGER MENU LOGIC
const hamburger = document.getElementById('hamburger');
const mobileNav = document.getElementById('mobileNav');
const bars = document.querySelectorAll('.bar');

if (hamburger) {
    hamburger.addEventListener('click', () => {
        mobileNav.classList.toggle('active');
        if(mobileNav.classList.contains('active')) {
            bars[0].style.transform = "translateY(8px) rotate(45deg)";
            bars[1].style.opacity = "0";
            bars[2].style.transform = "translateY(-8px) rotate(-45deg)";
        } else {
            bars[0].style.transform = "none";
            bars[1].style.opacity = "1";
            bars[2].style.transform = "none";
        }
    });
}

// 2. SUPABASE CONFIGURATION (Connected!)
const SUPABASE_URL = 'https://tfjxfmjcmynwwhslzvdy.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_cEjENOV9eLIWWl9KshKojQ_jTnwFhoa'; 

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 3. LIBRARY LOGIC
const grid = document.getElementById('library-grid');
const countLabel = document.getElementById('result-count');
const searchInput = document.querySelector('.search-input input');
const filterSelects = document.querySelectorAll('.filter-group select');

// --- FETCH FUNCTION (The Database Logic) ---
async function fetchMaterials() {
    if (!grid) return;

    // Show loading state
    countLabel.innerText = "Searching database...";
    grid.innerHTML = '<p style="text-align:center; color:#6b7280; width:100%; margin-top:20px;">Loading materials...</p>';

    // Get values from UI
    const searchTerm = searchInput.value.trim();
    const schoolFilter = filterSelects[0].value;
    const levelFilter = filterSelects[1].value;
    const semFilter = filterSelects[2].value;

    // Start building the query
    let query = supabase
        .from('materials') 
        .select('*')
        .limit(50); // Optimization: Load max 50 items initially

    // 1. Search Filter (Checks Title OR Course Code)
    if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,course_code.ilike.%${searchTerm}%`);
    }

    // 2. Dropdown Filters
    if (schoolFilter) { query = query.eq('school', schoolFilter); }
    if (levelFilter) { query = query.eq('level', levelFilter); }
    if (semFilter) { query = query.eq('semester', semFilter); }

    // Execute Query
    const { data, error } = await query;

    if (error) {
        console.error('Error fetching data:', error);
        countLabel.innerText = "Error loading data.";
        grid.innerHTML = '<p style="text-align:center; color:red; width:100%;">Database Error. Check console.</p>';
        return;
    }

    // Render Results
    renderLibrary(data);
}

// --- RENDER FUNCTION (Builds HTML) ---
function renderLibrary(data) {
    grid.innerHTML = ""; // Clear loader

    if (!data || data.length === 0) {
        countLabel.innerText = "No results found";
        grid.innerHTML = '<p style="text-align:center; color:#6b7280; width:100%; margin-top:20px;">No materials match your search.</p>';
        return;
    }

    countLabel.innerText = `Showing ${data.length} Results`;

    data.forEach(file => {
        const card = document.createElement('div');
        card.className = 'material-card';

        // Check if PDF or DOC for icon color
        const isPdf = file.file_type === 'PDF';
        const iconClass = isPdf ? "file-icon-box" : "file-icon-box doc-theme";
        
        // Add specific style for DOC type if needed (assuming .doc-theme exists in CSS or inline style here)
        const iconStyle = !isPdf ? 'background-color:#dbeafe; color:#2563eb;' : '';

        // SVG Icon
        const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`;

        card.innerHTML = `
            <div class="card-header">
                <div class="${iconClass}" style="${iconStyle}">
                    ${iconSvg}
                </div>
                <div class="header-info">
                    <h3>${file.title}</h3>
                    <div class="meta-row">
                        <span class="course-code">${file.course_code}</span>
                    </div>
                </div>
            </div>
            
            <div class="card-body">
                <p>${file.description || 'No description available.'}</p>
                <div class="visible-meta">${file.level}L • ${file.semester} Sem • ${file.file_size}</div>
            </div>

            <div class="card-footer">
                <a href="${file.download_url}" target="_blank" class="btn-download-full">Download ${file.file_type}</a>
            </div>
        `;

        grid.appendChild(card);
    });
}

// --- DEBOUNCE (Prevents spamming the database) ---
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// --- INITIALIZE & LISTENERS ---
document.addEventListener("DOMContentLoaded", () => {
    addSupportButton();

    // Only run library logic if we are on the library page
    if (searchInput) {
        // Initial Fetch
        fetchMaterials();

        // Search with Debounce
        const debouncedSearch = debounce(() => fetchMaterials(), 500);
        searchInput.addEventListener('input', debouncedSearch);

        // Filter Dropdowns
        filterSelects.forEach(select => select.addEventListener('change', fetchMaterials));
    }
});

// 4. FLOATING BUTTON LOGIC
function addSupportButton() {
    const whatsappLink = "https://wa.link/15dowu"; 
    const btn = document.createElement('a');
    btn.href = whatsappLink;
    btn.target = "_blank";
    btn.className = "floating-btn";
    btn.innerHTML = `
        <span class="support-tooltip">Need Help?</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
    `;
    document.body.appendChild(btn);

    let scrollTimeout;
    const tooltip = btn.querySelector('.support-tooltip');
    window.addEventListener('scroll', () => {
        tooltip.classList.add('show');
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => { tooltip.classList.remove('show'); }, 3000);
    });
                 }
        
