export const formatDate = (dateInput) => {
    if (!dateInput) return '-';

    // Eğer backend'den [2026, 5, 10] gibi bir array gelirse string'e çevir
    let dateStr = dateInput;
    if (Array.isArray(dateInput)) {
        dateStr = `${dateInput[0]}-${String(dateInput[1]).padStart(2, '0')}-${String(dateInput[2]).padStart(2, '0')}`;
    }

    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('tr-TR', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    }).format(date);
};

export const formatDateTime = (dateInput) => {
    if (!dateInput) return '-';

    let dateStr = dateInput;
    if (Array.isArray(dateInput)) {
        dateStr = `${dateInput[0]}-${String(dateInput[1]).padStart(2, '0')}-${String(dateInput[2]).padStart(2, '0')}T${String(dateInput[3] || 0).padStart(2, '0')}:${String(dateInput[4] || 0).padStart(2, '0')}`;
    }

    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('tr-TR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    }).format(date);
};