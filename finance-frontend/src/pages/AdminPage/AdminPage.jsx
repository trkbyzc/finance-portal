import React, { useState, useEffect } from 'react';
import { apiClient } from '../../config/apiClient';

export default function AdminPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Uygulama ilk açıldığında kullanıcı listesini getir
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            // 🚀 /api başlığından kurtulduk
            const response = await apiClient.get('/admin/users');
            // Yeni interceptor'ımız direkt data döndürdüğü için response yazıyoruz
            setUsers(response || []);
            setLoading(false);
        } catch (error) {
            console.error('Kullanıcılar çekilirken hata oluştu:', error);
            setLoading(false);
        }
    };

    const handleBan = async (userId, username, currentBanStatus) => {
        if (currentBanStatus) {
            // Ban kaldırma işlemi
            if (window.confirm(`${username} adlı kullanıcının banını kaldırmak istediğinize emin misiniz?`)) {
                try {
                    // 🚀 /api başlığından kurtulduk
                    await apiClient.post(`/admin/users/${userId}/unban`);
                    alert(`${username} kullanıcısının banı başarıyla kaldırıldı.`);
                    fetchUsers(); // Tabloyu yenile
                } catch (error) {
                    console.error(error);
                    alert('Hata oluştu!');
                }
            }
        } else {
            // Banlama işlemi (varsayılan 30 gün)
            const days = window.prompt(`${username} adlı kullanıcıyı kaç gün banlamak istiyorsunuz?`, "30");

            if (days && !isNaN(days)) {
                try {
                    // 🚀 /api başlığından kurtulduk
                    await apiClient.post(`/admin/users/${userId}/ban?days=${days}`);
                    alert(`${username} başarıyla banlandı.`);
                    fetchUsers(); // Tabloyu yenile
                } catch (error) {
                    console.error(error);
                    alert('Hata oluştu!');
                }
            }
        }
    };

    if (loading) {
        return <div className="text-center p-10 text-white">Yükleniyor...</div>;
    }

    return (
        <div className="p-10 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 text-red-500">🛡️ Yönetim Paneli - Kullanıcılar</h1>

            <div className="bg-[#131722] rounded-lg border border-[#2a2e39] overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-[#1e222d] text-[#868993] text-sm uppercase">
                    <tr>
                        <th className="py-4 px-6 border-b border-[#2a2e39]">Kullanıcı Adı</th>
                        <th className="py-4 px-6 border-b border-[#2a2e39]">E-Posta</th>
                        <th className="py-4 px-6 border-b border-[#2a2e39]">Durum</th>
                        <th className="py-4 px-6 border-b border-[#2a2e39]">Bitiş Tarihi</th>
                        <th className="py-4 px-6 border-b border-[#2a2e39] text-right">İşlem</th>
                    </tr>
                    </thead>
                    <tbody className="text-[#d1d4dc] text-sm divide-y divide-[#2a2e39]">
                    {users && users.length > 0 ? (
                        users.map((user) => (
                            <tr key={user.id} className="hover:bg-[#1e222d]/50 transition">
                                <td className="py-4 px-6 font-semibold">{user.username}</td>
                                <td className="py-4 px-6">{user.email || '-'}</td>


                                <td className="py-4 px-6">
                                    {user.banned /* BURAYI user.banned YAPIN */
                                        ? <span className="bg-red-500/20 text-red-500 px-2 py-1 rounded text-xs">Banlı</span>
                                        : <span className="bg-green-500/20 text-green-500 px-2 py-1 rounded text-xs">Aktif</span>
                                    }
                                </td>
                                <td className="py-4 px-6 text-[#868993]">
                                    {user.bannedUntil ? new Date(user.bannedUntil).toLocaleDateString('tr-TR') : '-'}
                                </td>
                                <td className="py-4 px-6 text-right">
                                    <button
                                        onClick={() => handleBan(user.id, user.username, user.banned)} /* BURAYI user.banned YAPIN */
                                        className={`px-4 py-1.5 rounded font-semibold transition ${
                                            user.banned /* BURAYI user.banned YAPIN */
                                                ? 'bg-[#2962ff] hover:bg-[#1e4db7] text-white'
                                                : 'bg-red-600 hover:bg-red-700 text-white'
                                        }`}
                                    >
                                        {user.banned ? 'Banı Kaldır' : 'Yasakla'} {/* BURAYI user.banned YAPIN */}
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="5" className="py-8 text-center text-[#868993]">Listelenecek kullanıcı bulunamadı.</td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}