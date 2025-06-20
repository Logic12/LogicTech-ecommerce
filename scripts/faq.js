document.querySelectorAll('.faq-question').forEach(question => {
    question.addEventListener('click', () => {
      const answer = question.nextElementSibling;
      answer.classList.toggle('hidden');
      question.classList.toggle('bg-gray-100');
    });
  });