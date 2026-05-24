import React from 'react';
import { useAuth } from '../../context/AuthContext';

const ProfilePage = () => {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-[#050505] p-6">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">Profil Bilgileri</h1>

                <div className="bg-[#1a1d29] rounded-lg p-6 space-y-4">
                    <div className="border-b border-[#2a2e39] pb-4">
                        <label className="text-[#868993] text-sm">Kullanıcı Adı</label>
                        <p className="text-white text-lg font-semibold">{user?.username || '-'}</p>
                    </div>

                    <div className="border-b border-[#2a2e39] pb-4">
                        <label className="text-[#868993] text-sm">E-posta</label>
                        <p className="text-white text-lg">{user?.email || '-'}</p>
                    </div>

                    <div className="border-b border-[#2a2e39] pb-4">
                        <label className="text-[#868993] text-sm">Ad Soyad</label>
                        <p className="text-white text-lg">{user?.name || '-'}</p>
                    </div>

                    <div>
                        <label className="text-[#868993] text-sm">Hesap Durumu</label>
                        <p className="text-[#089981] text-lg font-semibold">✓ Aktif</p>
                    </div>
                </div>

                <div className="mt-6 text-[#868993] text-sm">
                    <p>💡 Profil bilgileriniz Keycloak tarafından yönetilmektedir.</p>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
