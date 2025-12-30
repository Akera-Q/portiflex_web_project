/**
 * ============================================================
 * PortiFlex Landing Page - jQuery Script
 * Requirement: jQuery (Weight: 1)
 * ============================================================
 */

$(document).ready(function () {
    console.log('Landing page jQuery initialized - Version:', $.fn.jquery);

    // ================================
    // Load content from JSON using jQuery AJAX
    // ================================
    $.getJSON('content.json', function (data) {
        // Hero Section with jQuery animations
        $('#hero-title').text(data.hero.title).hide().fadeIn(500);
        $('#hero-subtitle').text(data.hero.subtitle).hide().fadeIn(700);
        $('#cta-guest-text').text(data.hero.ctaGuest);
        $('#cta-login-text').text(data.hero.ctaLogin);

        // Features Section
        $('#features-title').text(data.features.title);

        // Generate Feature Cards using jQuery $.each()
        const $featuresGrid = $('#features-grid');
        $featuresGrid.empty();

        $.each(data.features.items, function (index, item) {
            const $card = $('<div>')
                .addClass('feature-card')
                .css({ opacity: 0 })
                .html(`
                    <div class="feature-icon">${item.icon}</div>
                    <h3 class="feature-title">${item.title}</h3>
                    <p class="feature-desc">${item.desc}</p>
                `);

            $featuresGrid.append($card);

            // jQuery animation with delay
            $card.delay(index * 100).animate({ opacity: 1 }, 500);
        });

        // Footer
        $('#footer-text').text(data.footer.text);

    }).fail(function () {
        console.error("Could not load content.json");
        $('#hero-title').text("PortiFlex");
        $('#hero-subtitle').text("Failed to load content. Please check console.");
    });

    // ================================
    // Button Click Handlers with jQuery
    // ================================

    // Guest button - go directly to app
    $('#cta-guest').on('click', function () {
        $(this).addClass('btn-clicked');
        setTimeout(function () {
            window.location.href = 'app.html';
        }, 200);
    });

    // Login button - go to app with auth modal
    $('#cta-login').on('click', function () {
        $(this).addClass('btn-clicked');
        setTimeout(function () {
            window.location.href = 'app.html?showAuth=true';
        }, 200);
    });

    // ================================
    // Smooth Scroll with jQuery animate()
    // ================================
    $('a[href^="#"]').on('click', function (event) {
        event.preventDefault();
        const target = $($.attr(this, 'href'));
        if (target.length) {
            $('html, body').animate({
                scrollTop: target.offset().top - 100
            }, 500);
        }
    });

    // ================================
    // jQuery Hover Effects
    // ================================

    // Feature cards hover
    $(document).on('mouseenter', '.feature-card', function () {
        $(this).stop().animate({ 'margin-top': '-5px' }, 200);
    }).on('mouseleave', '.feature-card', function () {
        $(this).stop().animate({ 'margin-top': '0px' }, 200);
    });

    // Testimonial cards hover
    $(document).on('mouseenter', '.testimonial-card', function () {
        $(this).css('transform', 'scale(1.02)');
    }).on('mouseleave', '.testimonial-card', function () {
        $(this).css('transform', 'scale(1)');
    });

    // ================================
    // Navbar scroll effect with jQuery
    // ================================
    $(window).on('scroll', function () {
        if ($(this).scrollTop() > 50) {
            $('.navbar').addClass('navbar-scrolled');
        } else {
            $('.navbar').removeClass('navbar-scrolled');
        }
    });

    // ================================
    // jQuery fade-in on scroll
    // ================================
    $(window).on('scroll', function () {
        $('.feature-card, .testimonial-card').each(function () {
            const elementTop = $(this).offset().top;
            const windowBottom = $(window).scrollTop() + $(window).height();
            if (windowBottom > elementTop + 50) {
                $(this).addClass('visible');
            }
        });
    });

    console.log('Landing page jQuery handlers attached');
});
