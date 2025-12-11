// 1. HAMBURGER MENU
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

// 2. SUPABASE CONFIG
const SUPABASE_URL = 'https://tfjxfmjcmynwwhslzvdy.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_cEjENOV9eLIWWl9KshKojQ_jTnwFhoa'; 
const STORAGE_URL = 'https://pub-0f85cb90209746ab99254cee3df8fdbc.r2.dev'; 

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 3. LIBRARY LOGIC
const grid = document.getElementById('library-grid');
const countLabel = document.getElementById('result-count');
const searchInput = document.getElementById('main-search'); // Changed ID
const tabButtons = document.querySelectorAll('.tab-btn');

// State Variables
let currentCategory = "Handout"; // Default Tab
let currentSearch = "";

// --- FETCH FUNCTION (Simplified) ---
async function fetchMaterials() {
    if (!grid) return;

    countLabel.innerText = `Searching ${currentCategory}s...`;
    grid.innerHTML = '<p style="text-align:center; color:#6b7280; width:100%; margin-top:20px;">Loading...</p>';

    // Build Query
    let query = supabase
        .from('materials') 
        .select('*')
        .eq('category', currentCategory) // Filter by Active Tab
        .limit(50);

    // Apply Search if typed
    if (currentSearch) {
        query = query.or(`title.ilike.%${currentSearch}%,course_code.ilike.%${currentSearch}%`);
    }

    const { data, error } = await query;

    if (error) {
        console.error(error);
        countLabel.innerText = "Error loading data.";
        return;
    }

    renderLibrary(data);
}

// --- RENDER FUNCTION ---
function renderLibrary(data) {
    grid.innerHTML = ""; 

    // NO RESULTS - SHOW REQUEST BUTTON
    if (!data || data.length === 0) {
        const message = currentSearch 
            ? `Hello, I searched for "${currentSearch}" in ${currentCategory}s but couldn't find it. Can you help?`
            : `Hello, I am looking for a specific ${currentCategory}. Can you help?`;
            
        const whatsappUrl = `https://wa.me/2348000000000?text=${encodeURIComponent(message)}`;

        countLabel.innerText = "No results found";
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: white; border-radius: 8px; border: 1px dashed #cbd5e1;">
                <div style="font-size: 3rem; margin-bottom: 15px;">🤔</div>
                <h3 style="font-size: 1.2rem; color: #1e293b; margin-bottom: 10px;">Missing this file?</h3>
                <p style="color: #64748b; margin-bottom: 25px; max-width: 400px; margin-left: auto; margin-right: auto;">
                    We don't have <strong>"${currentSearch || 'this file'}"</strong> in our ${currentCategory} archive yet. Request it directly!
                </p>
                <a href="${whatsappUrl}" target="_blank" style="background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; transition: 0.2s; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    Request on WhatsApp
                </a>
            </div>
        `;
        return;
    }

    countLabel.innerText = `Found ${data.length} ${currentCategory}s`;

    data.forEach(file => {
        const card = document.createElement('div');
        card.className = 'material-card';
        
        const isPdf = file.file_type === 'PDF';
        const iconClass = isPdf ? "file-icon-box" : "file-icon-box doc-theme";
        const iconStyle = !isPdf ? 'background-color:#dbeafe; color:#2563eb;' : '';
        const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`;

        let finalDownloadUrl = file.download_url;
        if (!finalDownloadUrl.startsWith('http')) {
            finalDownloadUrl = `${STORAGE_URL}/${finalDownloadUrl}`;
        }

        card.innerHTML = `
            <div class="card-header">
                <div class="${iconClass}" style="${iconStyle}">
                    ${iconSvg}
                </div>
                <div class="header-info">
                    <h3>${file.title}</h3>
                    <div class="meta-row">
                        <span class="course-code">${file.course_code}</span>
                        <span style="font-size:0.7rem; background:#f1f5f9; padding:2px 6px; border-radius:4px;">${file.level}L</span>
                        <span style="font-size:0.7rem; background:#f1f5f9; padding:2px 6px; border-radius:4px;">${file.semester} Sem</span>
                    </div>
                </div>
            </div>
            <div class="card-body">
                <p>${file.description || 'No description available.'}</p>
                <div class="visible-meta">${file.school} • ${file.file_size}</div>
            </div>
            <div class="card-footer">
                <button class="btn-download-full" onclick="startDownload('${finalDownloadUrl}', this)">
                    Download ${file.file_type}
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// --- INITIALIZE & EVENT LISTENERS ---
document.addEventListener("DOMContentLoaded", () => {
    addSupportButton();

    if (searchInput) {
        // 1. Handle Tab Clicks
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // UI Toggle
                tabButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                // State Update
                currentCategory = btn.dataset.category;
                fetchMaterials();
            });
        });

        // 2. Handle Search Typing
        const debouncedSearch = debounce(() => {
            currentSearch = searchInput.value.trim();
            fetchMaterials();
        }, 500);
        searchInput.addEventListener('input', debouncedSearch);
        
        // 3. Initial Load
        fetchMaterials();
    }
});

// --- UTILITIES ---
function startDownload(url, btnElement) {
    const originalText = btnElement.innerText;
    let timeLeft = 3; 
    btnElement.disabled = true; btnElement.style.backgroundColor = "#94a3b8"; btnElement.style.cursor = "wait";
    btnElement.innerText = `Fetching File (${timeLeft}s)...`;
    const timer = setInterval(() => {
        timeLeft--;
        btnElement.innerText = `Fetching File (${timeLeft}s)...`;
        if (timeLeft <= 0) {
            clearInterval(timer);
            btnElement.style.backgroundColor = "#22c55e"; 
            btnElement.innerText = "Opening File... 🚀";
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

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

function addSupportButton() {
    const whatsappLink = "https://wa.link/15dowu"; 
    const btn = document.createElement('a');
    btn.href = whatsappLink;
    btn.target = "_blank";
    btn.className = "floating-btn";
    btn.innerHTML = `<span class="support-tooltip">Need Help?</span><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
    document.body.appendChild(btn);
    let scrollTimeout;
    const tooltip = btn.querySelector('.support-tooltip');
    window.addEventListener('scroll', () => {
        tooltip.classList.add('show');
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => { tooltip.classList.remove('show'); }, 3000);
    });
}
