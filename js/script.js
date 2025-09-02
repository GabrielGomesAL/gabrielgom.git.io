// Seletores
const menuHamburguer = document.querySelector('.menu-hamburguer');
const nav = document.querySelector('.nav');
const navLinks = document.querySelectorAll('.nav a');
const sections = document.querySelectorAll('section');
const header = document.querySelector('header');

// Função para alternar o menu hamburguer
menuHamburguer.addEventListener('click', () => {
    menuHamburguer.classList.toggle('active');
    nav.classList.toggle('active');
});

// Fechar o menu ao clicar em um link
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        if (nav.classList.contains('active')) {
            menuHamburguer.classList.remove('active');
            nav.classList.remove('active');
        }
    });
});

// Efeito de scroll suave para links internos
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        targetSection.scrollIntoView({ behavior: 'smooth' });
    });
});

// Adicionar classe ativa ao header ao rolar a página
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// Animação de revelação ao rolar a página
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.2
};

const observerCallback = (entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
};

const observer = new IntersectionObserver(observerCallback, observerOptions);

sections.forEach(section => {
    observer.observe(section);
});

// Efeito de digitação na home
const typedText = document.querySelector('.typed-text');
const textArray = ["Desenvolvedor", "Analista de Dados", "Analista de Sistemas"];
let textIndex = 0;
let charIndex = 0;

const type = () => {
    if (charIndex < textArray[textIndex].length) {
        typedText.textContent += textArray[textIndex].charAt(charIndex);
        charIndex++;
        setTimeout(type, 100);
    } else {
        setTimeout(erase, 2000);
    }
};

const erase = () => {
    if (charIndex > 0) {
        typedText.textContent = textArray[textIndex].substring(0, charIndex - 1);
        charIndex--;
        setTimeout(erase, 50);
    } else {
        textIndex++;
        if (textIndex >= textArray.length) textIndex = 0;
        setTimeout(type, 500);
    }
};

// Iniciar efeito de digitação após o carregamento da página
document.addEventListener('DOMContentLoaded', () => {
    if (typedText) {
        setTimeout(type, 1000);
    }
    
    // Inicializar filtro de competências
    initSkillsFilter();
});

// Efeito de luz que segue o mouse
document.addEventListener('mousemove', (e) => {
    const light = document.createElement('div');
    light.classList.add('light-effect');
    light.style.left = `${e.clientX}px`;
    light.style.top = `${e.clientY}px`;
    document.body.appendChild(light);

    setTimeout(() => {
        light.remove();
    }, 100);
});

// Configuração das partículas
particlesJS.load('particles-js', 'js/particles.json', function() {
    console.log('Partículas carregadas!');
});

// Filtro de competências
function initSkillsFilter() {
    const categoryButtons = document.querySelectorAll('.skill-category-btn');
    const skillItems = document.querySelectorAll('.skill-item');
    
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remover classe active de todos os botões
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            
            // Adicionar classe active ao botão clicado
            button.classList.add('active');
            
            // Filtrar competências
            const category = button.getAttribute('data-category');
            
            skillItems.forEach(item => {
                if (category === 'all' || item.getAttribute('data-category') === category) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });
    
    // Animar barras de progresso quando a seção de competências for visível
    const skillsSection = document.getElementById('skills');
    const skillProgresses = document.querySelectorAll('.skill-progress');
    
    const skillsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                skillProgresses.forEach(progress => {
                    const width = progress.style.width;
                    progress.style.width = '0';
                    setTimeout(() => {
                        progress.style.width = width;
                    }, 200);
                });
                skillsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    skillsObserver.observe(skillsSection);
}