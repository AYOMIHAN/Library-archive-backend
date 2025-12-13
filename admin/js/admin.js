// =========================================
// 1. CONFIGURATION & AUTH
// =========================================

// Replace these with your actual Supabase Project details
const SUPABASE_URL = 'https://tfjxfmjcmynwwhslzvdy.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_cEjENOV9eLIWWl9KshKojQ_jTnwFhoa'; 
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Check if user is logged in
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
        // Not logged in? Kick them to login page
        window.location.href = "login.html";
    } else {
        // Logged in? Load the data
        console.log("Admin logged in.");
        loadStats();
        loadMaterials();
        loadBlogs();
    }
}

// Run check immediately
checkAuth();

// Logout Function
async function logout() {
    await supabase.auth.signOut();
    window.location.href = "login.html";
}


// =========================================
// 2. UI LOGIC (Tabs & Modals)
// =========================================

// Switch between Overview, Materials, and Blogs
function switchTab(viewId, navItem) {
    // 1. Hide all views
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    
    // 2. Show target view
    document.getElementById('view-' + viewId).classList.add('active');
    
    // 3. Update Sidebar Active State
    document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));
    navItem.classList.add('active');

    // 4. Update Header Title
    const titles = { 
        'overview': 'Overview', 
        'materials': 'Materials Manager', 
        'blogs': 'Blog Posts' 
    };
    document.getElementById('page-title').innerText = titles[viewId];
}

// Open a Modal (Popup)
function openModal(id) { 
    document.getElementById(id).classList.add('active'); 
}

// Close a Modal (With Safety Check)
function closeModal(id) {
    let hasUnsavedData = false;

    // A. Check UPLOAD Modal for data
    if (id === 'modal-upload') {
        if (document.getElementById('file-upload').value || 
            document.getElementById('m-title').value || 
            document.getElementById('m-code').value) {
            hasUnsavedData = true;
        }
    }

    // B. Check BLOG Modal for data
    if (id === 'modal-blog') {
        if (document.getElementById('b-title').value || 
            document.getElementById('b-content').value) {
            hasUnsavedData = true;
        }
    }

    // C. Trigger Warning if data exists
    if (hasUnsavedData) {
        const confirmDiscard = confirm("⚠️ You have unsaved changes!\n\nAre you sure you want to close? Your work will be lost.");
        if (!confirmDiscard) return; // Stop if they click Cancel
    }

    // D. Actually Close
    document.getElementById(id).classList.remove('active');
    
    // E. Cleanup Forms
    if (id === 'modal-upload') resetUploadForm();
    if (id === 'modal-blog') resetBlogForm();
}

// Helper: Clear Upload Form
function resetUploadForm() {
    document.getElementById('file-upload').value = "";
    document.getElementById('m-title').value = "";
    document.getElementById('m-code').value = "";
    document.getElementById('upload-status').style.display = 'none';
}

// Helper: Clear Blog Form
function resetBlogForm() {
    document.getElementById('b-id').value = "";
    document.getElementById('b-title').value = "";
    document.getElementById('b-image').value = "";
    document.getElementById('b-content').value = "";
    document.getElementById('b-category').value = "News";
    
    // Reset Header Text (in case we were editing)
    document.getElementById('blog-modal-title').innerText = "Write New Post";
    document.getElementById('btn-save-blog').innerText = "Publish Post";
}


// =========================================
// 3. SERVERLESS UPLOAD LOGIC
// =========================================

async function uploadAndSaveMaterial() {
    const fileInput = document.getElementById('file-upload');
    const statusBox = document.getElementById('upload-status');
    const file = fileInput.files[0];

    // Validation
    if (!file) return alert("Please select a PDF file first.");
    if (file.type !== 'application/pdf') return alert("Only PDF files are allowed.");

    // UI Updates
    statusBox.style.display = 'block';
    statusBox.style.background = '#eff6ff'; // Blue
    statusBox.style.color = '#2563eb';
    statusBox.innerText = "⏳ Step 1: Requesting secure permission...";

    try {
        // 1. Clean filename (remove spaces)
        const cleanName = file.name.replace(/\s+/g, '_'); 

        // 2. Call Netlify Function to get Signed URL
        // (This keeps your API keys hidden on the server)
        const response = await fetch('/.netlify/functions/upload-url', {
            method: 'POST',
            body: JSON.stringify({ fileName: cleanName, fileType: file.type })
        });

        if (!response.ok) throw new Error("Permission Denied or Netlify Function missing.");
        
        const { uploadURL } = await response.json();

        // 3. Upload directly to Cloudflare R2
        statusBox.innerText = "☁️ Step 2: Uploading to Cloud...";
        
        const uploadRes = await fetch(uploadURL, {
            method: 'PUT',
            body: file,
            headers: { 'Content-Type': file.type }
        });

        if (!uploadRes.ok) throw new Error("Upload to Cloud failed.");

        // 4. Save Metadata to Supabase
        statusBox.innerText = "💾 Step 3: Saving to Database...";
        
        const { error } = await supabase.from('materials').insert({
            title: document.getElementById('m-title').value,
            course_code: document.getElementById('m-code').value,
            school: document.getElementById('m-school').value,
            category: document.getElementById('m-category').value,
            level: document.getElementById('m-level').value,
            semester: document.getElementById('m-sem').value,
            file_type: 'PDF',
            file_size: (file.size / 1024 / 1024).toFixed(2) + " MB",
            download_url: cleanName // We save just the filename
        });

        if (error) throw error;

        // 5. Success
        statusBox.style.background = '#dcfce7'; // Green
        statusBox.style.color = '#166534';
        statusBox.innerText = "✅ Upload Complete!";
        
        // Refresh Table & Close Modal
        loadMaterials();
        loadStats();
        setTimeout(() => {
            // Close without warning since it's saved
            document.getElementById('modal-upload').classList.remove('active');
            resetUploadForm();
        }, 1500);

    } catch (error) {
        console.error(error);
        statusBox.style.background = '#fee2e2'; // Red
        statusBox.style.color = '#ef4444';
        statusBox.innerText = "❌ Error: " + error.message;
    }
}


// =========================================
// 4. DATA LOADING (Stats, Tables, Blogs)
// =========================================

// A. Load Statistics
async function loadStats() {
    // Count Materials
    const { count: fileCount } = await supabase
        .from('materials')
        .select('*', { count: 'exact', head: true });
        
    // Count Blogs
    const { count: blogCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true });
    
    // Sum Downloads (Fetch just downloads column)
    const { data: files } = await supabase.from('materials').select('downloads');
    const totalDL = files ? files.reduce((sum, item) => sum + (item.downloads || 0), 0) : 0;

    // Update UI
    document.getElementById('stat-files').innerText = fileCount || 0;
    document.getElementById('stat-blogs').innerText = blogCount || 0;
    document.getElementById('stat-downloads').innerText = totalDL.toLocaleString();
}

// B. Load Materials Table
async function loadMaterials() {
    const tbody = document.getElementById('materials-table-body');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">Loading...</td></tr>';

    const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error(error);
        tbody.innerHTML = '<tr><td colspan="5" style="color:red">Error loading data</td></tr>';
        return;
    }
    
    tbody.innerHTML = ""; // Clear loader

    data.forEach(item => {
        tbody.innerHTML += `
            <tr>
                <td>${item.title}</td>
                <td><span class="badge">${item.course_code}</span></td>
                <td>${item.category}</td>
                <td>${new Date(item.created_at).toLocaleDateString()}</td>
                <td class="actions-cell">
                    <button class="btn-icon danger" onclick="deleteMaterial('${item.id}')" title="Delete">
                        <i class="ph ph-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
}

// C. Delete Material
async function deleteMaterial(id) {
    if(confirm("Are you sure? This removes the record from the database. (The file remains in cloud storage).")) {
        await supabase.from('materials').delete().eq('id', id);
        loadMaterials(); // Refresh table
        loadStats();     // Refresh stats
    }
}

// D. Load Blogs Grid
async function loadBlogs() {
    const grid = document.getElementById('blog-grid');
    grid.innerHTML = '<p>Loading posts...</p>';

    const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return console.error(error);

    grid.innerHTML = "";

    data.forEach(post => {
        // Safe title string for onclick
        const safeId = post.id;
        
        grid.innerHTML += `
            <div class="blog-admin-card">
                <div class="blog-meta">
                    <span class="badge success">${post.category}</span>
                    <span class="date">${new Date(post.created_at).toLocaleDateString()}</span>
                </div>
                <h4>${post.title}</h4>
                <div class="blog-actions">
                    <button class="btn-text" onclick="prepareEdit('${safeId}')">Edit</button>
                    <button class="btn-text danger" onclick="deleteBlog('${safeId}')">Delete</button>
                </div>
            </div>
        `;
    });
}

// E. Blog Management (Create / Update)
async function saveBlog() {
    const id = document.getElementById('b-id').value;
    const title = document.getElementById('b-title').value;
    const content = document.getElementById('b-content').value;
    const image = document.getElementById('b-image').value;
    const category = document.getElementById('b-category').value;
    const btn = document.getElementById('btn-save-blog');

    if(!title || !content) return alert("Title and Content are required.");

    btn.innerText = "Saving...";
    btn.disabled = true;

    let error;

    if (id) {
        // UPDATE Existing Post
        const res = await supabase
            .from('posts')
            .update({ title, content, image_url: image, category })
            .eq('id', id);
        error = res.error;
    } else {
        // INSERT New Post
        const res = await supabase
            .from('posts')
            .insert({ title, content, image_url: image, category });
        error = res.error;
    }

    btn.innerText = "Publish Post";
    btn.disabled = false;

    if (error) {
        alert("Error: " + error.message);
    } else {
        // Success
        resetBlogForm();
        // Remove active class manually to skip warning since we saved
        document.getElementById('modal-blog').classList.remove('active');
        loadBlogs();
        loadStats();
    }
}

// F. Prepare Edit (Fill form with existing data)
async function prepareEdit(id) {
    const { data } = await supabase.from('posts').select('*').eq('id', id).single();
    
    if(data) {
        // Fill form fields
        document.getElementById('b-id').value = data.id;
        document.getElementById('b-title').value = data.title;
        document.getElementById('b-image').value = data.image_url;
        document.getElementById('b-category').value = data.category;
        document.getElementById('b-content').value = data.content;
        
        // Update Modal UI
        document.getElementById('blog-modal-title').innerText = "Edit Post";
        document.getElementById('btn-save-blog').innerText = "Update Post";
        
        openModal('modal-blog');
    }
}

// G. Delete Blog
async function deleteBlog(id) {
    if(confirm("Delete this post permanently?")) {
        await supabase.from('posts').delete().eq('id', id);
        loadBlogs();
        loadStats();
    }
}

// =========================================
// 5. UTILITIES
// =========================================

// Search Filter for Materials Table
function filterMaterials() {
    const filter = document.getElementById('material-search').value.toUpperCase();
    const rows = document.getElementById('materials-table-body').getElementsByTagName('tr');
    
    for (let i = 0; i < rows.length; i++) {
        // Get text from Title (col 0) and Code (col 1)
        const titleCol = rows[i].getElementsByTagName("td")[0];
        const codeCol = rows[i].getElementsByTagName("td")[1];
        
        if (titleCol && codeCol) {
            const txtValue = titleCol.textContent || titleCol.innerText;
            const codeValue = codeCol.textContent || codeCol.innerText;
            
            if (txtValue.toUpperCase().indexOf(filter) > -1 || codeValue.toUpperCase().indexOf(filter) > -1) {
                rows[i].style.display = "";
            } else {
                rows[i].style.display = "none";
            }
        }
    }
              }
                                           
