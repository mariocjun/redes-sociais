// =====================================================================
// CONFIGURAÇÕES GLOBAIS E VARIÁVEIS DE CONTROLE
// =====================================================================

// Número total de grupos horizontais (6 redes sociais)
const groups = 6;

// Índice vertical atual (controla qual seção está visível na rolagem vertical)
let verticalIndex = 0;

// Elementos DOM principais
const sections = document.querySelectorAll("section"); // Todas as seções da página
const wrapper = document.getElementById("wrapper"); // Container principal de rolagem

// Arrays para controle de cada grupo horizontal:
let horizontalIndices = [];  // Índice horizontal atual de cada grupo
let pinWraps = [];           // Elementos DOM dos containers horizontais
let slotsGroups = [];        // Slots (cards + conectores) de cada grupo
let totalSlots = [];         // Quantidade total de slots por grupo

// Inicializa os controles para cada grupo
for (let i = 0; i < groups; i++) {
    horizontalIndices[i] = 0; // Começa no primeiro slot de cada grupo
    pinWraps[i] = document.getElementById(`pinWrap${i + 1}`); // Container horizontal
    slotsGroups[i] = document.querySelectorAll(`#pinWrap${i + 1} .slot`); // Slots do grupo
    totalSlots[i] = slotsGroups[i].length; // Total de slots no grupo
}

// =====================================================================
// FUNÇÕES PRINCIPAIS
// =====================================================================

/**
 * Atualiza as dimensões dos slots conforme o tamanho da tela
 * Responsável pelo layout responsivo dos cards e conectores
 */
function updateSlotSizes() {
    const W = window.innerWidth;
    for (let i = 0; i < groups; i++) {
        // Ajusta largura de cada slot no grupo
        slotsGroups[i].forEach(slot => {
            if (slot.dataset.type === "card") {
                slot.style.width = `${W}px`; // Cards ocupam 100% da largura
            } else if (slot.dataset.type === "connector" && W > 768) {
                slot.style.width = `${W * 0.2}px`; // Conectores ocupam 20% em desktop
            }
        });
        
        // Calcula largura total do container horizontal
        let totalWidth = Array.from(slotsGroups[i]).reduce(
            (sum, slot) => sum + slot.offsetWidth, 
            0
        );
        pinWraps[i].style.width = `${totalWidth}px`;
    }
}

/**
 * Atualiza a posição horizontal dentro de um grupo específico
 * @param {number} group - Índice do grupo (0 a 5)
 */
function updateHorizontal(group) {
    const W = window.innerWidth;
    const slots = slotsGroups[group];
    const hIndex = horizontalIndices[group];
    
    // Calcula os offsets acumulados dos slots
    let offsets = [];
    let cumulative = 0;
    slots.forEach(slot => {
        offsets.push(cumulative);
        cumulative += slot.offsetWidth;
    });

    // Centraliza o slot ativo na tela
    const activeCenter = offsets[hIndex] + slots[hIndex].offsetWidth / 2;
    const displacement = activeCenter - W / 2;
    pinWraps[group].style.transform = `translateX(-${displacement}px)`;

    // Atualiza classe 'active' para estilização
    slots.forEach((slot, idx) => {
        slot.classList.toggle("active", idx === hIndex);
    });
}

/**
 * Atualiza a posição vertical do wrapper principal
 * Controla a transição entre seções principais
 */
function updateVertical() {
    // Aplica transformação vertical com animação
    wrapper.style.transform = `translateY(-${verticalIndex * window.innerHeight}px)`;
    
    // Atualizações complementares
    updateActiveSection();    // Destaca seção atual
    updateHeaderActive();     // Atualiza botões do cabeçalho
    updateProgressBar();      // Atualiza barra de progresso
}

/**
 * Destaca a seção ativa com classe CSS
 */
function updateActiveSection() {
    sections.forEach((sec, idx) => {
        sec.classList.toggle("active", idx === verticalIndex);
    });
}

/**
 * Atualiza botões ativos no cabeçalho
 */
function updateHeaderActive() {
    let activeHeaderIndex;
    if (verticalIndex === 0 || verticalIndex === sections.length - 1) {
        activeHeaderIndex = verticalIndex;
    } else {
        activeHeaderIndex = Math.floor((verticalIndex - 1) / 2) * 2 + 1;
    }
    
    document.querySelectorAll('.header-btn').forEach(btn => {
        const targetIndex = parseInt(btn.dataset.index);
        btn.classList.toggle('active', targetIndex === activeHeaderIndex);
    });
}

/**
 * Calcula e atualiza a barra de progresso global
 */
function updateProgressBar() {
    let totalSteps = 0;
    // Calcula o total de passos considerando todos os grupos
    for (let i = 0; i < groups; i++) {
        totalSteps += 1 + totalSlots[i]; // Intro + slots
    }
    totalSteps += 1; // Adiciona a seção final

    let currentStep = 0;
    // Lógica de cálculo do passo atual
    if (verticalIndex === 0) {
        currentStep = 0; // Seção inicial
    } else if (verticalIndex === sections.length - 1) {
        currentStep = totalSteps - 1; // Seção final
    } else {
        // Calcula passo com base no grupo e índice horizontal
        let group = Math.floor((verticalIndex - 1) / 2);
        for (let i = 0; i < group; i++) {
            currentStep += 1 + totalSlots[i];
        }
        if ((verticalIndex - 1) % 2 === 0) {
            // Intro do grupo
        } else {
            currentStep += 1 + horizontalIndices[group];
        }
    }

    // Atualiza visualmente a barra
    const progressPercent = (currentStep / (totalSteps - 1)) * 100;
    document.getElementById("progress-bar").style.width = `${progressPercent}%`;
}

// =====================================================================
// CONTROLE DE NAVEGAÇÃO
// =====================================================================

/**
 * Navega para a próxima seção/slot
 */
function navigateNext() {
    // Reinicia ao chegar no final
    if (verticalIndex === sections.length - 1) {
        verticalIndex = 0;
        horizontalIndices.fill(0);
        updateVertical();
        return;
    }

    // Seções não-horizontais (MEWIL/Final)
    if (sections[verticalIndex].dataset.horizontal === "false") {
        verticalIndex++;
        updateVertical();
        return;
    }

    // Lógica de navegação em grupos emparelhados
    const pairIndex = verticalIndex - 1;
    const currentGroup = Math.floor(pairIndex / 2);

    if (pairIndex % 2 === 0) { // Na introdução
        verticalIndex++;
        horizontalIndices[currentGroup] = 0;
        updateVertical();
        updateHorizontal(currentGroup);
    } else { // Na área horizontal
        if (horizontalIndices[currentGroup] < totalSlots[currentGroup] - 1) {
            horizontalIndices[currentGroup]++;
            updateHorizontal(currentGroup);
            updateProgressBar();
        } else {
            verticalIndex++;
            updateVertical();
        }
    }
}

/**
 * Navega para a seção/slot anterior
 */
function navigatePrev() {
    if (verticalIndex === 0) { // Volta para o final
        verticalIndex = sections.length - 1;
        updateVertical();
        return;
    }

    // Seção anterior não-horizontal
    if (sections[verticalIndex - 1]?.dataset.horizontal === "false") {
        verticalIndex--;
        updateVertical();
        return;
    }

    const pairIndex = verticalIndex - 1;
    if (pairIndex % 2 === 1) { // Na área horizontal
        const currentGroup = Math.floor(pairIndex / 2);
        if (horizontalIndices[currentGroup] > 0) {
            horizontalIndices[currentGroup]--;
            updateHorizontal(currentGroup);
            updateProgressBar();
        } else {
            verticalIndex--;
            updateVertical();
        }
    } else { // Na introdução
        verticalIndex--;
        const previousGroup = Math.floor((verticalIndex - 1) / 2);
        horizontalIndices[previousGroup] = totalSlots[previousGroup] - 1;
        updateVertical();
        updateHorizontal(previousGroup);
    }
}

// =====================================================================
// EVENT LISTENERS
// =====================================================================

// Botões de navegação principal
document.querySelector(".btn.next").addEventListener("click", navigateNext);
document.querySelector(".btn.prev").addEventListener("click", navigatePrev);

// Botões do cabeçalho para navegação direta
document.querySelectorAll(".header-btn").forEach(btn => {
    btn.addEventListener("click", function() {
        verticalIndex = parseInt(this.dataset.index);
        const currentGroup = Math.floor((verticalIndex - 1) / 2);
        updateHorizontal(currentGroup);
        updateVertical();
    });
});

// =====================================================================
// INICIALIZAÇÃO E RESPONSIVIDADE
// =====================================================================

/**
 * Inicializa e ajusta elementos para diferentes dispositivos
 */
function init() {
    // Adaptação para dispositivos móveis
    if (window.innerWidth <= 768) {
        for (let i = 0; i < groups; i++) {
            // Remove conectores em mobile
            const connectors = pinWraps[i].querySelectorAll('.slot[data-type="connector"]');
            connectors.forEach(connector => connector.remove());
            
            // Atualiza lista de slots
            slotsGroups[i] = pinWraps[i].querySelectorAll('.slot[data-type="card"]');
            totalSlots[i] = slotsGroups[i].length;
        }
    }
    
    // Atualizações iniciais
    updateSlotSizes();
    if (verticalIndex > 0 && (verticalIndex - 1) % 2 === 1) {
        const currentGroup = Math.floor((verticalIndex - 1) / 2);
        updateHorizontal(currentGroup);
    }
    updateVertical();
}

// Eventos de redimensionamento e carga
window.addEventListener("resize", init);
window.addEventListener("load", init);