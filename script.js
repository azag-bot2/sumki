async function fetchProducts() {
    const apiKey = 'AIzaSyAu06E0G2h1Vq889D9xUdy0g9b7iMbEDy8';
    const spreadsheetId = '19giEpOOMuEPRjqHYGixUyXLiZViE8BdimxnKwADakDE';
    const range = 'сумочкиД!B2:J'; // Убедитесь, что имя листа правильное

    try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;
        console.log('Запрос:', url);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Ошибка API: ${errorData.error.message}`);
        }

        const data = await response.json();
        console.log('Данные:', data);

        if (!data.values || data.values.length === 0) {
            throw new Error('Данные не найдены в таблице');
        }

        const productsDiv = document.getElementById('products');
        productsDiv.innerHTML = '';

        data.values.forEach((row) => {
            // Перевіряємо чи є цифри в стовпці C (row[1])
            const hasNumberInColumnC = /\d/.test(row[1]);
            
            if (row[0] && row[3] && hasNumberInColumnC) { // Перевіряємо B, C та E
                const productDiv = document.createElement('div');
                productDiv.className = 'product';
                productDiv.innerHTML = `<strong>${row[0]}</strong> - ${row[3]} грн.`;
                productsDiv.appendChild(productDiv);
            }
        });

        // Додаємо обробку фільтрів
        const filterButtons = document.querySelectorAll('.filter-btn');
        let currentFilter = 'all';

        function filterProducts(category) {
            const productsDiv = document.getElementById('products');
            productsDiv.innerHTML = '';

            // Отримуємо всі вибрані фільтри
            const selectedFilters = {
                type: Array.from(document.querySelectorAll('input[data-filter="type"]:checked')).map(cb => cb.value),
                color: Array.from(document.querySelectorAll('input[data-filter="color"]:checked')).map(cb => cb.value),
                material: Array.from(document.querySelectorAll('input[data-filter="material"]:checked')).map(cb => cb.value),
                size: Array.from(document.querySelectorAll('input[data-filter="size"]:checked')).map(cb => cb.value),
                sale: Array.from(document.querySelectorAll('input[data-filter="sale"]:checked')).map(cb => cb.value)
            };

            data.values.forEach((row) => {
                const hasNumberInColumnC = /\d/.test(row[1]);
                let matchesFilters = true;

                // Перевіряємо основну категорію
                if (category !== 'all') {
                    matchesFilters = row[0].toLowerCase().includes(category.toLowerCase());
                }

                // Перевіряємо підфільтри, якщо вибрана категорія "сумки"
                if (category === 'сумки' && matchesFilters) {
                    // Перевіряємо кожну групу фільтрів
                    Object.entries(selectedFilters).forEach(([filterType, values]) => {
                        if (values.length > 0) {
                            const matchesAnyValue = values.some(value => 
                                row[0].toLowerCase().includes(value.toLowerCase())
                            );
                            matchesFilters = matchesFilters && matchesAnyValue;
                        }
                    });
                }

                if (row[0] && row[3] && hasNumberInColumnC && matchesFilters) {
                    const productDiv = document.createElement('div');
                    productDiv.className = 'product';
                    
                    // Перевіряємо наявність фотографій (стовпець J - індекс 8)
                    const photos = row[8] ? row[8].split(',').map(url => url.trim()) : [];
                    
                    let slideshowHTML = '';
                    if (photos.length > 0) {
                        slideshowHTML = `
                            <div class="product-slideshow">
                                <div class="slideshow-container">
                                    ${photos.map((photo, index) => `
                                        <div class="slide" style="display: ${index === 0 ? 'block' : 'none'}">
                                            <img src="${photo}" alt="Product photo ${index + 1}">
                                        </div>
                                    `).join('')}
                                </div>
                                ${photos.length > 1 ? `
                                    <button class="slide-nav prev">❮</button>
                                    <button class="slide-nav next">❯</button>
                                    <div class="slide-dots">
                                        ${photos.map((_, index) => `
                                            <span class="dot ${index === 0 ? 'active' : ''}" data-index="${index}"></span>
                                        `).join('')}
                                    </div>
                                ` : ''}
                            </div>`;
                    }

                    productDiv.innerHTML = `
                        ${slideshowHTML}
                        <div class="product-info">
                            <strong>${row[0]}</strong> - ${row[3]} грн.
                        </div>
                    `;

                    // Додаємо обробники для слайдера, якщо є фото
                    if (photos.length > 1) {
                        const slideshow = productDiv.querySelector('.product-slideshow');
                        const slides = slideshow.querySelectorAll('.slide');
                        const dots = slideshow.querySelectorAll('.dot');
                        const prevBtn = slideshow.querySelector('.prev');
                        const nextBtn = slideshow.querySelector('.next');
                        let currentSlide = 0;

                        function showSlide(n) {
                            slides.forEach(slide => slide.style.display = 'none');
                            dots.forEach(dot => dot.classList.remove('active'));
                            slides[n].style.display = 'block';
                            dots[n].classList.add('active');
                            currentSlide = n;
                        }

                        prevBtn?.addEventListener('click', () => {
                            const newIndex = currentSlide > 0 ? currentSlide - 1 : slides.length - 1;
                            showSlide(newIndex);
                        });

                        nextBtn?.addEventListener('click', () => {
                            const newIndex = currentSlide < slides.length - 1 ? currentSlide + 1 : 0;
                            showSlide(newIndex);
                        });

                        dots.forEach((dot, index) => {
                            dot.addEventListener('click', () => showSlide(index));
                        });
                    }

                    productsDiv.appendChild(productDiv);
                }
            });
        }

        // Додаємо обробники подій для чекбоксів
        document.querySelectorAll('.sub-filter-group input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const currentCategory = document.querySelector('.filter-btn.active').dataset.category;
                filterProducts(currentCategory);
            });
        });

        // Модифікуємо обробку відкриття/закриття підкатегорій
        document.querySelector('[data-category="сумки"]').addEventListener('click', function(e) {
            e.preventDefault(); // Запобігаємо стандартній поведінці
            this.closest('.filter-group').classList.toggle('active');
        });

        // Оновлюємо обробники подій для кнопок фільтрів
        filterButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const isSumkyButton = button.dataset.category === 'сумки';
                
                // Оновлюємо активний клас тільки якщо це не кнопка "Сумки"
                if (!isSumkyButton) {
                    filterButtons.forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                    currentFilter = button.dataset.category;
                    filterProducts(currentFilter);
                    
                    // Закриваємо фільтри тільки для не-сумок на мобільних
                    if (window.innerWidth <= 768) {
                        filtersAside.classList.remove('active');
                    }
                }
            });
        });

        // Окремий обробник для кнопки "Сумки"
        const sumkyButton = document.querySelector('[data-category="сумки"]');
        sumkyButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Зупиняємо подальше розповсюдження події
            
            // Активуємо кнопку "Сумки"
            filterButtons.forEach(btn => btn.classList.remove('active'));
            sumkyButton.classList.add('active');
            currentFilter = 'сумки';
            filterProducts(currentFilter);
            
            // Перемикаємо відображення підфільтрів без закриття мобільного меню
            const filterGroup = sumkyButton.closest('.filter-group');
            filterGroup.classList.toggle('active');
            
            // Забезпечуємо, щоб мобільне меню залишалося відкритим
            if (window.innerWidth <= 768) {
                filtersAside.classList.add('active');
            }
        });

        // Модифікуємо обробники для інших кнопок фільтрів
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                const isSumkyButton = button.dataset.category === 'сумки';
                
                // Закриваємо фільтри після вибору тільки для не-сумок на мобільному
                if (window.innerWidth <= 768 && !isSumkyButton) {
                    filtersAside.classList.remove('active');
                }
            });
        });

        // Початкова фільтрація
        filterProducts('all');

        // Додаємо обробку мобільного меню
        const filterToggle = document.getElementById('filterToggle');
        const filtersAside = document.querySelector('.filters');
        const container = document.querySelector('.container');

        filterToggle.addEventListener('click', () => {
            filtersAside.classList.toggle('active');
        });

        // Закриваємо фільтри при кліку поза ними
        document.addEventListener('click', (e) => {
            if (!filtersAside.contains(e.target) && 
                !filterToggle.contains(e.target) && 
                window.innerWidth <= 768) {
                filtersAside.classList.remove('active');
            }
        });

        // Оновлюємо обробник кліків поза фільтрами
        document.addEventListener('click', (e) => {
            const filtersAside = document.querySelector('.filters');
            const filterToggle = document.getElementById('filterToggle');
            const sumkyButton = document.querySelector('[data-category="сумки"]');
            const filterGroup = sumkyButton.closest('.filter-group');
            
            // Перевіряємо, чи клік був не по фільтрах і не по кнопках
            if (!filtersAside.contains(e.target) && 
                !filterToggle.contains(e.target) && 
                window.innerWidth <= 768) {
                filtersAside.classList.remove('active');
            }
        });

        // Закриваємо фільтри після вибору на мобільному
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    filtersAside.classList.remove('active');
                }
            });
        });

    } catch (error) {
        console.error('Помилка:', error);
        document.getElementById('products').innerHTML = 
            `<div style="color: red; text-align: center;">
                ${error.message}<br>
                Перевірте налаштування API або доступ до таблиці
            </div>`;
    }
}

// Додаємо обробник зміни розміру вікна
window.addEventListener('resize', () => {
    const filtersAside = document.querySelector('.filters');
    if (window.innerWidth > 768) {
        filtersAside.classList.remove('active');
    }
});

window.onload = fetchProducts;