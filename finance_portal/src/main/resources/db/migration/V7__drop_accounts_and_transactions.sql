-- Account ve Transaction modülleri kapsam dışı bırakıldığı için ilgili tablolar drop ediliyor.
-- Portföy modülü artık manuel takip (alış fiyatı + miktar) üzerinden çalışıyor;
-- hesap bakiyesi / işlem geçmişi tutulmuyor.

DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
