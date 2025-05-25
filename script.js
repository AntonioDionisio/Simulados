const AppState = {
    simuladoAtual: null,
    respostasUsuario: [],
    timerInterval: null,
    remainingTime: 0,
    nomeRealizante: ""
};

// Contador de perguntas
let contadorPerguntas = 0;

// Funções de Navegação
function mostrarSecao(secao) {
    document.querySelectorAll('.secao').forEach(s => {
        s.style.display = 'none';
    });
    document.getElementById(`${secao}Simulado`).style.display = 'block';
}

function mostrarHistorico(tipo) {
    if (tipo === 'criados') {
        document.getElementById('historicoCriados').style.display = 'block';
        document.getElementById('historicoDesempenho').style.display = 'none';
        document.querySelector('.historico-tabs button:first-child').classList.add('tab-active');
        document.querySelector('.historico-tabs button:last-child').classList.remove('tab-active');
        atualizarHistorico();
    } else {
        document.getElementById('historicoCriados').style.display = 'none';
        document.getElementById('historicoDesempenho').style.display = 'block';
        document.querySelector('.historico-tabs button:first-child').classList.remove('tab-active');
        document.querySelector('.historico-tabs button:last-child').classList.add('tab-active');
        atualizarHistorico();
    }
}

// Funções de Criação de Simulado
function adicionarPergunta() {
    contadorPerguntas++;
    const id = contadorPerguntas;

    const perguntaDiv = document.createElement('div');
    perguntaDiv.className = 'pergunta';
    perguntaDiv.id = `pergunta${id}`;

    perguntaDiv.innerHTML = `
                <div class="pergunta-header">
                    <h3>Pergunta ${id}</h3>
                    <button onclick="removerPergunta(${id})" class="btn-remover">Remover</button>
                </div>
                
                <div class="form-group">
                    <label for="enunciado${id}">Enunciado:</label>
                    <textarea id="enunciado${id}" rows="3" placeholder="Digite o enunciado da pergunta"></textarea>
                </div>
                
                <div class="form-group">
                    <label>Imagem (opcional):</label>
                    <input type="file" id="imagem${id}" accept="image/*" onchange="carregarImagem(this, ${id})">
                    <input type="text" id="legendaImagem${id}" placeholder="Legenda para a imagem">
                </div>

                <div class="form-group">
                    <label for="complemento${id}">Complemento (opcional):</label>
                    <textarea id="complemento${id}" rows="2" placeholder="Texto complementar, se necessário"></textarea>
                </div>         
                
                <div class="opcoes-header">
                    <h4>Opções de Resposta</h4>
                    <button onclick="adicionarOpcao(${id})">Adicionar Opção</button>
                </div>
                
                <div id="opcoesContainer${id}" class="opcoes-container"></div>
            `;

    document.getElementById('perguntasContainer').appendChild(perguntaDiv);
    adicionarOpcao(id);
    adicionarOpcao(id);
}

function removerPergunta(id) {
    const pergunta = document.getElementById(`pergunta${id}`);
    if (pergunta) {
        pergunta.remove();
    }
}

function adicionarOpcao(perguntaId) {
    const opcoesContainer = document.getElementById(`opcoesContainer${perguntaId}`);
    const opcaoId = Date.now();

    const opcaoDiv = document.createElement('div');
    opcaoDiv.className = 'opcao';
    opcaoDiv.innerHTML = `
                <div class="opcao-content">
                    <input type="text" placeholder="Texto da opção" class="opcao-texto">
                    <div class="opcao-actions">
                        <label>
                            <input type="checkbox" class="opcao-correta"> Correta
                        </label>
                        <button onclick="removerOpcao(this)" class="btn-remover">Remover</button>
                    </div>
                </div>
                <div class="opcao-justificativa">
                    <input type="text" name="justificativa" placeholder="Justificativa (por que esta opção está correta/errada)">
                </div>
            `;

    opcoesContainer.appendChild(opcaoDiv);
}

function removerOpcao(botao) {
    botao.closest('.opcao').remove();
}

function limparFormulario() {
    if (confirm('Tem certeza que deseja limpar todo o formulário? Todos os dados serão perdidos.')) {
        document.getElementById('perguntasContainer').innerHTML = '';
        document.getElementById('nomeSimulado').value = '';
        document.getElementById('nomeCriador').value = '';
        document.getElementById('emailCriador').value = '';
        contadorPerguntas = 0;
    }
}

function carregarImagem(input, perguntaId) {
    const file = input.files[0];
    if (!file) return;

    if (!file.type.match('image.*')) {
        alert('Por favor, selecione uma imagem.');
        input.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        input.setAttribute('data-base64', e.target.result);
    };
    reader.readAsDataURL(file);
}

// Funções de Exportação/Importação
function exportarJSON() {
    const nome = document.getElementById("nomeSimulado").value;
    const criador = document.getElementById("nomeCriador").value;
    const email = document.getElementById("emailCriador").value;

    if (!nome) {
        alert("Por favor, informe o nome do simulado");
        return;
    }

    if (email && !validarEmail(email)) {
        alert("Por favor, insira um email válido");
        return;
    }

    const perguntas = [];
    document.querySelectorAll(".pergunta").forEach(p => {
        const perguntaId = p.id.replace('pergunta', '');

        const enunciado = p.querySelector(`#enunciado${perguntaId}`)?.value || '';
        const complemento = p.querySelector(`#complemento${perguntaId}`)?.value || '';

        const imagemInput = p.querySelector("input[type='file']");
        const imagem = imagemInput?.getAttribute("data-base64") || null;
        const legendaImagem = p.querySelector(`#legendaImagem${perguntaId}`)?.value || null;

        const opcoes = [];
        p.querySelectorAll(`#opcoesContainer${perguntaId} > div`).forEach((op, i) => {
            const textoInput = op.querySelector("input[type='text']");
            const texto = textoInput?.value || '';

            const textoFormatado = texto.replace(/\n/g, '\\n');
            const correta = op.querySelector("input[type='checkbox']")?.checked || false;
            const justificativaInput = op.querySelector("input[name='justificativa']");
            const justificativa = justificativaInput?.value.replace(/\n/g, '\\n') || '';

            if (texto) {
                opcoes.push({
                    texto: textoFormatado,
                    correta,
                    justificativa
                });
            }
        });

        if ((enunciado || complemento) && opcoes.length >= 2) {
            perguntas.push({
                enunciado: enunciado.replace(/\n/g, '\\n'),
                complemento: complemento.replace(/\n/g, '\\n'),
                imagem,
                legendaImagem,
                opcoes
            });
        }
    });

    if (perguntas.length === 0) {
        alert("Por favor, adicione pelo menos uma pergunta válida");
        return;
    }

    // Criar objeto do simulado
    const simulado = {
        id: 'simulado-' + Date.now(),
        nome,
        criador,
        email,
        dataCriacao: new Date().toISOString(),
        perguntas
    };

    // Salvar no histórico
    let historicoCriados = JSON.parse(localStorage.getItem('simuladosCriados')) || [];
    historicoCriados.push({
        id: simulado.id,
        nome: simulado.nome,
        criador: simulado.criador,
        email: simulado.email,
        data: new Date().toLocaleString(),
        totalPerguntas: perguntas.length
    });
    localStorage.setItem('simuladosCriados', JSON.stringify(historicoCriados));

    // Salvar o simulado completo
    let simuladosCompletos = JSON.parse(localStorage.getItem('simuladosCompletos')) || {};
    simuladosCompletos[simulado.id] = simulado;
    localStorage.setItem('simuladosCompletos', JSON.stringify(simuladosCompletos));

    // Fazer download
    const blob = new Blob([JSON.stringify(simulado, null, 2)], {
        type: 'application/json'
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${nome.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'simulado'}.json`;
    link.click();
    alert('Simulado exportado com sucesso!');
}

function carregarArquivo() {
    const input = document.getElementById('fileInput');
    const file = input.files[0];

    if (!file) {
        alert('Selecione um arquivo JSON.');
        return;
    }

    const tempoProva = prompt("Digite o tempo de prova em minutos (ex: 60 para 1 hora):", "60");

    if (!tempoProva || isNaN(tempoProva) || tempoProva <= 0) {
        alert("Tempo inválido. O simulado será iniciado sem limite de tempo.");
        AppState.remainingTime = Infinity;
    } else {
        AppState.remainingTime = parseInt(tempoProva) * 60;
        iniciarTimer();
    }

    const nomeRealizante = prompt("Digite seu nome para registro no histórico:");
    AppState.nomeRealizante = nomeRealizante || "Anônimo";

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = JSON.parse(e.target.result);
            data.tempoProva = parseInt(tempoProva) || 60;
            
            // Garantir ID e nome para o histórico funcionar corretamente
            if (!data.id) {
                data.id = 'simulado-importado-' + Date.now();
            }
            if (!data.nome) {
                data.nome = 'Simulado Importado';
            }
            
            AppState.simuladoAtual = data;

            // Armazenar no cache e histórico local
            let simuladosCriados = JSON.parse(localStorage.getItem('simuladosCriados')) || [];
            let simuladosCompletos = JSON.parse(localStorage.getItem('simuladosCompletos')) || {};

            // Adiciona ao histórico criado se ainda não existe
            if (!simuladosCompletos[data.id]) {
                simuladosCriados.push({
                    id: data.id,
                    nome: data.nome,
                    criador: AppState.nomeRealizante,
                    email: '',
                    data: new Date().toLocaleString(),
                    totalPerguntas: data.perguntas.length
                });
            }
            
            simuladosCompletos[data.id] = data;

            localStorage.setItem('simuladosCriados', JSON.stringify(simuladosCriados));
            localStorage.setItem('simuladosCompletos', JSON.stringify(simuladosCompletos));

            exibirSimulado(data);
        } catch (error) {
            alert('Erro ao carregar o arquivo JSON. Verifique o formato.');
            console.error(error);
        }
    };
    reader.onerror = function () {
        alert('Erro ao ler o arquivo.');
        console.error(reader.error);
    };
    reader.readAsText(file);
}

// Funções de Realização de Simulado
function carregarSimuladosDisponiveis() {
    const container = document.getElementById('simuladosContainer');
    container.innerHTML = '';

    // 1. Buscar todos os simulados disponíveis
    let simuladosCriados = JSON.parse(localStorage.getItem('simuladosCriados')) || [];
    let simuladosCompletos = JSON.parse(localStorage.getItem('simuladosCompletos')) || {};
    let simuladosCache = JSON.parse(localStorage.getItem('simuladosCache')) || {};

    // 2. Atualizar o cache com os simulados completos
    simuladosCriados.forEach(simulado => {
        if (simuladosCompletos[simulado.id] && !simuladosCache[simulado.id]) {
            simuladosCache[simulado.id] = {
                id: simulado.id,
                nome: simulado.nome,
                criador: simulado.criador,
                data: simulado.data,
                totalPerguntas: simulado.totalPerguntas,
                descricao: simulado.descricao || 'Simulado criado por você',
                perguntas: simuladosCompletos[simulado.id].perguntas || []
            };
        }
    });

    // 3. Salvar cache atualizado
    localStorage.setItem('simuladosCache', JSON.stringify(simuladosCache));
    const simuladosParaExibir = Object.values(simuladosCache);

    // 4. Verificar se há simulados para exibir
    if (simuladosParaExibir.length === 0) {
        container.innerHTML = '<p>Nenhum simulado disponível no momento. Crie ou importe um simulado para começar.</p>';
        return;
    }

    // 5. Buscar o último simulado realizado para destacá-lo
    const ultimoSimuladoId = localStorage.getItem('ultimoSimuladoId');

    // 6. Exibir cada simulado
    simuladosParaExibir.forEach(simulado => {
        const card = document.createElement('div');
        card.className = 'simulado-card';
        
        // Destacar o último simulado realizado
        if (simulado.id === ultimoSimuladoId) {
            card.style.border = '2px solid #007bff';
            card.style.boxShadow = '0 0 8px rgba(0,123,255,0.3)';
        }

        card.innerHTML = `
            <h3>${simulado.nome}</h3>
            <div class="meta">
                <span>Criado por: ${simulado.criador}</span>
                <span>${simulado.data}</span>
            </div>
            <p>${simulado.descricao}</p>
            <p><strong>${simulado.totalPerguntas} questões</strong></p>
            <button onclick="iniciarSimulado('${simulado.id}')">Iniciar Simulado</button>
            ${simulado.perguntas && simulado.perguntas.length > 0 ?
                `<button onclick="refazerSimuladoCache('${simulado.id}')" class="btn-refazer">Refazer</button>` : 
                ''}
        `;
        container.appendChild(card);
    });
}

function iniciarSimulado(simuladoId) {
    const tempoProva = prompt("Digite o tempo de prova em minutos (ex: 60 para 1 hora):", "60");

    if (!tempoProva || isNaN(tempoProva) || tempoProva <= 0) {
        alert("Tempo inválido. O simulado será iniciado sem limite de tempo.");
        AppState.remainingTime = Infinity;
        document.getElementById('timerContainer').style.display = 'none';
    } else {
        AppState.remainingTime = parseInt(tempoProva) * 60;
        iniciarTimer();
    }

    const nomeRealizante = prompt("Digite seu nome para registro no histórico:");
    AppState.nomeRealizante = nomeRealizante || "Anônimo";

    //Carrega simulado real do cache
    const simuladosCache = JSON.parse(localStorage.getItem('simuladosCache')) || {};
    const simulado = simuladosCache[simuladoId];

    if (!simulado) {
        alert('Simulado não encontrado.');
        return;
    }

    //Salva como o último simulado usado
    localStorage.setItem('ultimoSimuladoId', simuladoId);

    AppState.simuladoAtual = simulado;
    AppState.simuladoAtual.tempoProva = parseInt(tempoProva) || 60;
    exibirSimulado(simulado);
}

function refazerSimuladoCache(simuladoId) {
    const simuladosCache = JSON.parse(localStorage.getItem('simuladosCache')) || {};
    const simulado = simuladosCache[simuladoId];

    if (simulado && simulado.perguntas && simulado.perguntas.length > 0) {
        AppState.simuladoAtual = simulado;

        //Salvar o último simulado realizado
        localStorage.setItem('ultimoSimuladoId', simuladoId);

        const tempoProva = prompt("Digite o tempo de prova em minutos (ex: 60 para 1 hora):", "60");
        const tempo = tempoProva && !isNaN(tempoProva) && tempoProva > 0 ? parseInt(tempoProva) : 60;

        AppState.remainingTime = tempo * 60;
        AppState.simuladoAtual.tempoProva = tempo;

        const nomeRealizante = prompt("Digite seu nome para registro no histórico:");
        AppState.nomeRealizante = nomeRealizante || "Anônimo";

        iniciarTimer();
        exibirSimulado(simulado);
    } else {
        alert('Simulado não encontrado no cache ou sem perguntas. Carregando normalmente...');
        iniciarSimulado(simuladoId);
    }
}

function exibirSimulado(simulado) {
    const perguntasDiv = document.getElementById('perguntas');
    perguntasDiv.innerHTML = '';
    AppState.respostasUsuario = [];

    simulado.perguntas.forEach((pergunta, i) => {
        const div = document.createElement('div');
        div.className = 'question';
        div.dataset.perguntaId = i;

        const enunciadoFormatado = sanitizeHTML(pergunta.enunciado).replace(/\n/g, '<br>');
        const complementoFormatado = pergunta.complemento ? sanitizeHTML(pergunta.complemento).replace(/\n/g, '<br>') : '';

        let html = `<h3>${i + 1}. <span class="texto-com-quebras">${enunciadoFormatado}</span></h3>`;

        if (pergunta.imagem) {
            html += `<img src="${pergunta.imagem}" style="max-width: 100%; margin: 10px 0;"><br>`;
            if (pergunta.legendaImagem) {
                html += `<p class="legenda-imagem">${sanitizeHTML(pergunta.legendaImagem)}</p>`;
            }
        }

        if (pergunta.complemento) {
            html += `<p class="texto-com-quebras">${complementoFormatado}</p>`;
        }

        const totalCorretas = pergunta.opcoes.filter(op => op.correta).length;
        const inputType = totalCorretas > 1 ? 'checkbox' : 'radio';

        html += '<ul class="options" style="list-style-type: none; padding-left: 0;">';
        pergunta.opcoes.forEach((op, j) => {
            html += `
                        <li style="margin-bottom: 10px;">
                            <label style="display: flex; align-items: center;">
                                <input type="${inputType}" name="resposta${i}" value="${j}" 
                                    data-correta="${op.correta}" 
                                    data-justificativa="${sanitizeHTML(op.justificativa)}"
                                    style="margin-right: 10px;">
                                <span class="texto-com-quebras">${sanitizeHTML(op.texto)}</span>
                            </label>
                        </li>`;
        });
        html += '</ul>';

        div.innerHTML = html;
        perguntasDiv.appendChild(div);
    });

    document.getElementById('listaSimulados').style.display = 'none';
    document.getElementById('areaSimulado').style.display = 'block';
}

function iniciarTimer() {
    const timerContainer = document.getElementById('timerContainer');
    const timerDisplay = document.getElementById('timerDisplay');

    timerContainer.style.display = 'flex';
    timerContainer.classList.remove('timer-warning', 'timer-danger');

    if (AppState.timerInterval) clearInterval(AppState.timerInterval);

    atualizarDisplayTimer();

    AppState.timerInterval = setInterval(atualizarDisplayTimer, 1000);

    function atualizarDisplayTimer() {
        const minutes = Math.floor(AppState.remainingTime / 60);
        const seconds = AppState.remainingTime % 60;
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        if (AppState.remainingTime <= 300) {
            timerContainer.classList.add('timer-warning');
            timerContainer.classList.remove('timer-danger');
        }
        if (AppState.remainingTime <= 60) {
            timerContainer.classList.remove('timer-warning');
            timerContainer.classList.add('timer-danger');
        }

        if (AppState.remainingTime <= 0) {
            clearInterval(AppState.timerInterval);
            timerContainer.style.display = 'none';
            finalizarSimulado(true);
        }

        AppState.remainingTime--;
    }
}

function finalizarSimulado(tempoEsgotado = false) {
    if (!AppState.simuladoAtual) return;

    if (AppState.timerInterval) {
        clearInterval(AppState.timerInterval);
        document.getElementById('timerContainer').style.display = 'none';
    }

    const perguntas = document.querySelectorAll("#perguntas .question");
    let total = AppState.simuladoAtual.perguntas.length;
    let corretas = 0;
    let resultados = [];

    perguntas.forEach((perguntaDiv, index) => {
        const pergunta = AppState.simuladoAtual.perguntas[index];
        const inputs = perguntaDiv.querySelectorAll("input[type='checkbox'], input[type='radio']");

        const respostasCorretas = pergunta.opcoes
            .map((op, i) => ({ indice: i, texto: op.texto, correta: op.correta }))
            .filter(op => op.correta);

        const respostasSelecionadas = Array.from(inputs)
            .filter(input => input.checked)
            .map(input => ({
                indice: parseInt(input.value),
                texto: input.parentElement.textContent.trim(),
                correta: input.dataset.correta === 'true'
            }));

        const todasCorretasSelecionadas = respostasCorretas.every(rc =>
            respostasSelecionadas.some(rs => rs.indice === rc.indice)
        );

        const nenhumaIncorretaSelecionada = respostasSelecionadas.every(rs => rs.correta);

        const acertou = todasCorretasSelecionadas && nenhumaIncorretaSelecionada;

        if (acertou) {
            corretas++;
        }

        resultados.push({
            pergunta: pergunta.enunciado,
            complemento: pergunta.complemento,
            respostasUsuario: respostasSelecionadas,
            respostasCorretas,
            justificativa: respostasCorretas.map(rc =>
                pergunta.opcoes[rc.indice].justificativa
            ).join(" | "),
            acertou
        });
    });

    salvarResultadoHistorico(total, corretas);
    mostrarResultados(total, corretas, resultados);
}

function mostrarResultados(total, corretas, resultados) {
    const modal = document.getElementById('modalResultados');
    const content = document.getElementById('resultadoContent');

    const porcentagem = Math.round((corretas / total) * 100);

    let html = `
                <div style="text-align: center; margin-bottom: 30px; padding: 15px; background-color: #f5f5f5; border-radius: 8px;">
                    <h2 style="margin: 0; color: ${porcentagem >= 70 ? '#4CAF50' : '#F44336'}">
                        ${porcentagem}% de acerto
                    </h2>
                    <p style="font-size: 1.1em;">
                        Você acertou <strong>${corretas} de ${total}</strong> perguntas
                    </p>
                    <p style="color: #555;">${getMensagemDesempenho(porcentagem / 100)}</p>
                </div>
                
                <h3 style="margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px;">Detalhamento por questão:</h3>
            `;

    resultados.forEach((resultado, i) => {
        const respostasUsuario = resultado.respostasUsuario || [];
        const respostasCorretas = resultado.respostasCorretas || [];

        html += `
                    <div style="margin-bottom: 25px; padding: 15px; background-color: ${resultado.acertou ? '#E8F5E9' : '#FFEBEE'}; border-radius: 8px; border-left: 4px solid ${resultado.acertou ? '#4CAF50' : '#F44336'};">
                        <div style="display: flex; align-items: center; margin-bottom: 10px;">
                            <span style="background-color: ${resultado.acertou ? '#4CAF50' : '#F44336'}; color: white; border-radius: 50%; width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; margin-right: 10px;">
                                ${i + 1}
                            </span>
                            <h4 style="margin: 0; color: ${resultado.acertou ? '#4CAF50' : '#F44336'};">
                                ${resultado.acertou ? '✓ Resposta Correta' : '✗ Resposta Incorreta'}
                            </h4>
                        </div>
                        
                        <p style="margin-bottom: 8px;"><strong>Pergunta:</strong> ${sanitizeHTML(resultado.pergunta || 'Sem enunciado')}</p>
                        
                        ${resultado.complemento ? `<p style="margin-bottom: 8px;"><strong>Complemento:</strong> ${sanitizeHTML(resultado.complemento)}</p>` : ''}
                        
                        <p style="margin-bottom: 8px;">
                            <strong>Sua(s) resposta(s):</strong> 
                            ${respostasUsuario.length > 0 ? sanitizeHTML(respostasUsuario.map(r => r.texto).join(', ')) : 'Nenhuma resposta selecionada'}
                        </p>
                        
                        <p style="margin-bottom: 8px;">
                            <strong>Resposta(s) correta(s):</strong> 
                            ${sanitizeHTML(respostasCorretas.map(r => r.texto).join(', '))}
                        </p>
                        
                        <div style="background-color: ${resultado.acertou ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)'}; padding: 10px; border-radius: 5px; margin-top: 10px;">
                            <p style="margin: 0; color: ${resultado.acertou ? '#2E7D32' : '#C62828'};">
                                <strong>${resultado.acertou ? '✓ Por que está correto:' : '✗ Motivo do erro:'}</strong> 
                                ${sanitizeHTML(resultado.justificativa || 'Sem justificativa disponível.')}
                            </p>
                        </div>
                    </div>
                `;
    });

    // Adiciona os botões no final
    html += `
                <div style="text-align: center; margin-top: 30px;">
                    <button onclick="refazerSimulado()" style="padding: 12px 24px; background-color: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 1em; margin-right: 10px;">
                        Refazer Simulado
                    </button>
                    <button onclick="fecharESair()" style="padding: 12px 24px; background-color: #C70A0A; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 1em;">
                        Fechar Simulado
                    </button>
                </div>
            `;

    content.innerHTML = html;
    modal.style.display = 'flex';
}

function salvarResultadoHistorico(total, corretas) {
    if (!AppState.simuladoAtual) return;

    const historico = JSON.parse(localStorage.getItem('historicoDesempenho')) || [];

    const vezesRealizado = historico.filter(item =>
        item.simuladoId === AppState.simuladoAtual.id &&
        item.nomeRealizante === AppState.nomeRealizante
    ).length + 1;

    historico.push({
        simuladoId: AppState.simuladoAtual.id || 'custom',
        simuladoNome: AppState.simuladoAtual.nome || 'Simulado Personalizado',
        nomeRealizante: AppState.nomeRealizante || "Anônimo",
        data: new Date().toLocaleString(),
        totalPerguntas: total,
        acertos: corretas,
        porcentagem: (corretas / total * 100).toFixed(1),
        vezesRealizado: vezesRealizado
    });
    localStorage.setItem('historicoDesempenho', JSON.stringify(historico));
}

function limparRespostas() {
    document.querySelectorAll("#perguntas input[type='radio'], #perguntas input[type='checkbox']").forEach(radio => {
        radio.checked = false;
    });
}

function refazerSimulado() {
    fecharModal();
    limparRespostas();

    if (AppState.simuladoAtual?.tempoProva) {
        AppState.remainingTime = AppState.simuladoAtual.tempoProva * 60;
        iniciarTimer();
    }

    exibirSimulado(AppState.simuladoAtual);
}

function fecharModal() {
    document.getElementById('modalResultados').style.display = 'none';
}

function fecharESair() {
    fecharModal();
    if (AppState.timerInterval) {
        clearInterval(AppState.timerInterval);
        document.getElementById('timerContainer').style.display = 'none';
    }
    document.getElementById('areaSimulado').style.display = 'none';
    document.getElementById('listaSimulados').style.display = 'block';
    mostrarSecao('realizar');
}

function revisarRespostas() {
    const perguntas = document.querySelectorAll("#perguntas .question");
    let pendentes = 0;
    let indicesPendentes = [];

    perguntas.forEach((pergunta, index) => {
        const opcoes = pergunta.querySelectorAll("input[type='radio'], input[type='checkbox']");
        const algumaSelecionada = Array.from(opcoes).some(op => op.checked);

        if (!algumaSelecionada) {
            pendentes++;
            indicesPendentes.push(index + 1);
        }
    });

    if (pendentes > 0) {
        alert(`${pendentes} pergunta(s) ainda não foram respondidas: ${indicesPendentes.join(', ')}`);
    } else {
        alert("Todas as perguntas foram respondidas. Você pode finalizar.");
    }
}

function atualizarHistorico() {
    const listaCriados = document.getElementById('historicoSimuladosCriados');
    listaCriados.innerHTML = '';

    const simuladosCriados = JSON.parse(localStorage.getItem('simuladosCriados')) || [];
    if (simuladosCriados.length === 0) {
        listaCriados.innerHTML = '<li style="padding: 15px; background-color: #f5f5f5; border-radius: 5px;">Nenhum simulado criado ainda.</li>';
    } else {
    }

    const desempenhoDiv = document.getElementById('dadosDesempenho');
    const historicoDesempenho = JSON.parse(localStorage.getItem('historicoDesempenho')) || [];

    if (historicoDesempenho.length === 0) {
        desempenhoDiv.innerHTML = '<p style="padding: 15px; background-color: #f5f5f5; border-radius: 5px;">Nenhum dado de desempenho disponível.</p>';
    } else {
        let html = '';
        const realizantes = {};

        // 1. Primeiro organizamos os dados por realizante
        historicoDesempenho.forEach(item => {
            // Corrige valores undefined
            item.nomeRealizante = item.nomeRealizante || "Anônimo";
            item.vezesRealizado = item.vezesRealizado || 1;

            if (!realizantes[item.nomeRealizante]) {
                realizantes[item.nomeRealizante] = {};
            }

            if (!realizantes[item.nomeRealizante][item.simuladoNome]) {
                realizantes[item.nomeRealizante][item.simuladoNome] = [];
            }

            realizantes[item.nomeRealizante][item.simuladoNome].push(item);
        });

        // 2. Agora geramos o HTML e os gráficos
        Object.keys(realizantes).forEach(nome => {
            html += `<div class="desempenho-usuario">`;
            html += `<div class="usuario-nome">${nome}</div>`;

            const simuladosDoUsuario = realizantes[nome]; // <-- Aqui está a correção do erro

            Object.keys(simuladosDoUsuario).forEach(simuladoNome => {
                const tentativas = simuladosDoUsuario[simuladoNome];
                const tentativasOrdenadas = tentativas.sort((a, b) => a.vezesRealizado - b.vezesRealizado);

                html += `<div class="simulado-info">`;
                html += `<span class="simulado-nome">${simuladoNome}</span>`;
                html += `<span class="vezes-realizado">(Realizado ${tentativas.length} vezes)</span>`;

                const idsCanvas = `grafico-${nome.replace(/\s+/g, '-')}-${simuladoNome.replace(/\s+/g, '-')}`;

                html += `<div class="grafico-container">`;
                html += `<canvas id="${idsCanvas}" width="400" height="200"></canvas>`;
                html += `</div>`;

                html += `</div>`;
            });

            html += `</div>`;
        });

        desempenhoDiv.innerHTML = html;

        // 3. Criamos os gráficos após o DOM ser atualizado
        setTimeout(() => {
            Object.keys(realizantes).forEach(nome => {
                const simuladosDoUsuario = realizantes[nome]; // <-- Correção aqui também

                Object.keys(simuladosDoUsuario).forEach(simuladoNome => {
                    const tentativas = simuladosDoUsuario[simuladoNome];
                    const tentativasOrdenadas = tentativas.sort((a, b) => a.vezesRealizado - b.vezesRealizado);
                    const idsCanvas = `grafico-${nome.replace(/\s+/g, '-')}-${simuladoNome.replace(/\s+/g, '-')}`;

                    const canvasElement = document.getElementById(idsCanvas);

                    if (canvasElement) {
                        const ctx = canvasElement.getContext('2d');

                        // Destrói gráfico anterior se existir
                        if (canvasElement.chart) {
                            canvasElement.chart.destroy();
                        }

                        // Cria novo gráfico
                        canvasElement.chart = new Chart(ctx, {
                            type: 'line',
                            data: {
                                labels: tentativasOrdenadas.map(t => `Tentativa ${t.vezesRealizado}`),
                                datasets: [{
                                    label: 'Desempenho (%)',
                                    data: tentativasOrdenadas.map(t => parseFloat(t.porcentagem)),
                                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                                    borderColor: 'rgba(54, 162, 235, 1)',
                                    borderWidth: 2,
                                    tension: 0.1
                                }]
                            },
                            options: {
                                responsive: true,
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        max: 100,
                                        ticks: {
                                            callback: function (value) {
                                                return value + '%';
                                            }
                                        }
                                    }
                                }
                            }
                        });
                    }
                });
            });
        }, 100);
    }
}

function editarSimulado(index) {
    const simuladosCriados = JSON.parse(localStorage.getItem('simuladosCriados')) || [];
    const simuladoCompleto = JSON.parse(localStorage.getItem('simuladosCompletos'))?.[simuladosCriados[index].id];

    if (simuladoCompleto) {
        // Preencher formulário com dados do simulado
        document.getElementById('nomeSimulado').value = simuladoCompleto.nome;
        document.getElementById('nomeCriador').value = simuladoCompleto.criador;
        document.getElementById('emailCriador').value = simuladoCompleto.email || '';

        // Limpar perguntas existentes
        document.getElementById('perguntasContainer').innerHTML = '';
        contadorPerguntas = 0;

        // Adicionar cada pergunta
        simuladoCompleto.perguntas.forEach(pergunta => {
            contadorPerguntas++;
            const id = contadorPerguntas;

            const perguntaDiv = document.createElement('div');
            perguntaDiv.className = 'pergunta';
            perguntaDiv.id = `pergunta${id}`;

            perguntaDiv.innerHTML = `
                        <div class="pergunta-header">
                            <h3>Pergunta ${id}</h3>
                            <button onclick="removerPergunta(${id})" class="btn-remover">Remover</button>
                        </div>
                        
                        <div class="form-group">
                            <label for="enunciado${id}">Enunciado:</label>
                            <textarea id="enunciado${id}" rows="3">${pergunta.enunciado.replace(/\\n/g, '\n')}</textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="complemento${id}">Complemento (opcional):</label>
                            <textarea id="complemento${id}" rows="2">${pergunta.complemento ? pergunta.complemento.replace(/\\n/g, '\n') : ''}</textarea>
                        </div>
                        
                        <div class="form-group">
                            <label>Imagem (opcional):</label>
                            <input type="file" id="imagem${id}" accept="image/*" onchange="carregarImagem(this, ${id})">
                            <input type="text" id="legendaImagem${id}" placeholder="Legenda para a imagem" value="${pergunta.legendaImagem || ''}">
                            ${pergunta.imagem ? `<img src="${pergunta.imagem}" style="max-width: 200px; display: block; margin-top: 5px;">` : ''}
                        </div>
                        
                        <div class="opcoes-header">
                            <h4>Opções de Resposta</h4>
                            <button onclick="adicionarOpcao(${id})">+ Adicionar Opção</button>
                        </div>
                        
                        <div id="opcoesContainer${id}" class="opcoes-container"></div>
                    `;

            document.getElementById('perguntasContainer').appendChild(perguntaDiv);

            // Adicionar opções
            pergunta.opcoes.forEach(opcao => {
                const opcoesContainer = document.getElementById(`opcoesContainer${id}`);
                const opcaoId = Date.now();

                const opcaoDiv = document.createElement('div');
                opcaoDiv.className = 'opcao';
                opcaoDiv.innerHTML = `
                            <div class="opcao-content">
                                <input type="text" placeholder="Texto da opção" class="opcao-texto" value="${opcao.texto.replace(/\\n/g, '\n')}">
                                <div class="opcao-actions">
                                    <label>
                                        <input type="checkbox" class="opcao-correta" ${opcao.correta ? 'checked' : ''}> Correta
                                    </label>
                                    <button onclick="removerOpcao(this)" class="btn-remover">Remover</button>
                                </div>
                            </div>
                            <div class="opcao-justificativa">
                                <input type="text" name="justificativa" placeholder="Justificativa" value="${opcao.justificativa.replace(/\\n/g, '\n')}">
                            </div>
                        `;

                opcoesContainer.appendChild(opcaoDiv);
            });
        });

        mostrarSecao('criar');
    } else {
        alert('Simulado não encontrado para edição.');
    }
}

function excluirSimulado(index) {
    if (confirm('Tem certeza que deseja excluir este simulado? Esta ação não pode ser desfeita.')) {
        const simuladosCriados = JSON.parse(localStorage.getItem('simuladosCriados')) || [];
        const simuladoId = simuladosCriados[index].id;

        // Remover do histórico de criados
        simuladosCriados.splice(index, 1);
        localStorage.setItem('simuladosCriados', JSON.stringify(simuladosCriados));

        // Remover dos simulados completos
        const simuladosCompletos = JSON.parse(localStorage.getItem('simuladosCompletos')) || {};
        delete simuladosCompletos[simuladoId];
        localStorage.setItem('simuladosCompletos', JSON.stringify(simuladosCompletos));

        // Remover do cache
        const simuladosCache = JSON.parse(localStorage.getItem('simuladosCache')) || {};
        delete simuladosCache[simuladoId];
        localStorage.setItem('simuladosCache', JSON.stringify(simuladosCache));

        // Atualizar exibição
        atualizarHistorico();
        alert('Simulado excluído com sucesso!');
    }
}

// Funções auxiliares
function validarEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitizeHTML(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getMensagemDesempenho(porcentagem) {
    if (porcentagem >= 0.9) return 'Excelente! Seu desempenho foi incrível!';
    if (porcentagem >= 0.7) return 'Muito bom! Você está no caminho certo.';
    if (porcentagem >= 0.5) return 'Bom, mas há espaço para melhorar. Revise os conceitos.';
    return 'Você pode melhorar! Recomendamos estudar mais o assunto.';
}

// Inicialização
document.addEventListener('DOMContentLoaded', function () {
    mostrarSecao('realizar');
    carregarSimuladosDisponiveis();
    atualizarHistorico();
});

// Verifica se há dados no histórico de desempenho
const historico = JSON.parse(localStorage.getItem('historicoDesempenho')) || [];
console.log("Dados do histórico de desempenho:", historico);

// Verifica a estrutura dos dados
if (historico.length > 0) {
    console.log("Exemplo de item do histórico:", historico[0]);
    console.log("Total de registros:", historico.length);

    // Verifica se os dados necessários existem
    historico.forEach((item, index) => {
        console.group(`Item ${index + 1}`);
        console.log("Nome do realizante:", item.nomeRealizante);
        console.log("Nome do simulado:", item.simuladoNome);
        console.log("Porcentagem:", item.porcentagem);
        console.log("Tentativa:", item.vezesRealizado);
        console.groupEnd();
    });
} else {
    console.warn("Nenhum dado encontrado no histórico de desempenho.");
    console.info("Realize pelo menos um simulado para gerar dados.");
}

//Limpa Historico de Desempenho
function limparHistoricoDesempenho() {
    const confirmacao = confirm("Tem certeza que deseja apagar todo o histórico de desempenho? Essa ação não pode ser desfeita.");
    if (confirmacao) {
        localStorage.removeItem('historicoDesempenho');
        atualizarHistorico();
        alert("Histórico de desempenho limpo com sucesso.");
    }
}