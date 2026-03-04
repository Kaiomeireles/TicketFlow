export function formatDate(dateString) {
    if (!dateString) return "-";
    // Garante que o JS trate a string do SQLite como UTC (adicionando T e Z)
    const utcDate = dateString.includes("T") ? dateString : dateString.replace(" ", "T") + "Z";

    return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "America/Sao_Paulo"
    }).format(new Date(utcDate));
}

export function formatDateShort(dateString) {
    if (!dateString) return "-";
    const utcDate = dateString.includes("T") ? dateString : dateString.replace(" ", "T") + "Z";

    return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        timeZone: "America/Sao_Paulo"
    }).format(new Date(utcDate));
}
