/**
 * Backend, bir veri sağlayıcısı bu ortamda sunulmadığında `DATA_SOURCE_UNAVAILABLE`
 * kodlu tipli bir gövde döner. Bu bir arıza değil, bilinçli bir politika sonucudur:
 * kaynak ya lisans/şartlar gereği canlıda kapalıdır ya da giriş gerektirir.
 *
 * Arayüz bunu kırmızı hata yerine açıklayıcı bir bilgi kartıyla gösterir.
 *
 * Gövde şekli:
 * ```json
 * { "code": "DATA_SOURCE_UNAVAILABLE", "source": "fintables",
 *   "reason": "DISABLED" | "REQUIRES_AUTH", "message": "...", "status": 503 }
 * ```
 */
export const DATA_SOURCE_UNAVAILABLE = 'DATA_SOURCE_UNAVAILABLE';

/** Ham gövdenin bu kodu taşıyıp taşımadığı — interceptor da bunu kullanır. */
export const isDataSourceBody = (body) =>
    !!body && typeof body === 'object' && body.code === DATA_SOURCE_UNAVAILABLE;

/**
 * Bir axios hatasından (ya da doğrudan gövdeden) normalize edilmiş bilgi çıkarır.
 * Bu duruma ait değilse `null` döner — çağıran taraf normal hata akışına devam eder.
 *
 * @returns {{source: string, reason: string, message: string, requiresAuth: boolean}|null}
 */
export const asDataSourceError = (error) => {
    const body = error?.response?.data ?? error?.data ?? error;
    if (!isDataSourceBody(body)) return null;

    return {
        source: body.source || 'unknown',
        reason: body.reason || 'DISABLED',
        message: body.message || '',
        requiresAuth: body.reason === 'REQUIRES_AUTH'
    };
};
