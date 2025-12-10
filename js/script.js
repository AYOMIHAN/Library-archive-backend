// 1. HAMBURGER MENU LOGIC
const hamburger = document.getElementById('hamburger');
const mobileNav = document.getElementById('mobileNav');
const bars = document.querySelectorAll('.bar');

if (hamburger) {
    hamburger.addEventListener('click', () => {
        mobileNav.classList.toggle('active');
        
        // Animate Hamburger to X
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

// 2. INJECT FLOATING BUTTON
function addSupportButton() {
    // YOUR SHORT LINK 👇
    const whatsappLink = "https://wa.link/15dowu"; 
    
    const btn = document.createElement('a');
    btn.href = whatsappLink;
    btn.target = "_blank";
    btn.className = "floating-btn";
    btn.setAttribute('aria-label', 'Contact Support');
    
    btn.innerHTML = `
        <span class="support-tooltip">Need Help?</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
    `;

    document.body.appendChild(btn);

    // 3. SCROLL INTERACTION
    let scrollTimeout;
    const tooltip = btn.querySelector('.support-tooltip');

    window.addEventListener('scroll', () => {
        tooltip.classList.add('show');
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            tooltip.classList.remove('show');
        }, 3000);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    addSupportButton();
});
