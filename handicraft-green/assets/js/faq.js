document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.accordion-item .accordion-q').forEach(q => {
    q.addEventListener('click', () => {
      const item = q.closest('.accordion-item');
      const open = item.classList.contains('open');
      document.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('open'));
      if (!open) item.classList.add('open');
    });
  });
});

