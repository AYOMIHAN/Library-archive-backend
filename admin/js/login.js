// =========================================
// 1. CONFIGURATION
// =========================================
const SUPABASE_URL = 'https://tfjxfmjcmynwwhslzvdy.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_cEjENOV9eLIWWl9KshKojQ_jTnwFhoa'; 
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// =========================================
// 2. LOGIN LOGIC
// =========================================
async function handleLogin() {
    
    // 1. Get Input Values
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // 2. Get UI Elements
    const btnText = document.getElementById('btn-text');
    const errorMsg = document.getElementById('error-msg');
    const btn = document.getElementById('btn-login');

    // 3. Simple Validation
    if (!email || !password) {
        errorMsg.innerText = "Please enter both email and password.";
        errorMsg.style.display = 'block';
        return;
    }

    // 4. UI: Set to "Loading"
    btnText.innerText = "Verifying...";
    btn.disabled = true;
    btn.style.opacity = "0.7";
    errorMsg.style.display = 'none';

    // 5. Supabase Auth Request
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        // --- FAILURE ---
        console.error("Login Error:", error.message);
        btnText.innerText = "Sign In";
        btn.disabled = false;
        btn.style.opacity = "1";
        
        // Show user-friendly error
        errorMsg.innerText = "Invalid email or password.";
        errorMsg.style.display = 'block';
    } else {
        // --- SUCCESS ---
        console.log("Login Successful!", data);
        btnText.innerText = "Success! Redirecting...";
        errorMsg.style.display = 'none';
        
        // Wait 1 second so user sees the success message, then go to Admin
        setTimeout(() => {
            window.location.href = "admin.html";
        }, 1000);
    }
}

// =========================================
// 3. AUTO-REDIRECT (If already logged in)
// =========================================
async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        // If user is already logged in, send them straight to dashboard
        window.location.href = "admin.html";
    }
}

// Run check when page loads
checkSession();

