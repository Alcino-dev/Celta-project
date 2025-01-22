function initializeCharts(data) {
    // Verificar se há dados
    if (!data || data.length === 0) {
        console.error('Sem dados para exibir');
        return;
    }

    // Tratamento para evitar NaN
    const chartData = data.map(item => ({
        ...item,
        valor: parseFloat(item.valor) || 0,
        quantidade: parseInt(item.quantidade) || 0
    }));

    // Configuração do gráfico
    const config = {
        type: 'line',
        data: {
            labels: chartData.map(item => item.data),
            datasets: [{
                label: 'Vendas',
                data: chartData.map(item => item.valor),
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Relatório de Vendas'
                }
            }
        }
    };

    return new Chart(ctx, config);
} 