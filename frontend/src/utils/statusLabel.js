export function formatStatus(status) {
    const labels = {
        aberto: "Aberto",
        em_andamento: "Em andamento",
        resolvido: "Finalizado",
    };
    return labels[status] || status;
}

export function formatPriority(p) {
    const labels = {
        baixa: "Baixa",
        media: "Média",
        alta: "Alta",
    };
    return labels[p] || p;
}

export function formatCategory(c) {
    const labels = {
        suporte: "🛠️ Suporte Técnico",
        financeiro: "💰 Financeiro/Licença",
        customizacao: "✨ Customização (Progressiva)",
        logomarca: "🎨 Logomarca da Ótica",
        sugestao: "💡 Sugestão",
    };
    return labels[c] || c;
}

export function formatPlan(p) {
    const labels = {
        bronze: "🥉 Bronze",
        silver: "🥈 Silver",
        gold: "🥇 Gold",
        ruby: "💎 Ruby",
    };
    return labels[p] || p;
}
