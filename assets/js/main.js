// Intersection Observer for scroll-triggered reveals
(function() {
  'use strict';

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -80px 0px'
  });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  // Stagger project cards on home page
  const projectCards = document.querySelectorAll('.project-card');
  if (projectCards.length) {
    const projectObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '0';
          entry.target.style.transform = 'translateY(20px)';
          entry.target.style.transition = `opacity 700ms var(--ease-out-expo) ${index * 80}ms, transform 700ms var(--ease-out-expo) ${index * 80}ms`;
          requestAnimationFrame(() => {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          });
          projectObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    projectCards.forEach(card => projectObserver.observe(card));
  }
})();
