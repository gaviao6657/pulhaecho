// --- CONFIGURAÇÃO OBRIGATÓRIA (CHAVES SUPABASE) ---
const SUPABASE_URL = 'https://khyjbzjycgqhthtcszwn.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoeWpiemp5Y2dxaHRodGNzenduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyMTMzMDMsImV4cCI6MjA3Nzc4OTMwM30.VAGIBs1bx1cLx0D3rnnSoNDLcIFgolmGTriy5WPn_GM'; 

// --- NOVAS CONFIGURAÇÕES ---

// ⚠️ ATENÇÃO: SUBSTITUA ESTES 3 URLS PELOS SEUS URLS REAIS DO SUPABASE STORAGE!
const BACKGROUND_IMAGES = [
    "https://khyjbzjycgqhthtcszwn.supabase.co/storage/v1/object/public/capas/public%20(29).jpg", 
    "https://khyjbzjycgqhthtcszwn.supabase.co/storage/v1/object/public/capas/public%20(28).jpg", 
    "https://khyjbzjycgqhthtcszwn.supabase.co/storage/v1/object/public/capas/public%20(30).jpg"
];
// Tempo de Amostra (em milissegundos). 30000ms = 30 segundos
const PREVIEW_DURATION = 30000; 

// Perguntas Frequentes (FAQs)
const FAQS = [
    { question: "O beat no site é a versão completa?", answer: "Não. O beat de pré-visualização no site é uma amostra (preview) com duração limitada para fins de demonstração (30 segundos). A versão completa (sem tags e com alta qualidade) é obtida após a compra no Gumroad." },
    { question: "Quais são os direitos de uso incluídos na compra?", answer: "A compra inclui a licença padrão (Leasing Rights), que permite o uso em músicas, vídeos e performances. Para uso exclusivo ou ilimitado, entre em contacto connosco para discutirmos a licença exclusiva." },
    { question: "Posso usar a minha própria voz na música?", answer: "Sim, claro! Os beats são instrumentais prontos para você gravar as suas vozes por cima. A licença permite o uso vocal." },
    { question: "Como recebo os ficheiros após a compra?", answer: "Assim que o pagamento for processado pelo Gumroad, você receberá um link de download imediato para os ficheiros em alta qualidade (geralmente WAV e MP3 Tagless)." }
];

// --- INICIALIZAÇÃO DO SUPABASE ---
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- ESTADO GLOBAL DO ÁUDIO ---
let currentSound = null;
let currentBeatId = null;
let currentButton = null;
let previewTimer = null;


// ====================================================================
// 1. FUNÇÕES DO BACKGROUND DINÂMICO
// ====================================================================

let currentImageIndex = 0;
const backgroundElement = document.getElementById('dynamic-background');

function rotateBackgrounds() {
    if (BACKGROUND_IMAGES.length === 0) return;

    // Atualiza a imagem de fundo
    backgroundElement.style.backgroundImage = `url('${BACKGROUND_IMAGES[currentImageIndex]}')`;
    
    // Avança para a próxima imagem (loop)
    currentImageIndex = (currentImageIndex + 1) % BACKGROUND_IMAGES.length;

    // Define a próxima rotação após 10 segundos
    setTimeout(rotateBackgrounds, 10000); 
}

// ====================================================================
// 2. FUNÇÕES DO PLAYER DE ÁUDIO (AGORA COM LIMITE DE TEMPO)
// ====================================================================

// Para a música atual e reinicia o botão
function stopCurrentSound() {
    if (currentSound) {
        currentSound.stop();
        currentSound.unload();
    }
    if (currentButton) {
        currentButton.innerHTML = '<i class="fas fa-play"></i>';
        currentButton.classList.remove('playing');
        currentButton = null;
    }
    if (previewTimer) {
        clearTimeout(previewTimer);
        previewTimer = null;
    }
    currentSound = null;
    currentBeatId = null;
}

// Inicia a pré-visualização do beat
function playBeat(beatId, url, button) {
    // Se o mesmo beat estiver a tocar, pará-lo
    if (currentBeatId === beatId) {
        stopCurrentSound();
        return;
    }

    // Se houver outro a tocar, pará-lo primeiro
    if (currentSound) {
        stopCurrentSound();
    }

    currentButton = button;
    currentBeatId = beatId;

    // Inicializa Howler
    currentSound = new Howl({
        src: [url],
        html5: true, // Obrigatório para ficheiros MP3 grandes
        onplay: () => {
            currentButton.innerHTML = '<i class="fas fa-pause"></i>';
            currentButton.classList.add('playing');
            
            // Define o timer para parar a reprodução após o tempo de amostra
            previewTimer = setTimeout(() => {
                stopCurrentSound();
            }, PREVIEW_DURATION);
        },
        onend: stopCurrentSound, // Para a reprodução se chegar ao fim
        onpause: stopCurrentSound,
        onstop: stopCurrentSound,
        onloaderror: (id, error) => {
            console.error('Erro ao carregar áudio:', error);
            stopCurrentSound();
        }
    });

    currentSound.play();
}


// ====================================================================
// 3. FUNÇÕES DE RENDERIZAÇÃO E FILTRAGEM
// ====================================================================

// Renderiza a lista de beats
function renderBeats(beats) {
    const container = document.getElementById('beats-container');
    container.innerHTML = ''; 

    if (beats.length === 0) {
        container.innerHTML = '<p class="no-results-message">Nenhum beat encontrado com estes critérios.</p>';
        return;
    }

    beats.forEach(beat => {
        const isFree = beat.is_free;
        const link = isFree ? beat.free_download_url : beat.gumroad_link;
        const buttonText = isFree ? 'Download Grátis' : 'Comprar Agora';

        const beatCard = document.createElement('div');
        beatCard.className = 'beat-card';

        beatCard.innerHTML = `
            <img src="${beat.imagem_url || 'https://placehold.co/600x600/1e1e1e/00ff99?text=Capa+Faltando'}" 
                 alt="Capa do Beat: ${beat.nome}" class="beat-image"
                 onerror="this.onerror=null; this.src='https://placehold.co/600x600/1e1e1e/00ff99?text=Capa+Faltando';">
            <div class="beat-info">
                <h3>${beat.nome}</h3>
                <p>Categoria: ${beat.categoria || 'Não especificada'}</p>
                <p class="price">${isFree ? 'GRÁTIS' : (beat.preco ? beat.preco.toFixed(2) + '€' : 'Preço Não Def.')}</p>
                
                <div class="controls-and-buy">
                    <button class="play-button" data-beat-id="${beat.id}" data-url="${beat.preview_url}">
                        <i class="fas fa-play"></i>
                    </button>
                    <a href="${link}" target="_blank" class="buy-button">
                        ${buttonText}
                    </a>
                </div>
            </div>
        `;

        // Adiciona o listener de clique ao botão de play/pause
        const playButton = beatCard.querySelector('.play-button');
        playButton.addEventListener('click', () => {
            const beatId = playButton.getAttribute('data-beat-id');
            const url = playButton.getAttribute('data-url');
            playBeat(beatId, url, playButton);
        });

        container.appendChild(beatCard);
    });
}


// Cria a lista de categorias para o filtro
function populateCategories(beats) {
    const filter = document.getElementById('category-filter');
    const categories = new Set(beats.map(beat => beat.categoria).filter(c => c));
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        filter.appendChild(option);
    });
}


// Função principal para carregar os dados
async function loadBeats() {
    try {
        const { data: beats, error } = await supabaseClient
            .from('beats')
            .select('*');

        if (error) {
            console.error('Erro ao carregar beats:', error);
            document.getElementById('beats-container').innerHTML = `<p class="error-message">Erro ao carregar dados: ${error.message}. Verifique o Supabase e RLS.</p>`;
            return;
        }

        let allBeats = beats || [];
        
        // Armazena todos os beats carregados
        window.allBeats = allBeats; 
        
        populateCategories(allBeats);
        filterAndRender(allBeats);

    } catch (e) {
        console.error('Erro geral:', e);
        document.getElementById('beats-container').innerHTML = `<p class="error-message">Erro de conexão: Verifique as chaves e a internet.</p>`;
    }
}


// Função de filtro e pesquisa
function filterAndRender(beats) {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const selectedCategory = document.getElementById('category-filter').value;
    
    const filteredBeats = beats.filter(beat => {
        const matchesSearch = beat.nome.toLowerCase().includes(searchTerm) || 
                              (beat.descricao && beat.descricao.toLowerCase().includes(searchTerm)) ||
                              (beat.categoria && beat.categoria.toLowerCase().includes(searchTerm));
        
        const matchesCategory = selectedCategory === 'all' || beat.categoria === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    renderBeats(filteredBeats);
}


// ====================================================================
// 4. FUNÇÕES DO FAQ (Acordeão)
// ====================================================================

function renderFAQ() {
    const container = document.getElementById('faq-container');
    // Mapeia o array de FAQS para o HTML
    container.innerHTML = FAQS.map((item, index) => `
        <div class="faq-item" id="faq-${index}">
            <div class="faq-question">
                <span>${item.question}</span>
                <i class="fas fa-chevron-down"></i>
            </div>
            <div class="faq-answer">
                <p>${item.answer}</p>
            </div>
        </div>
    `).join('');

    // Adiciona a lógica de abrir/fechar
    document.querySelectorAll('.faq-question').forEach(question => {
        question.addEventListener('click', () => {
            const item = question.closest('.faq-item');
            // Fecha todos os outros e abre o atual (comportamento Acordeão)
            document.querySelectorAll('.faq-item').forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });
            item.classList.toggle('active');
        });
    });
}


// ====================================================================
// 5. INICIALIZAÇÃO DA APLICAÇÃO
// ====================================================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicia o carregamento dos beats
    loadBeats();
    
    // 2. Adiciona listeners para filtragem
    document.getElementById('search-input').addEventListener('input', () => filterAndRender(window.allBeats));
    document.getElementById('category-filter').addEventListener('change', () => filterAndRender(window.allBeats));
    
    // 3. Inicia a rotação de fundos
    if (BACKGROUND_IMAGES.length > 0) {
        rotateBackgrounds();
    }

    // 4. Renderiza a secção FAQ
    renderFAQ();
});