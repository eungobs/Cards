/* ========================================
   MAMAILA UNVEILING - MAIN JAVASCRIPT
   ======================================== */

// ========== PRELOADER ==========
window.addEventListener('load', function () {
    var preloader = document.getElementById('preloader');
    if (preloader) {
        setTimeout(function () {
            preloader.classList.add('hidden');
        }, 1500);
    }
});

// ========== SLIDESHOW - VIDEO-LIKE ROTATION ==========
(function () {
    var slides = document.querySelectorAll('.slideshow .slide');
    var currentSlide = 0;
    var slideInterval = 5000; // 5 seconds per slide
    var fadeTime = 1500; // 1.5 second crossfade

    if (slides.length === 0) return;

    // Remove all CSS animations so JS controls everything
    slides.forEach(function (slide) {
        slide.style.animation = 'none';
        slide.style.opacity = '0';
        slide.style.transition = 'opacity ' + (fadeTime / 1000) + 's ease-in-out';
        slide.style.position = 'absolute';
        slide.style.top = '0';
        slide.style.left = '0';
        slide.style.width = '100%';
        slide.style.height = '100%';

        // Remove CSS animation from img too
        var img = slide.querySelector('img');
        if (img) {
            img.style.animation = 'none';
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            img.style.transition = 'transform ' + (slideInterval / 1000) + 's ease-in-out';
            img.style.transform = 'scale(1) translate(0, 0)';
        }
    });

    // Ken Burns zoom directions - different for each slide
    var zoomEffects = [
        { from: 'scale(1) translate(0, 0)', to: 'scale(1.2) translate(-3%, -3%)' },
        { from: 'scale(1.1) translate(3%, 0)', to: 'scale(1.25) translate(-2%, 3%)' },
        { from: 'scale(1.15) translate(-2%, 2%)', to: 'scale(1) translate(2%, -2%)' },
        { from: 'scale(1) translate(0, 0)', to: 'scale(1.2) translate(3%, 2%)' }
    ];

    // Show the first slide immediately
    function showSlide(index) {
        var slide = slides[index];
        var img = slide.querySelector('img');
        var effectIndex = index % zoomEffects.length;

        // Reset zoom to starting position
        if (img) {
            img.style.transition = 'none';
            img.style.transform = zoomEffects[effectIndex].from;

            // Force reflow so transition resets
            void img.offsetWidth;

            // Start Ken Burns zoom
            img.style.transition = 'transform ' + (slideInterval / 1000) + 's ease-in-out';
            img.style.transform = zoomEffects[effectIndex].to;
        }

        // Fade in
        slide.style.opacity = '1';
    }

    // Hide a slide
    function hideSlide(index) {
        slides[index].style.opacity = '0';
    }

    // Start with first slide
    showSlide(0);

    // Rotate slides like a video
    function rotateSlides() {
        var nextSlide = (currentSlide + 1) % slides.length;

        // Fade in next slide
        showSlide(nextSlide);

        // Fade out current slide after overlap
        var prevSlide = currentSlide;
        setTimeout(function () {
            hideSlide(prevSlide);
        }, fadeTime);

        currentSlide = nextSlide;
    }

    // Auto-rotate
    var slideshowTimer = setInterval(rotateSlides, slideInterval);

    // Pause slideshow when page is hidden, resume when visible
    document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
            clearInterval(slideshowTimer);
        } else {
            slideshowTimer = setInterval(rotateSlides, slideInterval);
        }
    });
})();

// ========== BACKGROUND MUSIC ==========
var musicBtn = document.getElementById('music-btn');
var bgMusic = document.getElementById('bg-music');
var playIcon = null;
var pauseIcon = null;
var isPlaying = false;

if (musicBtn && bgMusic) {
    playIcon = musicBtn.querySelector('.play-icon');
    pauseIcon = musicBtn.querySelector('.pause-icon');

    // Set initial volume (soft for memorial)
    bgMusic.volume = 0.25;

    musicBtn.addEventListener('click', function () {
        if (isPlaying) {
            // Pause music
            bgMusic.pause();
            if (playIcon) playIcon.style.display = 'inline';
            if (pauseIcon) pauseIcon.style.display = 'none';
            musicBtn.classList.remove('playing');
            isPlaying = false;
        } else {
            // Play music
            bgMusic.play().then(function () {
                if (playIcon) playIcon.style.display = 'none';
                if (pauseIcon) pauseIcon.style.display = 'inline';
                musicBtn.classList.add('playing');
                isPlaying = true;
            }).catch(function (error) {
                console.log('Autoplay prevented:', error);
                alert('Click the music button to play background music.');
            });
        }
    });
}

// ========== RSVP FORM ==========
var rsvpForm = document.getElementById('rsvp-form');
var attendeesSelect = document.getElementById('attendees');
var additionalGuestGroup = document.getElementById('additionalGuestGroup');
var successMessage = document.getElementById('success-message');
var openRsvpBtn = document.getElementById('open-rsvp-btn');
var rsvpBtnWrapper = document.getElementById('rsvp-btn-wrapper');

// Show RSVP form when button is clicked
if (openRsvpBtn && rsvpForm) {
    openRsvpBtn.addEventListener('click', function () {
        rsvpForm.style.display = 'block';
        if (rsvpBtnWrapper) {
            rsvpBtnWrapper.style.display = 'none';
        }
        rsvpForm.scrollIntoView({ behavior: 'smooth' });
    });
}

// Show/hide additional guest field based on attendee count
if (attendeesSelect && additionalGuestGroup) {
    attendeesSelect.addEventListener('change', function () {
        if (this.value === '2') {
            additionalGuestGroup.style.display = 'block';
        } else {
            additionalGuestGroup.style.display = 'none';
            var guestNameInput = document.getElementById('guestName');
            if (guestNameInput) {
                guestNameInput.value = '';
            }
        }
    });
}

// Generate unique ID
function generateUniqueId() {
    return 'rsvp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Format date for display
function formatDate(date) {
    var options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('en-ZA', options);
}

// Save RSVP to Local Storage safely
function saveRSVP(data) {
    var rsvpList = [];

    try {
        var storedData = localStorage.getItem('mamailaUnveilingRSVPs');
        if (storedData) {
            rsvpList = JSON.parse(storedData);
        }
    } catch (error) {
        console.log('LocalStorage parse error:', error);
        rsvpList = [];
    }

    if (!Array.isArray(rsvpList)) {
        rsvpList = [];
    }

    rsvpList.push(data);

    try {
        localStorage.setItem('mamailaUnveilingRSVPs', JSON.stringify(rsvpList));
    } catch (error) {
        console.log('LocalStorage save error:', error);
    }
}

// Form submission handler
if (rsvpForm) {
    rsvpForm.addEventListener('submit', function (e) {
        e.preventDefault();

        // Get elements safely
        var fullNameEl = document.getElementById('fullName');
        var emailEl = document.getElementById('email');
        var phoneEl = document.getElementById('phone');
        var attendeesEl = document.getElementById('attendees');
        var attendingRadio = document.querySelector('input[name="attending"]:checked');

        var fullName = fullNameEl ? fullNameEl.value.trim() : '';
        var email = emailEl ? emailEl.value.trim() : '';
        var phone = phoneEl ? phoneEl.value.trim() : '';
        var attendees = attendeesEl ? attendeesEl.value : '';

        // Validate required fields
        if (!fullName || !email || !phone || !attendees || !attendingRadio) {
            alert('Please fill in all required fields.');
            return;
        }

        // Get optional elements safely
        var guestNameEl = document.getElementById('guestName');
        var relationshipEl = document.getElementById('relationship');
        var dietaryEl = document.getElementById('dietary');
        var messageEl = document.getElementById('message');

        // Collect form data
        var formData = {
            id: generateUniqueId(),
            fullName: fullName,
            email: email,
            phone: phone,
            attendees: parseInt(attendees) || 1,
            guestName: guestNameEl ? guestNameEl.value.trim() : '',
            relationship: relationshipEl ? relationshipEl.value || 'Not specified' : 'Not specified',
            dietary: dietaryEl ? dietaryEl.value.trim() || 'None' : 'None',
            message: messageEl ? messageEl.value.trim() : '',
            attending: attendingRadio.value === 'yes',
            submittedAt: new Date().toISOString(),
            formattedDate: formatDate(new Date())
        };

        // Save to Local Storage
        saveRSVP(formData);

        // Show success message
        if (successMessage) {
            rsvpForm.style.display = 'none';
            successMessage.style.display = 'block';
            successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        console.log('RSVP Submitted:', formData);
    });
}

// ========== SCROLL ANIMATIONS ==========
var observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

if ('IntersectionObserver' in window) {
    var sectionObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    document.querySelectorAll('section').forEach(function (section) {
        sectionObserver.observe(section);
    });
}

// ========== SMOOTH SCROLL FOR ANCHOR LINKS ==========
document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        var target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ========== PHONE NUMBER FORMATTING ==========
var phoneInput = document.getElementById('phone');

if (phoneInput) {
    phoneInput.addEventListener('input', function (e) {
        var value = e.target.value.replace(/\D/g, '');

        if (value.length > 10) {
            value = value.slice(0, 10);
        }

        if (value.length >= 3 && value.length < 6) {
            value = value.slice(0, 3) + ' ' + value.slice(3);
        } else if (value.length >= 6) {
            value = value.slice(0, 3) + ' ' + value.slice(3, 6) + ' ' + value.slice(6);
        }

        e.target.value = value;
    });
}

// ========== EMAIL VALIDATION ==========
var emailInput = document.getElementById('email');

if (emailInput) {
    emailInput.addEventListener('blur', function (e) {
        var email = e.target.value.trim();
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (email && !emailRegex.test(email)) {
            e.target.style.borderColor = '#e74c3c';
        } else {
            e.target.style.borderColor = '';
        }
    });
}

// ========== FORM INPUT ANIMATIONS ==========
var formInputs = document.querySelectorAll('#rsvp-form input, #rsvp-form select, #rsvp-form textarea');

if (formInputs.length > 0) {
    formInputs.forEach(function (input) {
        input.addEventListener('focus', function () {
            if (input.parentElement) {
                input.parentElement.classList.add('focused');
            }
        });

        input.addEventListener('blur', function () {
            if (input.parentElement) {
                input.parentElement.classList.remove('focused');
            }
        });
    });
}

// ========== KEYBOARD NAVIGATION ==========
document.addEventListener('keydown', function (e) {
    if (e.key === 'm' || e.key === 'M') {
        if (document.activeElement.tagName !== 'INPUT' &&
            document.activeElement.tagName !== 'TEXTAREA') {
            if (musicBtn) {
                musicBtn.click();
            }
        }
    }
});

// ========== PAGE VISIBILITY - PAUSE MUSIC WHEN TAB HIDDEN ==========
document.addEventListener('visibilitychange', function () {
    if (document.hidden && isPlaying) {
        if (bgMusic) bgMusic.pause();
        if (playIcon) playIcon.style.display = 'inline';
        if (pauseIcon) pauseIcon.style.display = 'none';
        if (musicBtn) musicBtn.classList.remove('playing');
        isPlaying = false;
    }
});

// ========== ERROR HANDLING ==========
window.addEventListener('error', function (e) {
    console.error('An error occurred:', e.message);
});

// ========== CONSOLE MESSAGE ==========
console.log('%c In Loving Memory of Magret Mamaila ',
    'background: #d4af37; color: #1a1a2e; font-size: 16px; padding: 10px; font-family: serif;');
console.log('%c 1955 - 2025 ',
    'color: #8b7355; font-size: 12px;');