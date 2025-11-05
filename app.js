// --- CONFIGURAÇÃO OBRIGATÓRIA ---
// 1. Vá ao seu projeto Supabase
// 2. No menu, clique em "Project Settings" (ícone da engrenagem)
// 3. Clique em "API"
// 4. Copie o "Project URL" e a "Project API Key" (a chave 'anon public') para aqui:

const SUPABASE_URL = 'https://khyjbzjycgqhthtcszwn.supabase.co'; // Cole a URL aqui
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoeWpiemp5Y2dxaHRodGNzenduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyMTMzMDMsImV4cCI6MjA3Nzc4OTMwM30.VAGIBs1bx1cLx0D3rnnSoNDLcIFgolmGTriy5WPn_GM'; // Cole a Chave aqui

// --- FIM DA CONFIGURAÇÃO ---

// Inicializar o cliente Supabase
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// Selecionar os locais no HTML onde vamos inserir os beats
const lojaGrid = document.getElementById('loja-grid');
const destaquesGrid = document.getElementById('destaques-grid');
const categoriaSelect = document.getElementById('categoria-select');

// Variável para guardar todos os beats quando carregarmos a página
let todosOsBeats = [];

// Função principal que carrega os beats da base de dados
async function carregarBeats() {
    // 1. Ir à tabela 'beats' e buscar todos os dados
    const { data: beats, error } = await db
        .from('beats')
        .select('*')
        .order('created_at', { ascending: false }); // Ordenar pelos mais recentes

    if (error) {
        console.error('Erro ao buscar beats:', error);
        lojaGrid.innerHTML = "<p>Não foi possível carregar os beats. Tente mais tarde.</p>";
        return;
    }

    if (beats.length === 0) {
        lojaGrid.innerHTML = "<p>Ainda não há beats na loja.</p>";
        return;
    }

    // Guardar os beats na nossa variável global
    todosOsBeats = beats;
    
    // Processar e mostrar os beats
    mostrarBeats(todosOsBeats);
    carregarCategorias(todosOsBeats);
}

// Função para mostrar os beats no site
function mostrarBeats(beats) {
    // Limpar os grids antes de adicionar novos beats
    lojaGrid.innerHTML = '';
    destaquesGrid.innerHTML = '';

    beats.forEach(beat => {
        // --- A LÓGICA DE PAGAMENTO QUE VOCÊ PEDIU ---
        let acaoBotao;
        
        if (beat.is_free) {
            // Se 'is_free' for TRUE (grátis)
            acaoBotao = `
                <a href="${beat.free_download_url}" class="btn-download" download>
                    Download Grátis
                </a>
            `;
        } else {
            // Se 'is_free' for FALSE (pago)
            // Certifica-se que o preço está formatado (ex: 15.00)
            const precoFormatado = beat.preco ? parseFloat(beat.preco).toFixed(2) : '0.00';
            acaoBotao = `
                <a href="${beat.gumroad_link}" class="btn-comprar" target="_blank">
                    Comprar (${precoFormatado}€)
                </a>
            `;
        }
        // --- FIM DA LÓGICA ---

        // Criar o HTML para este beat (o "card")
        const beatCardHTML = `
            <div class="beat-card" data-categoria="${beat.categoria}">
                <img src="${beat.imagem_url}" alt="${beat.nome}">
                <div class="beat-info">
                    <h3>${beat.nome}</h3>
                    <span class="categoria">${beat.categoria || 'Sem Categoria'}</span>
                    
                    <audio class="beat-player" controls controlsList="nodownload" src="${beat.preview_url}">
                        Seu navegador não suporta áudio.
                    </audio>
                    
                    <div class="beat-actions">
                        <span class="views">👁️ ${beat.views || 0} views</span>
                        ${acaoBotao}
                    </div>
                </div>
            </div>
        `;

        // Adicionar o card à loja
        lojaGrid.innerHTML += beatCardHTML;

        // Adicionar aos destaques (ex: se a categoria for "Destaque")
        if (beat.categoria && beat.categoria.toLowerCase() === 'destaque') {
            destaquesGrid.innerHTML += beatCardHTML;
        }
    });
}

// Função para carregar as categorias no filtro <select>
function carregarCategorias(beats) {
    // Usar um Set para guardar apenas categorias únicas
    const categorias = new Set(beats.map(beat => beat.categoria));
    
    categoriaSelect.innerHTML = '<option value="todos">Todas as Categorias</option>'; // Resetar
    
    categorias.forEach(categoria => {
        if (categoria) { // Ignorar se a categoria estiver vazia
            const option = document.createElement('option');
            option.value = categoria;
            option.textContent = categoria;
            categoriaSelect.appendChild(option);
        }
    });
}

// Função para filtrar os beats quando o utilizador muda a categoria
function filtrarBeats() {
    const categoriaSelecionada = categoriaSelect.value;

    if (categoriaSelecionada === 'todos') {
        mostrarBeats(todosOsBeats); // Mostrar todos
    } else {
        const beatsFiltrados = todosOsBeats.filter(beat => beat.categoria === categoriaSelecionada);
        mostrarBeats(beatsFiltrados); // Mostrar só os filtrados
    }
}

// --- "Ouvintes de Eventos" (O que faz o site funcionar) ---

// 1. Quando o filtro <select> for alterado, chama a função filtrarBeats
categoriaSelect.addEventListener('change', filtrarBeats);

// 2. Quando a página carregar, chama a função principal
document.addEventListener('DOMContentLoaded', carregarBeats);