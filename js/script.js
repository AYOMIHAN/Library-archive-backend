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

// 2. SUPABASE CONFIGURATION
const SUPABASE_URL = 'https://tfjxfmjcmynwwhslzvdy.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_cEjENOV9eLIWWl9KshKojQ_jTnwFhoa'; 

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 3. LIBRARY LOGIC
const grid = document.getElementById('library-grid');
const countLabel = document.getElementById('result-count');
const searchInput = document.querySelector('.search-input input');
const filterSelects = document.querySelectorAll('.filter-group select');

// --- FETCH FUNCTION (Database) ---
async function fetchMaterials() {
    if (!grid) return;

    // Loading State
    countLabel.innerText = "Searching database...";
    grid.innerHTML = '<p style="text-align:center; color:#6b7280; width:100%; margin-top:20px;">Loading materials...</p>';

    // Get Inputs
    const searchTerm = searchInput.value.trim();
    const schoolFilter = filterSelects[0].value;
    const levelFilter = filterSelects[1].value;
    const semFilter = filterSelects[2].value;

    // Build Query
    let query = supabase
        .from('materials') 
        .select('*')
        .limit(50); // Optimization

    // Apply Filters
    if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,course_code.ilike.%${searchTerm}%`);
    }
    if (schoolFilter) { query = query.eq('school', schoolFilter); }
    if (levelFilter) { query = query.eq('level', levelFilter); }
    if (semFilter) { query = query.eq('semester', semFilter); }

    // Run Query
    const { data, error } = await query;

    if (error) {
        console.error('Error fetching data:', error);
        countLabel.innerText = "Error loading data.";
        grid.innerHTML = '<p style="text-align:center; color:red; width:100%;">Database Error. Check console.</p>';
        return;
    }

    renderLibrary(data);
}

// --- RENDER FUNCTION (With "Request Material" Logic) ---
function renderLibrary(data) {
    grid.innerHTML = ""; 

    // 1. HANDLE NO RESULTS (Show Request Card)
    if (!data || data.length === 0) {
        const userSearch = searchInput.value.trim();
        
        // Use your specific WA Link
        const whatsappUrl = "https://wa.link/15dowu";

        countLabel.innerText = "No results found";
        
        // Inject the Request Card
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: white; border-radius: 12px; border: 1px dashed #cbd5e1;">
                <div style="font-size: 3rem; margin-bottom: 15px;">🤔</div>
                <h3 style="font-size: 1.2rem; color: #1e293b; margin-bottom: 10px;">Couldn't find what you're looking for?</h3>
                <p style="color: #64748b; margin-bottom: 25px; max-width: 400px; margin-left: auto; margin-right: auto;">
                    We are constantly updating our database. Request <strong>"${userSearch || 'this material'}"</strong> directly, and we will try to find it for you.
                </p>
                <a href="${whatsappUrl}" target="_blank" style="background-color: #22c55e; color: white; padding: 12px 24px; border-radius: 50px; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; transition: 0.2s;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    Request via WhatsApp
                </a>
            </div>
        `;
        return;
    }

    // 2. SHOW RESULTS (Standard Cards)
    countLabel.innerText = `Showing ${data.length} Results`;

    data.forEach(file => {
        const card = document.createElement('div');
        card.className = 'material-card';

        const isPdf = file.file_type === 'PDF';
        const iconClass = isPdf ? "file-icon-box" : "file-icon-box doc-theme";
        // Check for DOC style override if needed (assuming logic from previous steps)
        const iconStyle = !isPdf ? 'background-color:#dbeafe; color:#2563eb;' : '';
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
                <button class="btn-download-full" onclick="startDownload('${file.download_url}', this)">
                    Download ${file.file_type}
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// --- COUNTDOWN DOWNLOAD LOGIC ---
function startDownload(url, btnElement) {
    const originalText = btnElement.innerText;
    let timeLeft = 5; 
    
    btnElement.disabled = true; 
    btnElement.style.backgroundColor = "#94a3b8"; 
    btnElement.style.cursor = "wait";
    btnElement.innerText = `Generating Link (${timeLeft}s)...`;

    const timer = setInterval(() => {
        timeLeft--;
        btnElement.innerText = `Generating Link (${timeLeft}s)...`;

        if (timeLeft <= 0) {
            clearInterval(timer);
            btnElement.style.backgroundColor = "#22c55e"; 
            btnElement.innerText = "Download Started! 🚀";
            
            window.open(url, '_blank');

            setTimeout(() => {
                btnElement.innerText = originalText;
                btnElement.disabled = false;
                btnElement.style.backgroundColor = ""; 
                btnElement.style.cursor = "pointer";
            }, 3000);
        }
    }, 1000);
}

// --- INITIALIZE & URL PARSING ---
document.addEventListener("DOMContentLoaded", () => {
    addSupportButton();

    if (searchInput) {
        // Check URL Params (e.g. from Home Page Click)
        const urlParams = new URLSearchParams(window.location.search);
        const schoolParam = urlParams.get('school');

        if (schoolParam) {
            filterSelects[0].value = schoolParam;
            fetchMaterials();
        } else {
            // Empty State (Instructions)
            countLabel.innerText = "Start Searching";
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #64748b;">
                    <div style="font-size: 3rem; margin-bottom: 10px;">🔍</div>
                    <h3 style="font-size: 1.2rem; color: #1e293b; margin-bottom: 5px;">Ready to Explore?</h3>
                    <p>Select a School, Level, or type a Course Code above to find materials.</p>
                </div>
            `;
        }

        // Search Listeners with Debounce
        const debouncedSearch = debounce(() => fetchMaterials(), 500);
        searchInput.addEventListener('input', debouncedSearch);
        filterSelects.forEach(select => select.addEventListener('change', fetchMaterials));
    }
});

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// 4. FLOATING BUTTON
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
                       
